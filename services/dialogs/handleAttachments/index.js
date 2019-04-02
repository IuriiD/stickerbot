const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const fileHandling = require('../../helpers/fileHandling');
const helpers = require('../../helpers/helpers');

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
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        // await sendMessage(senderId, templates.textTemplate(fileDownload.data));
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        const buttons = [
          templates.postbackButton(
            constants.btn_title_replace_image,
            constants.btn_payload_replace_image,
          ),
        ];
        await sendMessage(
          senderId,
          templates.buttonTemplate(constants.replace_photo_or_provide_text, buttons),
        );
        // Dialog status >> 'awaitingStickerText'
        const setStatus = await helpers.setStatus(senderId, constants.status_awaiting_sticker_text);
        log.info(`${funcName}: setStatus =`, setStatus);
      }
    }
  } catch (error) {
    log.error(`${funcName}: error =`, error);
    return { status: 500, data: error };
  }
}

module.exports = handleAttachments;
