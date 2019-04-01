const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const log = require('../config/logger')('controllers-login');
const {
  videoSize: maxVideoSizeBytes,
  bitrateReducedToPrcnt,
  minVideoWidthPx,
  minVideoHeightPx,
} = require('../config/constants');

/**
 * getVideoMetadataAsync() gets video metadata using fluent-ffmpeg/ffprobe
 * @param {string} filePath Path to video file
 */
async function getMediaMetadataAsync(filePath) {
  const funcName = 'getVideoMetadataAsync()';
  return new Promise((resolve, reject) => {
    log.info(`${funcName}: filePath: `, filePath);

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log.error(`${funcName}: failed to get video metadata, error`, err);
        reject(err);
      }
      if (metadata) {
        resolve(metadata);
      }
    });
  });
}

/**
 * Returns file size in bytes
 * @param {string} filename Path to file
 */
function getFilesizeInBytes(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
}

/**
 * compressAudioByParams() compresses reduces audio bitrate by 50% but >=32kb/sec
 * @param {string} mnediaInput Path to source file
 * @param {string} compressedMediasDir Directory to store compressed files
 * @param {string} compressedMediaName Name for compressed file
 * @param {bool} reduceBitrate If to reduce bitrate to 32kbit/sec
 * @param {bool} probe If "true" - only the 1st 10sec will be compressed (when searching for optimal compression)
 * and the resulting file will be deleted after getting its size
 */
async function compressAudioByParams(
  mediaInput,
  compressedMediasDir,
  compressedMediaName,
  reduceBitrate = false,
  probe = false,
) {
  const funcName = 'compressAudioByParams()';
  const outputAudioExtension = 'mp3';
  const minBitRatePerChannel = 32;
  log.info(
    `${funcName}: mediaInput = ${mediaInput}, compressedMediasDir = ${compressedMediasDir}, compressedMediaName = ${compressedMediaName}, reduceBitrate = ${reduceBitrate}, probe = ${probe}, minBitRatePerChannel = ${minBitRatePerChannel}, outputAudioExtension = ${outputAudioExtension}`,
  );

  const mediaMetadata = await getMediaMetadataAsync(mediaInput);
  log.info(`${funcName}: initial metadata for file ${mediaInput} = `, mediaMetadata);

  let { duration } = mediaMetadata.format;
  log.info(`${funcName}: duration = ${duration}`);
  if (probe) {
    if (duration > 10) {
      duration = 10;
    }
  }

  const { bit_rate } = mediaMetadata.format;
  let bitrate = Math.round(bit_rate / 1000);
  log.info(`${funcName}: initial bitrate = ${bitrate}`);
  if (reduceBitrate) {
    if (bitrate / 2 < minBitRatePerChannel) {
      bitrate = minBitRatePerChannel;
    } else {
      bitrate /= 2;
    }
  }
  log.info(`${funcName}: applying bitrate = ${bitrate}`);

  return new Promise((resolve, reject) => {
    const finalMediaPath = `${compressedMediasDir}/${compressedMediaName}.${outputAudioExtension}`;

    ffmpeg(mediaInput)
      .output(finalMediaPath)
      .toFormat(outputAudioExtension)
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .duration(duration)

      .on('start', (commandLine) => {
        log.info(`${funcName}: Spawned Ffmpeg with command = `, commandLine);
      })
      .on('progress', (progress) => {
        log.info(`${funcName}: `, progress);
      })
      .on('error', (err) => {
        log.info(`${funcName}: error`, err.message);
        reject(err);
      })
      .on('end', async () => {
        log.info(`${funcName}: finished`);
        const resultMetadata = await getMediaMetadataAsync(finalMediaPath);
        const fileSize = resultMetadata.format.size;
        log.info(`${funcName}: metadata for compressed file ${resultMetadata} = `, resultMetadata);

        if (probe) {
          fs.unlink(finalMediaPath, (err) => {
            if (err) {
              log.error(
                `${funcName}: Failed to remove file ${compressedMediasDir}/${compressedMediaName}.${outputAudioExtension}`,
              );
            }
          });
          log.info(`${funcName}: Test file ${finalMediaPath} was deleted`);
          log.info(`${funcName}: Resulting file size, bytes = `, fileSize);
        }
        resolve({
          status: 'ok',
          payload: { fileSize, compressedMediaName },
        });
      })
      .run();
  });
}

/**
 * compressVideoByParams() compresses video by X% in size (e.g. 80), but not more than to 480p)
 * and/or
 * by Y% in bitrate (e.g. 80) or to 1000kB/s if it's lower
 * @param {string} videoInput Path to source file
 * @param {string} compressedVideosDir Directory to store compressed files
 * @param {string} compressedVideoName Name for compressed file
 * @param {bool} ifToResize If to resize (e.g. to 480p (640*480px))
 * @param {string} reduceBitrateToPrcnt By how many % to reduce video bitrate (for example 80)
 * @param {bool} probe If "true" - only the 1st 10sec will be compressed (when searching for optimal compression)
 * and the resulting file will be deleted after getting its size
 */
async function compressVideoByParams(
  videoInput,
  compressedVideosDir,
  compressedVideoName,
  ifToResize,
  reduceBitrateToPrcnt,
  probe = false,
) {
  const funcName = 'compressVideoByParams()';
  const outputVideoExtension = 'mp4';
  const minVideoWidth = minVideoWidthPx;
  const minVideoHeight = minVideoHeightPx;
  log.info(
    `${funcName}: videoInput = ${videoInput}, compressedVideosDir = ${compressedVideosDir}, compressedVideoName = ${compressedVideoName}, ifToResize = ${ifToResize}, reduceBitrateToPrcnt = ${reduceBitrateToPrcnt}, probe = ${probe}, outputVideoExtension = ${outputVideoExtension}`,
  );

  const videoMetadata = await getMediaMetadataAsync(videoInput);
  log.info(`${funcName}: initial metadata for file ${videoInput} = `, videoMetadata);

  let bitRate = Math.round(videoMetadata.format.bit_rate / 1000);
  log.info(`${funcName}: initial bitrate = `, bitRate);
  if (reduceBitrateToPrcnt) {
    const reducedBitRate = Math.round((bitRate / 100) * reduceBitrateToPrcnt);
    if (reducedBitRate > 1000) {
      bitRate = 1000;
    } else {
      bitRate = reducedBitRate;
    }
    log.info(`${funcName}: bitrate reduced to ${reduceBitrateToPrcnt}% = ${bitRate}`);
  } else {
    log.info(`${funcName}: bitrate is not changed`);
  }

  let newSize = '100%';
  let canBeResized = false;
  if (ifToResize) {
    const { width, height } = videoMetadata.streams[0];
    log.info(`${funcName}: initial width = ${width}, height = ${height}`);
    if (width > height) {
      log.info(`${funcName}: video is in lanscape orientation`);
      if (width > minVideoWidth) {
        newSize = `${minVideoWidth}x?`;
        canBeResized = true;
      }
    } else {
      log.info(`${funcName}: video is in portrait orientation`);
      newSize = `?x${minVideoHeight}`;
      canBeResized = true;
    }

    if (!canBeResized && !reduceBitrateToPrcnt) {
      log.info(`${funcName}: video is already < 480p, not resizing`); // if not resized and bitrate is not reduced, exit
      const fileName = videoInput.split('/').slice(-1);
      return { status: 'ok', payload: { fileSize: 30000000, compressedVideoName: fileName } };
    }
  }

  let { duration } = videoMetadata.format;
  if (probe) {
    if (duration > 10) {
      duration = 10;
    }
  }

  return new Promise((resolve, reject) => {
    const finalVideoPath = `${compressedVideosDir}/${compressedVideoName}.${outputVideoExtension}`;

    ffmpeg(videoInput)
      .output(finalVideoPath)
      .format(outputVideoExtension)
      .videoCodec('mpeg4')
      .videoBitrate(bitRate)
      .size(newSize)
      .duration(duration)

      .on('start', (commandLine) => {
        log.info(`${funcName}: Spawned Ffmpeg with command = `, commandLine);
      })
      .on('progress', (progress) => {
        log.info(`${funcName}: `, progress);
      })
      .on('error', (err) => {
        log.info(`${funcName}: error`, err.message);
        reject(err);
      })
      .on('end', async () => {
        log.info(`${funcName}: finished`);
        const resultMetadata = await getMediaMetadataAsync(finalVideoPath);
        const fileSize = resultMetadata.format.size;
        log.info(`${funcName}: metadata for compressed file ${resultMetadata} = `, resultMetadata);

        if (probe) {
          fs.unlink(finalVideoPath, (err) => {
            if (err) {
              log.error(
                `${funcName}: Failed to remove file ${compressedVideosDir}/${compressedVideoName}.${outputVideoExtension}`,
              );
            }
          });
          log.info(`${funcName}: Test file ${finalVideoPath} was deleted`);
          log.info(`${funcName}: Resulting file size, bytes = `, fileSize);
        }
        resolve({
          status: 'ok',
          payload: { fileSize, compressedVideoName },
        });
      })
      .run();
  });
}

/**
 * compressAudio() compresses audio file, saves it in given directory
 * under given name and returns file name (or error).
 * If file >25Mb, tries to reduce bitrate by 50% but not more than to 32kbit/sec
 * @param {string} mediaInput Path to video file to compress (in /uploads)
 * @param {string} compressedMediaDir Path to /uploads/compressed
 * @param {string} compressedMediaName File name (uuid)
 */
async function compressAudio(mediaInput, compressedMediaDir, compressedMediaName) {
  const funcName = 'compressAudio()';
  log.info(
    `${funcName}: mediaInput = ${mediaInput}, compressedMediaDir = ${compressedMediaDir}, compressedMediaName = ${compressedMediaName}`,
  );
  const fileName = mediaInput.split('/').slice(-1);
  log.info(`${funcName}: fileName processed: `, fileName);
  log.info(`${funcName}: will be saved comressed under name: `, compressedMediaName);

  const initialMediaMetadata = await getMediaMetadataAsync(mediaInput);
  log.info(`${funcName}: initial metadata for file ${mediaInput} = `, initialMediaMetadata);
  const initialSizeBytes = initialMediaMetadata.format.size;
  const mediaLength = initialMediaMetadata.format.duration;
  log.info(
    `${funcName}: initial size of file ${mediaInput} = ${initialSizeBytes} bytes, length = ${mediaLength} seconds`,
  );

  if (initialSizeBytes > maxVideoSizeBytes) {
    const reduceBitrateTo64KbS = await compressAudioByParams(
      mediaInput,
      compressedMediaDir,
      compressedMediaName,
      true,
      true,
    );
    log.info(`${funcName}: result of reducing bitrate to 64kbit/sec = `, reduceBitrateTo64KbS);
    if (!reduceBitrateTo64KbS.status) {
      const message = `Error reducing audio bitrate to 64kbit/sec: ${mediaInput}, aborting`;
      log.error(`${funcName}: ${message}`);
      return false;
    }
    let sizeAfterReducingBitrate = 0;
    if (mediaLength > 10) {
      sizeAfterReducingBitrate = reduceBitrateTo64KbS.payload.fileSize * (mediaLength / 10);
    } else {
      sizeAfterReducingBitrate = reduceBitrateTo64KbS.payload.fileSize;
    }
    log.info(`${funcName}: total extrapolated file size = `, sizeAfterReducingBitrate);

    // Reducing bitrate to 64kbit/sec is enough
    if (sizeAfterReducingBitrate <= maxVideoSizeBytes) {
      const reduceBitrateForAllAudio = await compressAudioByParams(
        mediaInput,
        compressedMediaDir,
        compressedMediaName,
        true,
        false,
      );
      log.info(
        `${funcName}: result of reducing audio bitrate to 64kbit/sec for ALL file = `,
        reduceBitrateForAllAudio,
      );
      if (!reduceBitrateForAllAudio.status) {
        const message = `Error reducing audio bitrate to 64kbit/sec for ALL file ${mediaInput}, aborting`;
        log.error(`${funcName}: ${message}`);
        return false;
      }
      return { status: 'ok', payload: reduceBitrateForAllAudio.payload.compressedMediaName };
    }

    // Reducing bitrate to 64kbit/sec is enough is not enough - file too big
    log.info(
      `${funcName}: reducing audio bitrate to 64kbit/sec is not enought - the file is still too big`,
    );
    return { status: 'ok', payload: '413' };
  }
}

/**
 * compressVideoV2() compresses video file, saves it in given directory
 * under given name and returns file name (or error).
 * Uses logic to get optimal compression with file size < limit.
 * @param {string} videoInput Path to video file to compress (in /uploads)
 * @param {string} compressedVideosDir Path to /uploads/compressed
 * @param {string} compressedVideoName File name (uuid)
 */
async function compressVideoV2(videoInput, compressedVideosDir, compressedVideoName) {
  const funcName = 'compressVideoV2()';
  log.info(
    `${funcName}: videoInput = ${videoInput}, compressedVideosDir = ${compressedVideosDir}, compressedVideoName = ${compressedVideoName}`,
  );
  const fileName = videoInput.split('/').slice(-1);
  log.info(`${funcName}: fileName processed: `, fileName);
  log.info(`${funcName}: will be saved comressed under name: `, compressedVideoName);

  const initialVideoMetadata = await getMediaMetadataAsync(videoInput);
  log.info(`${funcName}: initial metadata for file ${videoInput} = `, initialVideoMetadata);
  const initialSizeBytes = initialVideoMetadata.format.size;
  const videoLength = initialVideoMetadata.format.duration;
  log.info(
    `${funcName}: initial size of file ${videoInput} = ${initialSizeBytes} bytes, length = ${videoLength} seconds`,
  );

  // If file > limit (25Mb) - compress a 10sec sample to 480p (delete sample),
  // if size ok - compress all the file; if still too big -
  // compress a 10sec sample to 480p and bitrate -20% (delete sample),
  // if size ok - compress all file, if still too big - return false
  if (initialSizeBytes > maxVideoSizeBytes) {
    const compressedTo480pSize = await compressVideoByParams(
      videoInput,
      compressedVideosDir,
      compressedVideoName,
      true,
      false,
      true,
    );
    log.info(`${funcName}: result of resizing a sample to 480p = `, compressedTo480pSize);
    if (!compressedTo480pSize.status) {
      const message = `Error processing video (resize to 480p): ${videoInput}, aborting`;
      log.error(`${funcName}: ${message}`);
      return false;
    }
    let sizeAfterResizingTo480p = 0;
    if (videoLength > 10) {
      sizeAfterResizingTo480p = compressedTo480pSize.payload.fileSize * (videoLength / 10);
    } else {
      sizeAfterResizingTo480p = compressedTo480pSize.payload.fileSize;
    }
    log.info(`${funcName}: total extrapolated file size = `, sizeAfterResizingTo480p);

    // Resizing to 480p is enough
    if (sizeAfterResizingTo480p <= maxVideoSizeBytes) {
      const compressAllTo480p = await compressVideoByParams(
        videoInput,
        compressedVideosDir,
        compressedVideoName,
        true,
        false,
        false,
      );
      log.info(`${funcName}: result of resizing of ALL file to 480p = `, compressAllTo480p);
      if (!compressAllTo480p.status) {
        const message = `Error processing video (resize to 480p and bitrate ${bitrateReducedToPrcnt}%): ${videoInput}, aborting`;
        log.error(`${funcName}: ${message}`);
        return false;
      }
      return compressAllTo480p;
    }

    // Resizing to 480p is not enough, try adding -20% bitrate
    if (sizeAfterResizingTo480p > maxVideoSizeBytes) {
      const compressedTo480pAnd80Bitrate = await compressVideoByParams(
        videoInput,
        compressedVideosDir,
        compressedVideoName,
        true,
        bitrateReducedToPrcnt,
        true,
      );
      log.info(
        `${funcName}: result of resizing a sample to 480p and bitrate to ${bitrateReducedToPrcnt}% = ${
          compressedTo480pAnd80Bitrate.payload.fileSize
        } bytes`,
      );
      if (!compressedTo480pSize.status) {
        const message = `Error processing video: ${videoInput}, aborting`;
        log.error(`${funcName}: ${message}`);
        return false;
      }
      let sizeAfterResizingTo480pAnd80Bitrate = 0;
      if (videoLength > 10) {
        sizeAfterResizingTo480pAnd80Bitrate = compressedTo480pAnd80Bitrate.payload.fileSize * (videoLength / 10);
      } else {
        sizeAfterResizingTo480pAnd80Bitrate = compressedTo480pAnd80Bitrate.payload.fileSize;
      }
      log.info(
        `${funcName}: total extrapolated file size (480p, bitrate ${bitrateReducedToPrcnt}%) = ${sizeAfterResizingTo480pAnd80Bitrate} bytes`,
      );

      // Resizing to 480p and reducing bitrate to 80 does the job
      if (sizeAfterResizingTo480pAnd80Bitrate <= maxVideoSizeBytes) {
        log.info(
          `${funcName}: resizing to 480p and reducing bitrate to ${bitrateReducedToPrcnt}% works, compressing all file`,
        );
        const compressedTo480pAnd80BitrateAllFile = await compressVideoByParams(
          videoInput,
          compressedVideosDir,
          compressedVideoName,
          true,
          bitrateReducedToPrcnt,
          false,
        );
        if (!compressedTo480pAnd80BitrateAllFile.status) {
          const message = `Error processing video: ${videoInput}, aborting`;
          log.error(`${funcName}: ${message}`);
          return false;
        }
        log.info(
          `${funcName}: result of resizing to 480p and reducing bitrate to ${bitrateReducedToPrcnt}% for all file = ${
            compressedTo480pAnd80BitrateAllFile.payload.fileSize
          } bytes`,
        );
        return {
          status: 'ok',
          payload: compressedTo480pAnd80BitrateAllFile.payload.compressedVideoName,
        };
      }

      // Resizing to 480p and reducing bitrate by 20% still is not enough - file too big
      log.info(
        `${funcName}: Compressing to 480p and bitrate ${bitrateReducedToPrcnt}% are not enought - the file is still too big`,
      );
      return { status: 'ok', payload: '413' };
    }
  }
}

/**
 * getThumbonail() saves a thumbonail image to be saved on S3
 * @param {string} videoInput Path to video file
 * @param {string} thumbDir Where to save thumbonail, to /uploads/thumbonails
 */
function getThumbonail(videoInput, thumbDir, thumbFileName) {
  const funcName = 'getThumbonail()';
  const [fileName] = videoInput.split('/').slice(-1);
  log.info(`${funcName}: fileName processed: `, fileName);

  return new Promise((resolve, reject) => {
    ffmpeg(videoInput)
      .screenshot({
        timestamps: ['00:00:01.000'],
        filename: `${thumbFileName}.png`,
        folder: thumbDir,
      })

      .on('start', (commandLine) => {
        log.info(`${funcName}: Spawned Ffmpeg with command = `, commandLine);
      })
      .on('error', (err) => {
        log.info(`${funcName}: error`, err.message);
        reject(err);
      })
      .on('end', () => {
        log.info(`${funcName}: saved thumbonail ${thumbFileName}`);
        resolve({
          status: 'ok',
          payload: thumbFileName,
        });
      })
      .run();
  });
}

module.exports = {
  compressVideoV2,
  getThumbonail,
  getMediaMetadataAsync,
  compressAudio,
  compressVideoByParams,
  compressAudioByParams,
};

// const path = require('path');
// const input = path.join(__dirname, '2m50s_The Importance of Self-Awareness.mp3');
// const input = path.join(__dirname, '42mb-5-00min-5minSync.MOV');
// const input = path.join(__dirname, '1.4mb-0-53min-LP.mp4');
// const input = path.join(__dirname, '155mb-8-08min-Yak52.mp4');
// const input = path.join(__dirname, 'IMG_1587.MOV');

// compressVideoV2(input, __dirname, 'test1.avi');
// getMediaMetadataAsync(input).then(res => console.log(res));
// compressAudioByParams(input, __dirname, 'test1', false, true);
// compressVideoByParams(input, __dirname, 'test5', true, '50', false);
/* fs.unlink(input, (fileError) => {
  if (fileError) log.error(`Failed to remove file ${input}`);
}); */
