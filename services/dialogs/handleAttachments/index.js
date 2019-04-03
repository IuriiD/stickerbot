const fs = require('fs');
const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const fileHandling = require('../../helpers/fileHandling');
const helpers = require('../../helpers/helpers');
const stickers = require('../../gm/');
const s3 = require('../../../lib/aws/s3');
const stickerTemplates = require('../../helpers/stickerTemplates');

async function handleAttachments(senderId, attachmentUrl, dialogStatus) {
  const funcName = 'handleAttachments()';
  log.info(
    `${funcName}: senderId = ${senderId}, attachmentUrl = ${attachmentUrl}, dialogStatus = ${dialogStatus}`,
  );
  try {
    // Process image depending on dialog status
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    if (!dialogStatus || (dialogStatus && !dialogStatus.includes('awaitingImage'))) {
      // Nice image but what do you want? [Make a sticker] [Help] etc
      const buttons = [
        templates.postbackButton(
          constants.btn_title_new_sticker,
          constants.btn_payload_new_sticker,
        ),
        await templates.postbackButton(constants.btn_title_help, constants.btn_payload_help),
      ];
      await sendMessage(senderId, templates.buttonTemplate(constants.nice_image_but_wtf, buttons));
    } else {
      // Download image
      const fileDownload = await fileHandling.downloadImage(attachmentUrl, senderId);
      log.info(`${funcName}: fileDownload =`, fileDownload);
      if (fileDownload.status === 200) {
        // Generate a sticker with dummy text
        const fileName = fileDownload.data.split('/').slice(-1)[0];
        const sticker = await stickers.polaroidV1(fileName, constants.dummy_text);

        log.info(`${funcName}: sticker =`, sticker);
        if (sticker.status === 200) {
          log.info(
            `${funcName}: sticker.data.fileName = ${
              sticker.data.fileName
            }, config.AWS_PREVIEW_FOLDER = ${config.AWS_PREVIEW_FOLDER}, constants.imgMimeType = ${
              constants.imgMimeType
            }`,
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
          if (s3ImageUrl.status === 200) {
            // We'll get a sticker like this
            await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
            await sendMessage(senderId, templates.textTemplate(constants.sticker_like_this));

            const buttons = [
              templates.postbackButton(
                constants.btn_title_replace_image,
                constants.btn_payload_replace_image,
              ),
            ];

            const stickerPreviewCard = templates.generic(
              constants.replace_photo_or_provide_text,
              s3ImageUrl.data,
              buttons,
            );

            log.info(`${funcName}: stickerPreviewCard = ${JSON.stringify(stickerPreviewCard)}`);

            // Gallery with title "Now please send me the text for your sticker. You can also replace the image"
            // Sticker preview (with text "Your text goes here") and a button [Replace image]
            await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
            await sendMessage(senderId, stickerPreviewCard);
            // Dialog status >> 'awaitingStickerText'
            const setStatus = await helpers.setStatus(
              senderId,
              `${stickerTemplates.polaroid1.templateCodeName}#${
                constants.status_awaiting_sticker_text
              }`,
            );
            log.info(`${funcName}: setStatus =`, setStatus);
          }
        }
      }
    }
  } catch (error) {
    log.error(`${funcName}: error =`, error);
    return { status: 500, data: error };
  }
}

module.exports = handleAttachments;
