const { promisify } = require('util');
const fs = require('fs');
const uuid = require('uuid/v4');
const path = require('path');
const stream = require('stream');
const lookup = require('soundcloud-lookup');
const youtubedl = require('youtube-dl');
const log = require('../config/logger')('controllers-login');
const { compress, helpersError } = require('../helpers/helpers');
const { upload, uploadVideo } = require('../aws');
const { getFbAttachmentId, inspectToken } = require('../lib/fb-graph-api/index');
const accountsController = require('../helpers/accounts');
const pageHelpers = require('../helpers/page');
const attachmentHelpers = require('../helpers/attachment');
const config = require('../config/');
const { videoSize, videoType, audioType } = require('../config/constants');
const {
  compressVideoV2,
  getThumbonail,
  compressAudio,
  compressVideoByParams,
  compressAudioByParams,
} = require('../helpers/mediaProcessing');

const delay = promisify(setTimeout);
const { Readable } = stream;
async function uploadImage(req, res) {
  console.log('\n\nuploadImage\n\n');
  try {
    log.info(req);
    log.info('========', req.file.fieldname);
    log.info(req.file.originalname);
    log.info(req.file.mimetype);
    const { originalname, mimetype } = req.file;
    const files = await compress(req.file);
    const awsUrl = await upload(originalname, mimetype, files);
    log.info('awsUrl', awsUrl);
    return res.json({ status: 'ok', imageUrl: awsUrl });
  } catch (err) {
    log.error('upload file failed:', err);
    const { status, error } = helpersError(err.message);
    return res.status(status).json(error);
  }
}
async function getAttachmentImage(req, res) {
  log.info('\n\ngetAttachmentImage\n\n');
  try {
    const id = req.headers.authorization;
    let timeOut = null;
    log.info(id);
    const {
      dataValues: { pageId },
    } = await accountsController.getItemForFacebookId(id);
    const { dataValues: userData } = await pageHelpers.getItemForId(pageId);
    await inspectToken(userData.pageToken, id).catch((err) => {
      log.error('err================', err.response.data.error.message);
      throw Error(`facebookError ${err.response.data.error.message}`);
    });
    log.info('========', req.file.fieldname);
    log.info(req.file.originalname);
    log.info(req.file.mimetype);
    log.info(`size: ${req.file.size / 1000000} MB`);
    const { originalname, mimetype } = req.file;
    let files = req.file.buffer;
    // pageId, type, originUrl, size
    const result = await attachmentHelpers.getAttachment(
      pageId,
      req.file.mimetype,
      req.file.originalname,
      req.file.size,
    );
    if (result) {
      return res.json({
        status: 'ok',
        imageUrl: result.dataValues.originUrl,
        attachmentId: result.dataValues.attachmentId,
      });
    }
    if (mimetype !== 'image/gif') {
      files = await compress(req.file);
    }
    if (mimetype === 'image/gif' && req.file.size > videoSize) {
      return res.status(413).send('Request Entity Too Large Error');
    }
    const params = {
      pageId,
      type: req.file.mimetype,
      originName: req.file.originalname,
      size: req.file.size,
    };
    const {
      dataValues: { id: newAttachmentId },
    } = await attachmentHelpers.saveAttachment(params);
    const ezTimeout = setTimeout(() => {
      timeOut = true;
      res.status(504).json({ id: newAttachmentId });
    }, 20000);
    const awsUrl = await upload(originalname, mimetype, files);
    log.info('awsUrl', awsUrl);
    await delay(config.IMAGE_S3_TO_FB_DELAY_MSEC);
    let attachmentImageId;
    attachmentImageId = await getFbAttachmentId(userData.pageToken, awsUrl, 'image').catch(
      async (err) => {
        log.error(`getAttachmentImage(): 1 try to upload: ${err.message}`);
        await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
        attachmentImageId = await getFbAttachmentId(userData.pageToken, awsUrl, 'image').catch(
          async (error) => {
            log.error(`getAttachmentImage(): 2 try to upload: ${error.message}`);
            attachmentImageId = await getFbAttachmentId(userData.pageToken, awsUrl, 'image').catch(
              async (error3) => {
                log.error(`getAttachmentImage(): 3 try to upload: ${error3.message}`);
                await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC) * 2);
                attachmentHelpers.deleteAttachment(newAttachmentId);
                throw Error(`facebookError ${err.response.data.error.message}`);
              },
            );
          },
        );
      },
    );
    log.info('attachmentId');
    if (attachmentImageId) {
      attachmentHelpers.updateAttachment(
        newAttachmentId,
        awsUrl,
        attachmentImageId.data.attachment_id,
      );
    } else {
      attachmentHelpers.deleteAttachment(newAttachmentId);
    }
    if (!timeOut) {
      clearTimeout(ezTimeout);
      return res.json({
        status: 'ok',
        imageUrl: awsUrl,
        attachmentId: attachmentImageId.data.attachment_id,
      });
    }
  } catch (err) {
    log.error('upload file failed:', err.message);
    // const { status, error } = helpersError(err.message);
    // res.status(status).json(error);
  }
}
/**
 * soundCloudUrlLookupAsync() gets an url to mp3 file on SoundCloud from
 * "raw" url like "https://soundcloud.com/garyvee/hard-work-patience"
 * @param {string} url "Raw" url
 * @param {string} key Client key id (like 'w0h3riQ69BdCnRuGq1IsVYxqn9uLJCJQ')
 */
function soundCloudUrlLookupAsync(url, key) {
  return new Promise((resolve, reject) => {
    lookup(url, key, (err, song) => {
      if (err !== null) reject(err);
      else resolve(song);
    });
  });
}
/**
 * transformGDriveUrl() transforms "sharable" Google Drive into url
 * which can be pushed to FB to get attachment id
 * @param {string} sharedUrl "Sharable" GDrive URL like
 * a) 'https://drive.google.com/open?id=1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5' or
 * b1) 'https://drive.google.com/file/d/1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5/view?usp=sharing
 * b2) 'https://drive.google.com/file/d/1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5/view
 * @returns {string} 1) Url like 'https://drive.google.com/uc?export=download&id=1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5' and
 * 2) file Id on GDrive like '1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5'
 */
function transformGDriveUrl(sharedUrl) {
  const funcName = 'transformGDriveUrl()';
  if (!sharedUrl || sharedUrl === '') {
    const message = 'No GDrive url was provided, aborting';
    log.error(`${funcName}: error = ${message}`);
    return { status: 'error', payload: message };
  }
  if (sharedUrl.indexOf('id=') === -1 && sharedUrl.indexOf('view') === -1) {
    const message = `Invalid GDrive url, can't find file id in ${sharedUrl}`;
    log.error(`${funcName}: error = ${message}`);
    return { status: 'error', payload: message };
  }
  const directgDriveUrlBasic = 'https://drive.google.com/uc?export=download&id=';
  let gDriveFileId;
  let gDriveUrl;
  if (sharedUrl.includes('id=')) {
    gDriveFileId = sharedUrl.slice(sharedUrl.indexOf('id=') + 3);
    gDriveUrl = `${directgDriveUrlBasic}${gDriveFileId}`;
  } else if (sharedUrl.includes('view')) {
    gDriveFileId = sharedUrl.split('/')[5];
    gDriveUrl = `${directgDriveUrlBasic}${gDriveFileId}`;
  }
  return { url: gDriveUrl, fileId: gDriveFileId };
}
/**
 * uploadUrl() is triggered on /upload/url and
 * uploads audio file to FB and gets FB attachment id
 * In case of Dropbox and GCloud input url is transformed,
 * in case of Soundcloud a direct link to file is fetched using 3rd party library
 */
async function uploadUrl(req, res) {
  const funcName = 'uploadUrl()';
  try {
    const id = req.headers.authorization;
    log.info(req.body);
    log.info(`${funcName}: id = ${req.headers.authorization}`);
    const {
      dataValues: { pageId },
    } = await accountsController.getItemForFacebookId(id);
    const { dataValues: userData } = await pageHelpers.getItemForId(pageId);
    await inspectToken(userData.pageToken, id).catch((err) => {
      log.error(`${funcName}: inspectToken error = ${err.response.data.error.message}`);
      throw Error(`facebookError ${err.response.data.error.message}`);
    });
    const { audioUrl } = req.body;
    log.info(`${funcName}: audioUrl = ${audioUrl}`);
    let audioUrlFormat = audioUrl; // Any link to mp3 file will work but only dropbox & soundcloud are "official" for now
    let size;
    let filename;
    let timeOut = false;
    // Dropbox
    if (audioUrl.includes('dropbox')) {
      filename = audioUrl.replace('https://www.dropbox.com', '').replace(/\//g, '');
      // At the moment we can't get file size without downloading it (e.g. to S3)
      size = videoSize;
      log.info(`${funcName}: Dropbox audio - filename = ${filename}, size = ${size}`);
      audioUrlFormat = audioUrl.indexOf('https://www.dropbox.com') === 0
        ? audioUrl.replace('www', 'dl').replace('?dl=0', '')
        : audioUrl;
    }
    // Soundcloud
    if (audioUrl.includes('soundcloud')) {
      // log.info(`${funcName}: url ${audioUrl} is from Soundcloud, fetching an url to mp3`);
      const songData = await soundCloudUrlLookupAsync(audioUrl, config.SOUNDCLOUD_CLIENT_ID).catch(
        (error) => {
          const message = `Failed to get url for mp3 file on SoundCloud, error: ${error}`;
          return res.status(500).send(message);
        },
      );
      filename = songData.title;
      size = songData.original_content_size;
      log.info(`${funcName}: Soundcloud audio - filename = ${filename}, size = ${size}`);
      if (size > videoSize) {
        return res
          .status(413)
          .send(`Request Entity Too Large Error (${Math.round(size / 1000000)} Mb)`);
      }
      if (songData && songData.stream_url) {
        audioUrlFormat = songData.stream_url;
      } else {
        const message = `Failed to get a link to mp3 on Soundcloud for url ${audioUrl}`;
        return res.status(500).json(message);
      }
    }
    // Google Drive
    if (audioUrl.includes('drive.google.com')) {
      const { url: gDriveUrl, fileId: gDriveFileId } = transformGDriveUrl(audioUrl);
      filename = gDriveFileId;
      // At the moment we can't get file size without downloading it (e.g. to S3)
      // So we'll be catching 'too-large' error when trying to upload attachment to FB
      size = 19999999;
      audioUrlFormat = gDriveUrl;
    }
    // Check for such file in our DB ("Attachments")
    const audioFile = await attachmentHelpers.getAttachment(pageId, audioType, filename, size);
    if (audioFile) {
      log.info(`${funcName} - result of fetching such Attachment in DB [see below]`);
      return res.json({
        status: 'ok',
        videoUrl: audioFile.dataValues.originUrl,
        attachmentId: audioFile.dataValues.attachmentId,
      });
    }
    const params = {
      pageId,
      type: audioType,
      originName: filename,
      size,
    };
    const {
      dataValues: { id: newAttachmentId },
    } = await attachmentHelpers.saveAttachment(params);
    const ezTimeout = setTimeout(() => {
      timeOut = true;
      res.status(504).json({ id: newAttachmentId });
    }, 20000);
    // Upload audio file to FB to get FB attachment id
    let attachmentId;
    attachmentId = await getFbAttachmentId(userData.pageToken, audioUrlFormat, 'audio').catch(
      async (err) => {
        log.error(`${funcName}: 1st try to upload result = ${err.response.data.error.message}`);
        // In case of error - retry after a delay
        await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
        attachmentId = await getFbAttachmentId(userData.pageToken, audioUrlFormat, 'audio').catch(
          (error) => {
            log.error(
              `${funcName}: 2nd try to upload result = ${error.response.data.error.message}`,
            );
            attachmentHelpers.deleteAttachment(newAttachmentId);
            clearTimeout(ezTimeout);
            throw Error(`${funcName}: facebookError = ${error.response.data.error.message}`);
          },
        );
      },
    );
    if (attachmentId) {
      attachmentHelpers.updateAttachment(
        newAttachmentId,
        audioUrl,
        attachmentId.data.attachment_id,
      );
    } else {
      attachmentHelpers.deleteAttachment(newAttachmentId);
    }
    if (!timeOut) {
      clearTimeout(ezTimeout);
      return res.json({
        status: 'ok',
        imageUrl: audioUrl,
        attachmentId: attachmentId.data.attachment_id,
      });
    }
  } catch (err) {
    if (err.message.includes('#100')) {
      return res.status(413).send('Request Entity Too Large Error');
    }
    const { status, error } = helpersError(err.message);
    return res.status(status).json(error);
  }
}
/**
 * processVideo() is triggered on /upload/video and uploads videos to FB to
 * get attachment id. In case of Youtube it first downloads video from Youtube
 * in best quality under allowed file size limit and saves it to S3.
 * Then it
 * 1) Uploads video from S3 (Youtube) or GDrive to FB and gets FB attachment id;
 * 2) Saves corresponding data to "Attachments" table
 * 3) Returns original video file url and FB attachment id
 */
async function processVideo(req, res) {
  const funcName = 'processVideo()';
  try {
    log.info(`${funcName}: req.body [see below]`);
    const id = req.headers.authorization;
    log.info(`${funcName}: id = ${id}`);
    const { videoUrl } = req.body;
    let { videoSource } = req.body; // videoSource = 'youtube', 'gdrive'
    // Before frontend is ready
    if (!videoSource) videoSource = 'youtube';
    log.info(`${funcName}: videoSource = ${videoSource}, videoUrl = ${videoUrl}`);
    if (!id || !videoSource || !videoUrl) {
      const message = 'User id and/or videoSource and/or videoUrl missing, aborting..';
      log.error(`${funcName}: error: ${message}`);
      return res.status(500).send({ status: 'error', payload: message });
    }
    // Get a record for user fb id from "Accounts", retrieve pageId
    const {
      dataValues: { pageId },
    } = await accountsController.getItemForFacebookId(id); // what if user has several pages attached?
    // Get data for page with pageId
    const { dataValues: userData } = await pageHelpers.getItemForId(pageId);
    // Check if page token is Ok
    await inspectToken(userData.pageToken, id).catch((err) => {
      log.error(`${funcName}: err = ${err.response.data.error.message}`);
      throw Error(`facebookError ${err.response.data.error.message}`);
    });
    // Youtube
    if (videoSource === 'youtube') {
      // Retrieve video from Youtube that satisfies options
      const options = ['-f', 'best[filesize<20M]/best'];
      const video = youtubedl(req.body.videoUrl, options, { maxBuffer: Infinity });
      let filename;
      let size;
      video.on('error', (err) => {
        log.error('error 2:', err.message);
        return res.status(500).send({ status: 'error', payload: 'Invalid video file source' });
      });
      video.on('info', async (info) => {
        log.info('Download started');
        filename = info._filename;
        ({ size } = info);
        log.info(`${funcName}: size = ${info.size / 1000000} MB`);
        if (info.size > videoSize) {
          video.resume();
          return res.status(413).send('Request Entity Too Large Error');
        }
        // Retrieve a record from "Attachments" for a given file
        const result = await attachmentHelpers.getAttachment(pageId, videoType, filename, size);
        if (result) {
          log.info(`${funcName}: file data [see below]`);
          log.info(`${funcName}: such attachment already exists! Using data from our DB`);
          return res.json({
            status: 'ok',
            videoUrl: result.dataValues.originUrl,
            attachmentId: result.dataValues.attachmentId,
          });
        }
        const paramsCreate = {
          pageId,
          type: videoType,
          originName: filename,
          originUrl: req.body.videoUrl,
          size,
        };
        const {
          dataValues: { id: newAttachmentId },
        } = await attachmentHelpers.saveAttachment(paramsCreate);
        res.status(504).json({ id: newAttachmentId });
        // Upload video file to s3 and get a direct link
        const awsUrl = await uploadVideo(video);
        log.info(`${funcName}: awsUrl = ${awsUrl}`);
        // Delay for s3 servers to sync info about file location (agains FB error #100)
        await delay(config.IMAGE_S3_TO_FB_DELAY_MSEC);
        // Upload video file to FB to get FB attachment id
        let attachmentImageId;
        attachmentImageId = await getFbAttachmentId(userData.pageToken, awsUrl, 'video').catch(
          async (err) => {
            log.error(`${funcName}: 1st try to upload result = ${err.message}`);
            // In case of error - retry after a delay
            await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
            attachmentImageId = await getFbAttachmentId(userData.pageToken, awsUrl, 'video').catch(
              (error) => {
                log.error(
                  `${funcName}: 2nd try to upload result = ${error.response.data.error.message}`,
                );
                attachmentHelpers.deleteAttachment(newAttachmentId);
                throw Error(`${funcName}: facebookError = ${error.response.data.error.message}`);
              },
            );
          },
        );
        if (attachmentImageId) {
          attachmentHelpers.updateAttachment(
            newAttachmentId,
            awsUrl,
            attachmentImageId.data.attachment_id,
          );
        } else {
          attachmentHelpers.deleteAttachment(newAttachmentId);
        }
      });
      // Google Drive
    } else if (videoSource === 'gdrive') {
      // Transform GDrive link
      const { url: gDriveUrl, fileId: gDriveFileId } = transformGDriveUrl(videoUrl);
      log.info(`${funcName}: direct gDriveUrl = ${gDriveUrl}`);
      // Retrieve a record from "Attachments" for a given file
      const fileSize = 19999999;
      const attachment = await attachmentHelpers.getAttachment(
        pageId,
        videoType,
        gDriveFileId,
        fileSize,
      );
      if (attachment) {
        log.info(`${funcName}: attachment data [see below]`);
        log.info(`${funcName}: such attachment already exists! Using data from our DB`);
        return res.json({
          status: 'ok',
          videoUrl: attachment.dataValues.originUrl,
          attachmentId: attachment.dataValues.attachmentId,
        });
      }
      const paramsCreate = {
        pageId,
        type: videoType,
        originName: gDriveFileId,
        originUrl: req.body.videoUrl,
        size: fileSize,
      };
      const {
        dataValues: { id: newAttachmentId },
      } = await attachmentHelpers.saveAttachment(paramsCreate);
      res.status(504).json({ id: newAttachmentId });
      // Upload video file to FB to get FB attachment id
      let attachmentId;
      attachmentId = await getFbAttachmentId(userData.pageToken, gDriveUrl, 'video').catch(
        async (err) => {
          log.error(`${funcName}: 1st try to upload result = ${err.response.data.error.message}`);
          // In case of error - retry after a delay
          await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
          attachmentId = await getFbAttachmentId(userData.pageToken, gDriveUrl, 'video').catch(
            (error) => {
              log.error(
                `${funcName}: 2nd try to upload result = ${error.response.data.error.message}`,
              );
              attachmentHelpers.deleteAttachment(newAttachmentId);
              throw Error(`${funcName}: facebookError = ${error.response.data.error.message}`);
            },
          );
        },
      );
      // Save data about attachment to "Attachments"
      if (attachmentId) {
        attachmentHelpers.updateAttachment(
          newAttachmentId,
          videoUrl,
          attachmentId.data.attachment_id,
        );
      } else {
        attachmentHelpers.deleteAttachment(newAttachmentId);
      }
      // Other sources
    } else {
      return res.status(500).send({ status: 'error', payload: 'Invalid video file source' });
    }
  } catch (err) {
    log.error('Error save UrlVideo', err.message);
  }
}
/**
 * uploadVideoFromGDrive() is triggered on /upload/videoGDrive and
 * uploads video from Google Drive to FB and returns FB attachment id
 * Links like 'https://drive.google.com/open?id=1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5' need to be
 * transformed to 'https://drive.google.com/uc?export=download&id=1AFFREjegNrp2x7cbhwlRVbeBDyDY5FP5'
 */
async function uploadVideoFromGDrive(req, res) {
  const funcName = 'uploadVideoFromGDrive()';
  try {
    log.info(`${funcName}: req.body [see below]`);
    log.info(req.body);
    const id = req.headers.authorization;
    log.info(`${funcName}: id = ${id}`);
    const { pageId, gDriveVideoUrl } = req.body;
    log.info(`${funcName}: pageId = ${pageId}, gDriveVideoUrl = ${gDriveVideoUrl}`);
    if (!id || !pageId || !gDriveVideoUrl) {
      const message = 'User id and/or page id and/or GDrive video url missing, aborting..';
      log.error(`${funcName}: error: ${message}`);
      return res.status(500).send({ status: 'error', payload: message });
    }
    // Get data for page with pageId
    const { dataValues: userData } = await pageHelpers.getItemForId(pageId);
    // Check if page token is Ok
    await inspectToken(userData.pageToken, id).catch((err) => {
      log.error(`${funcName}: err = ${err.response.data.error.message}`);
      throw Error(`facebookError ${err.response.data.error.message}`);
    });
    // @TODO: How to check file size on GDrive before pushing file to FB?
    // Transform GDrive link
    const { url: gDriveUrl, fileId: gDriveFileId } = transformGDriveUrl(gDriveVideoUrl);
    log.info(`${funcName}: direct gDriveUrl = ${gDriveUrl}`);
    // Retrieve a record from "Attachments" for a given file
    const fileSize = 19999999;
    const attachment = await attachmentHelpers.getAttachment(
      pageId,
      videoType,
      gDriveFileId,
      fileSize,
    );
    if (attachment) {
      log.info(`${funcName}: attachment data [see below]`);
      log.info(attachment);
      log.info(`${funcName}: such attachment already exists! Using data from our DB`);
      return res.json({
        status: 'ok',
        videoUrl: attachment.dataValues.originUrl,
        attachmentId: attachment.dataValues.attachmentId,
      });
    }
    // Upload video file to FB to get FB attachment id
    let attachmentId;
    attachmentId = await getFbAttachmentId(userData.pageToken, gDriveUrl, 'video').catch(
      async (err) => {
        log.error(`${funcName}: 1st try to upload result = ${err.response.data.error.message}`);
        // In case of error - retry after a delay
        await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
        attachmentId = await getFbAttachmentId(userData.pageToken, gDriveUrl, 'video').catch(
          (error) => {
            log.error(
              `${funcName}: 2nd try to upload result = ${error.response.data.error.message}`,
            );
            throw Error(`${funcName}: facebookError = ${error.response.data.error.message}`);
          },
        );
      },
    );
    log.info(`${funcName}: attachmentId = ${attachmentId}`);
    // Save data about attachment to "Attachments"
    const params = {
      pageId,
      type: videoType,
      originName: gDriveFileId, // @TODO: How to get file name?
      originUrl: gDriveVideoUrl,
      attachmentId: attachmentId.data.attachment_id,
      size: 19999999, // @TODO: How to get file size?
    };
    attachmentHelpers.saveAttachment(params);
    log.info(`${funcName}: attachmentImageId.data [see below]`);
    log.info(attachmentId.data);
    return res.json({
      status: 'ok',
      videoUrl: gDriveVideoUrl,
      attachmentId: attachmentId.data.attachment_id,
    });
  } catch (err) {
    log.error(`${funcName}: file upload failed = ${err}`);
    if (err.message.includes('#100')) {
      return res.status(413).send('Request Entity Too Large Error');
    }
    const { status, error } = helpersError(err.message);
    return res.status(status).json(error);
  }
}
/**
 * bufferToStream() converts buffer data to stream
 */
function bufferToStream(buffer) {
  const duplexStream = new Readable();
  duplexStream.push(buffer);
  duplexStream.push(null);
  return duplexStream;
}

/**
 * deleteTempMediaFiles() deletes temporary media files
 * @param {string} sourceFile Path to source media file
 * @param {string} mediaType 'audio' or 'video' (so far)
 * @param {string} compressedMediaDir Path to directory /uploads/compressed
 * @param {string} compressedMediaName Name of compressed file (uuid)
 * @param {string} fileExtension .mp4 or .mp3
 * @param {string} thumbDir Path to /uploads/thumbonails
 */
function deleteTempMediaFiles(
  sourceFile,
  mediaType,
  compressedMediaDir,
  compressedMediaName,
  fileExtension,
  thumbDir,
) {
  const funcName = 'deleteTempMediaFiles()';
  log.info(
    `${funcName}: sourceFile = ${sourceFile}, mediaType = ${mediaType}, compressedMediaDir = ${compressedMediaDir}, compressedMediaName = ${compressedMediaName}, fileExtension = ${fileExtension}, thumbDir = ${thumbDir}`,
  );
  try {
    log.info(`${funcName}: Deleting source file ${sourceFile}`);
    if (fs.existsSync(sourceFile)) {
      fs.unlink(sourceFile, (err) => {
        if (err) log.error(`${funcName}: Failed to remove file ${sourceFile}`);
      });
    } else {
      log.info(`${funcName}: file ${sourceFile} does not exist`);
    }

    if (compressedMediaName) {
      if (fs.existsSync(`${compressedMediaDir}/${compressedMediaName}${fileExtension}`)) {
        log.info(
          `${funcName}: Deleting compressed file ${compressedMediaDir}/${compressedMediaName}${fileExtension}`,
        );
        fs.unlink(`${compressedMediaDir}/${compressedMediaName}${fileExtension}`, (err) => {
          if (err) {
            log.error(
              `${funcName}: Failed to remove file ${compressedMediaDir}/${compressedMediaName}${fileExtension}`,
            );
          }
        });
      } else {
        log.info(
          `${funcName}: file ${compressedMediaDir}/${compressedMediaName}${fileExtension} does not exist`,
        );
      }

      // Deleting thumbonail file (for video)
      if (mediaType === 'video') {
        if (fs.existsSync(`${thumbDir}/${compressedMediaName}.png`)) {
          log.info(`${funcName}: Deleting thumbonail file ${thumbDir}/${compressedMediaName}.png`);
          fs.unlink(`${thumbDir}/${compressedMediaName}.png`, (err) => {
            if (err) {
              log.error(
                `${funcName}: Failed to remove file ${thumbDir}/${compressedMediaName}.png`,
              );
            }
          });
        } else {
          log.info(`${funcName}: file ${thumbDir}/${compressedMediaName}.png does not exist`);
        }
      }
    }

    const message = 'All files deleted';
    log.info(`${funcName}: ${message}`);
    return { status: 'ok', payload: message };
  } catch (error) {
    const message = 'Failed to remove temporaty media files';
    log.error(`${funcName}: ${message}`);
    return { status: 'error', payload: message };
  }
}

/**
 * directUploadCompress() handles requests to /directUploadCompress
 * Processes media (vide, audio) uploaded from devices
 * Checks for size, tries to compress, get FB attachment id, uploads to S3,
 * saves data to DB
 */
async function directUploadCompress(req, res) {
  const funcName = 'directUploadCompress()';
  // We'll be saving thumbonail images in the same /uploads/thumbonails
  const thumbDir = path.join(__dirname, '../', 'uploads/thumbonails');
  const compressedMediaDir = path.join(__dirname, '../', 'uploads/compressed');
  try {
    const userId = req.headers.authorization;
    log.info(`${funcName}: userId = ${userId}`);
    const attachmentType = req.headers.filetype;
    log.info(`${funcName}: attachmentType = ${attachmentType}`);
    // Get a record for user with a given FB userId from "Accounts"
    const {
      dataValues: { pageId },
    } = await accountsController.getItemForFacebookId(userId);
    // Get data for page with pageId
    const { dataValues: userData } = await pageHelpers.getItemForId(pageId);
    const {
      fieldname, originalname, mimetype, size, path: filePath,
    } = req.file;
    log.info(
      `${funcName}: req.file => fieldname = ${fieldname}, originalname = ${originalname}, mimetype = ${mimetype}, size = ${size
        / 1000000} MB, path = ${filePath}`,
    );
    const inputPath = path.join(__dirname, '../', filePath);

    // Check if page token is Ok
    await inspectToken(userData.pageToken, userId).catch((err) => {
      log.error(`${funcName}: err = ${err.response.data.error.message}`);
      deleteTempMediaFiles(inputPath);
      throw Error(`facebookError ${err.response.data.error.message}`);
    });

    // We will be rejecting files > 200Mb at once
    if (size > 50 * 1000000) {
      deleteTempMediaFiles(inputPath);
    }
    // Check if such file exists in DB
    log.info(
      `${funcName}: retrieving record from "Attachments" for pageId ${pageId}, mimetype ${mimetype}, originalname ${originalname} and size ${size}`,
    );
    const result = await attachmentHelpers.getAttachment(pageId, mimetype, originalname, size);
    if (result) {
      log.info(
        `${funcName}: Attachment with name ${originalname}, type ${mimetype} and size ${size} already exists! Using data from our DB`,
      );
      log.info(
        `${funcName}: record #${result.dataValues.id}, status = 'ok', imageUrl = ${
          result.dataValues.originUrl
        }, attachmentId = ${result.dataValues.attachmentId}, thumbUrl = ${
          result.dataValues.thumbUrl
        }`,
      );
      deleteTempMediaFiles(inputPath);
      return res.status(200).send({
        status: 'ok',
        imageUrl: result.dataValues.originUrl,
        attachmentId: result.dataValues.attachmentId,
        thumbUrl: result.dataValues.thumbUrl,
      });
    }
    // If new file
    const newFileParams = {
      pageId,
      type: mimetype,
      originName: originalname,
      size,
    };
    log.info(`${funcName}: saving data to DB about media file = `, newFileParams);
    const {
      dataValues: { id: newAttachmentDBId },
    } = await attachmentHelpers.saveAttachment(newFileParams);
    // Tell frontend to call later to /status/:id for results of processing/getting FB Id
    res.status(504).json({ id: newAttachmentDBId });
    const [fileName] = inputPath.split('/').slice(-1);
    const originalExtension = path.extname(inputPath);
    let fileExtension = originalExtension;
    log.info(`${funcName}: Original file extension = ${fileExtension}`);
    let fileUrl = '';
    const compressedMediaName = uuid();

    // Process video
    if (attachmentType === 'video') {
      log.info(`${funcName}: processing VIDEO`);
      fileExtension = '.mp4';
      let compressedVideoFileName = '';
      // Compress if needed
      if (size > videoSize) {
        // TEMP: 1 instead of videoSize
        const videoCompressed = await compressVideoV2(
          inputPath,
          compressedMediaDir,
          compressedMediaName,
        );
        if (!videoCompressed.status) {
          const message = `Error processing video: ${inputPath}, deleting record ${newAttachmentDBId} in DB and source file`;
          log.error(`${funcName}: ${message}`);
          deleteTempMediaFiles(inputPath);
          // Delete attachment record in DB
          return attachmentHelpers.deleteAttachment(newAttachmentDBId);
        }
        if (videoCompressed.status && videoCompressed.payload === '413') {
          const message = 'Video file is too big even after compression, aborting, deleting source file';
          log.info(`${funcName}: ${message}`);
          deleteTempMediaFiles(inputPath);
          // Update attachment record in DB so that /status/:id will show that file is too big
          return attachmentHelpers.updateAttachment(newAttachmentDBId, '413', '413');
        }
        compressedVideoFileName = videoCompressed.payload;
        const message = `${funcName}: Video ${fileName} finished processing and saved as ${compressedVideoFileName}`;
        log.info(`${funcName}: ${message}`);
      } else {
        log.info(
          `${funcName}: File ${fileName} is ${size / 1000000} Mb (<${videoSize
            / 1000000} Mb), no compression is needed, but non-mp4 files should be >> mp4 and then proceed to making a thumbonail`,
        );
        log.info(`${funcName}: Original file extension = ${path.extname(inputPath)}`);

        if (originalExtension.toLowerCase() === '.mp4') {
          // Simply copy
          log.info(
            `${funcName}: Original file extension is ${originalExtension.toLowerCase()} and thus it can be simply copied`,
          );
          fs.createReadStream(inputPath).pipe(
            fs.createWriteStream(`${compressedMediaDir}/${compressedMediaName}${fileExtension}`),
          );
        } else {
          // Recompress to mp4 (no resize, no bitrate reduction) under new (uuid) name
          log.info(
            `${funcName}: Original file extension is ${originalExtension} >> recompress to mp4`,
          );
          const allToMp4 = await compressVideoByParams(
            inputPath,
            compressedMediaDir,
            compressedMediaName,
            false,
            false,
            false,
          );
          log.info(`${funcName}: result of recompressing to mp4 = `, allToMp4);
          if (!allToMp4.status) {
            const message = `Error processing video (recompressing to mp4): ${allToMp4}, aborting`;
            log.error(`${funcName}: ${message}`);
            deleteTempMediaFiles(inputPath);
            // Delete attachment record in DB
            return attachmentHelpers.deleteAttachment(newAttachmentDBId);
          }
        }
      }
      // Save thumbonail (from original video ;)
      await getThumbonail(inputPath, thumbDir, compressedMediaName).catch((error) => {
        const message = `Minor error saving thumbonail for video: ${fileName}`;
        log.info(`${funcName}: ${message} = `, error);
        // fluent-ffmpeg or ffmpeg throws some empty ({}) error while (successfully) creating a screenshot
        // We won't be deleting record in "Attachments" in this case. Probably need some default image for thumbonail
      });
      const message = `${funcName}: Saved a thumbonail for video ${fileName}`;
      log.info(`${funcName} = ${message}`);

      fileUrl = `https://${config.DOMAIN}/compressed/${compressedMediaName}${fileExtension}`;
    }

    // Process audio
    if (attachmentType === 'audio') {
      log.info(`${funcName}: processing AUDIO`);
      fileExtension = '.mp3';
      let compressedAudioFileName = '';
      // Compress if needed
      if (size > videoSize) {
        // TEMP: 1 instead of videoSize
        const audioCompressed = await compressAudio(
          inputPath,
          compressedMediaDir,
          compressedMediaName,
        );
        if (!audioCompressed.status) {
          const message = `Error processing audio: ${inputPath}, deleting record ${newAttachmentDBId} in DB and source file`;
          log.error(`${funcName}: ${message}`);
          deleteTempMediaFiles(inputPath);
          // Delete attachment record in DB
          return attachmentHelpers.deleteAttachment(newAttachmentDBId);
        }
        if (audioCompressed.status && audioCompressed.payload === '413') {
          const message = 'Audio file is too big even after compression, aborting, deleting source file';
          log.info(`${funcName}: ${message}`);
          deleteTempMediaFiles(inputPath);
          // Delete attachment record in DB
          return attachmentHelpers.deleteAttachment(newAttachmentDBId);
        }
        compressedAudioFileName = audioCompressed.payload;
        const message = `${funcName}: Audio ${fileName} finished processing and saved as ${compressedAudioFileName}`;
        log.info(`${funcName}: ${message}`);
      } else {
        log.info(
          `${funcName}: File ${fileName} is < ${size / 1000000} Mb (<${videoSize
            / 1000000} Mb), no compression is needed, but non-mp3 files should be >> mp3`,
        );
        log.info(`${funcName}: File extension = ${path.extname(inputPath)}`);

        if (originalExtension.toLowerCase() === '.mp3') {
          // Simply copy
          log.info(
            `${funcName}: Original file extension is ${originalExtension.toLowerCase()} and thus it can be simply copied`,
          );
          fs.createReadStream(inputPath).pipe(
            fs.createWriteStream(`${compressedMediaDir}/${compressedMediaName}${fileExtension}`),
          );
        } else {
          // Recompress to mp3 (no bitrate reduction) under new (uuid) name
          log.info(
            `${funcName}: Original file extension is ${originalExtension} >> recompress to mp3`,
          );
          const allToMp3 = await compressAudioByParams(
            inputPath,
            compressedMediaDir,
            compressedMediaName,
            false,
            false,
          );
          log.info(`${funcName}: result of recompressing to mp3 = `, allToMp3);
          if (!allToMp3.status) {
            const message = `Error processing audio (recompressing to mp3): ${allToMp3}, aborting`;
            log.error(`${funcName}: ${message}`);
            deleteTempMediaFiles(inputPath);
            // Delete attachment record in DB
            return attachmentHelpers.deleteAttachment(newAttachmentDBId);
          }
        }
      }
      fileUrl = `https://${config.DOMAIN}/compressed/${compressedMediaName}${fileExtension}`;
    }

    // Same for all media types:
    // Upload media file to FB
    log.info(`${funcName}: getting Facebook attachment id...`);
    log.info(`${funcName}: fileUrl = `, fileUrl);
    let attachmentIdData;
    let fbAttachmentId;
    attachmentIdData = await getFbAttachmentId(userData.pageToken, fileUrl, attachmentType).catch(
      async (err) => {
        log.error(`getAttachmentImage(): the 1st try to upload: ${err.message}`);
        await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC / 2));
        attachmentIdData = await getFbAttachmentId(
          userData.pageToken,
          fileUrl,
          attachmentType,
        ).catch(async (error) => {
          log.error(`getAttachmentImage(): the 2nd try to upload: ${error.message}`);
          attachmentIdData = await getFbAttachmentId(
            userData.pageToken,
            fileUrl,
            attachmentType,
          ).catch(async (error3) => {
            log.error(`getAttachmentImage(): the 3rd try to upload: ${error3.message}`);
            await delay(Math.round(config.IMAGE_S3_TO_FB_DELAY_MSEC) * 2);
            attachmentHelpers.deleteAttachment(newAttachmentDBId);
            // Delete files (original, compressed, thumbonail)
            deleteTempMediaFiles(
              inputPath,
              attachmentType,
              compressedMediaDir,
              compressedMediaName,
              fileExtension,
              thumbDir,
            );
            throw Error(`facebookError ${err.response.data.error.message}`);
          });
        });
      },
    );

    // If Facebook attachment id is received, save audio to S3
    if (attachmentIdData) {
      fbAttachmentId = attachmentIdData.data.attachment_id;

      let mediaS3Url = '';
      if (fs.existsSync(`${compressedMediaDir}/${compressedMediaName}${fileExtension}`)) {
        const mediaStream = fs.createReadStream(
          `${compressedMediaDir}/${compressedMediaName}${fileExtension}`,
        );
        mediaS3Url = await uploadVideo(
          mediaStream,
          `${compressedMediaName}${fileExtension}`,
          mimetype,
        );
        log.info(`${funcName}: mediaS3Url = `, mediaS3Url);
      } else {
        log.error(
          `${funcName}: file ${compressedMediaDir}/${compressedMediaName}${fileExtension} doesn't exist`,
        );
      }

      let thumbS3Url = '';
      if (attachmentType === 'video') {
        if (fs.existsSync(`${thumbDir}/${compressedMediaName}.png`)) {
          const thumbUrl = `${thumbDir}/${compressedMediaName}.png`;
          const thumbStream = fs.createReadStream(thumbUrl);
          thumbS3Url = await uploadVideo(thumbStream, `${compressedMediaName}.png`, 'image/png');
          log.info(`${funcName}: thumbS3Url = `, thumbS3Url);
        } else {
          log.error(
            `${funcName}: file ${compressedMediaDir}/${compressedMediaName}${fileExtension} doesn't exist`,
          );
        }
      }

      // Update attachment's record in DB
      if (fbAttachmentId) {
        attachmentHelpers.updateAttachment(
          newAttachmentDBId,
          mediaS3Url,
          fbAttachmentId,
          thumbS3Url,
        );
        log.info(
          `${funcName}: FB attachmentId = ${fbAttachmentId}, updated record #${newAttachmentDBId} in "Attachments" (mediaS3Url, attachmentId, thumbS3Url)`,
        );
      }
    } else {
      log.info(`${funcName}: Failed to get FB attachment Id, removing record in DB`);
      attachmentHelpers.deleteAttachment(newAttachmentDBId);
    }
    // Delete files (original, compressed, thumbonail)
    deleteTempMediaFiles(
      inputPath,
      attachmentType,
      compressedMediaDir,
      compressedMediaName,
      fileExtension,
      thumbDir,
    );
    log.info(`${funcName}: Media processing finished.`);
  } catch (error) {
    const message = 'Failed to process media file, error: ';
    log.error(`${funcName}: ${message}`, error);
  }
}
module.exports = {
  uploadImage,
  uploadUrl,
  getAttachmentImage,
  processVideo,
  transformGDriveUrl,
  directUploadCompress,
};
