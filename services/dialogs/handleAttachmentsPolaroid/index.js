const fs = require('fs');
const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getFBAttachmentId } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const fileHandling = require('../../helpers/fileHandling');
const helpers = require('../../helpers/helpers');
const stickers = require('../../gm/');
const s3 = require('../../../lib/aws/s3');
const stickerTemplates = require('../../helpers/stickerTemplates');
const smthWentWrong = require('../somethingWentWrong/');

// Processing images depending on dialog context
async function handleAttachmentsPolaroid(senderId, attachmentUrl, dialogStatus) {
  const funcName = 'handleAttachments()';
  log.info(
    `${funcName}: senderId = ${senderId}, attachmentUrl = ${attachmentUrl}, dialogStatus = ${dialogStatus}`,
  );
  try {
    // Process image depending on dialog status
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    if (!dialogStatus || (dialogStatus && !dialogStatus.includes('awaitingImage'))) {
      // Nice image but what do you want? [New sticker] [Help] etc
      const buttons = [
        templates.postbackButton(
          constants.btn_title_new_sticker,
          constants.btn_payload_new_sticker,
        ),
        templates.postbackButton(constants.btn_title_help, constants.btn_payload_help),
      ];
      await sendMessage(senderId, templates.buttonTemplate(constants.nice_image_but_wtf, buttons));
      return;
    }

    // Download image
    const fileDownload = await fileHandling.downloadImage(attachmentUrl, senderId);

    log.info(`${funcName}: fileDownload =`, fileDownload);
    if (fileDownload.status !== 200) {
      log.error(`${funcName}: got an error while downloading image from FB, aborting`);
      smthWentWrong(senderId);
      return;
    }

    // Generate a sticker with dummy text
    const fileName = fileDownload.data.split('/').slice(-1)[0];
    const sticker = await stickers.polaroidV1(fileName, constants.dummy_text);

    log.info(`${funcName}: sticker =`, sticker);
    if (sticker.status !== 200) {
      log.error(`${funcName}: got an error while making preview sticker, aborting`);
      smthWentWrong(senderId);
      return;
    }

    log.info(
      `${funcName}: sticker.data.fileName = ${sticker.data.fileName}, config.AWS_PREVIEW_FOLDER = ${
        config.AWS_PREVIEW_FOLDER
      }, constants.imgMimeType = ${constants.imgMimeType}`,
    );

    // Upload it to S3
    const imgStream = fs.createReadStream(sticker.data.stickerUrl);
    const s3ImageUrl = await s3.uploadToS3(
      sticker.data.fileName,
      config.AWS_PREVIEW_FOLDER,
      constants.imgMimeType,
      imgStream,
    );

    log.info(`${funcName}: s3ImageUrl =`, s3ImageUrl);
    if (s3ImageUrl.status !== 200) {
      log.error(`${funcName}: got an error while uploading preview sticker to S3, aborting`);
      smthWentWrong(senderId);
      return;
    }

    // Upload image from S3 to FB and get attachment id
    const gettingFbAttachmentId = await getFBAttachmentId(s3ImageUrl.data, 'image', true);

    log.info(`${funcName}: gettingFbAttachmentId = `, gettingFbAttachmentId);
    if (gettingFbAttachmentId.status !== 200) {
      log.error(
        `${funcName}: got an error while getting FB attachment id for preview sticker, aborting`,
      );
      smthWentWrong(senderId);
      return;
    }

    // We'll get a sticker like this
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, templates.textTemplate(constants.sticker_like_this));

    // Sticker preview (media template)
    const stickerPreview = templates.mediaTemplate('image', gettingFbAttachmentId.data);

    if (stickerPreview.status !== 200) {
      log.error(
        `${funcName}: got an error while making a media-template for preview sticker, aborting`,
      );
      smthWentWrong(senderId);
      return;
    }

    // Media template with a preview sticker
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, stickerPreview.data);

    // Button template with text "Now please send me the text for your sticker or replace the image
    // if needed" and button [Replace image]
    const buttons = [
      templates.postbackButton(
        constants.btn_title_replace_image,
        constants.btn_payload_replace_image,
      ),
    ];
    const promptImageReplace = templates.buttonTemplate(
      constants.replace_photo_or_provide_text,
      buttons,
    );
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, promptImageReplace);

    // Dialog status >> 'awaitingStickerText'
    const setStatus = await helpers.setStatus(
      senderId,
      `${stickerTemplates.polaroid1.templateCodeName}#${constants.status_awaiting_sticker_text}`,
    );
    log.info(`${funcName}: setStatus =`, setStatus);
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = handleAttachmentsPolaroid;
