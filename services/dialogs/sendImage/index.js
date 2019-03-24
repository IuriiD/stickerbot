const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');

async function sendImage(senderId) {
  const funcName = 'confirmRestart()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(
      `${funcName}: To start making such a sticker please send me an image or type some text for me to search some images for you.`,
    );
    await sendMessage(senderId, templates.textTemplate(i18n.__('to_start_send_image')));
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = sendImage;
