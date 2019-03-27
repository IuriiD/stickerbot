const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const helpers = require('../../helpers/helpers');

async function sendImage(senderId) {
  const funcName = 'sendImage()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(
      `${funcName}: Perfect choice 😎 To start please send me an image or enter a query and I will suggest some images for you.`,
    );
    const thatsAGoodImagePhraseVariants = [
      i18n.__('perfect_choice'),
      i18n.__('ok_lets_start'),
      i18n.__('gonna_be_perfect_sticker'),
    ];
    await sendMessage(senderId, templates.textTemplate(`${helpers.getRandomPhrase(thatsAGoodImagePhraseVariants)} ${i18n.__('to_start_send_image')}`));

  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = sendImage;
