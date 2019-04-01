const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const helpers = require('../../helpers/helpers');
const constants = require('../../helpers/constants');

async function sendImage(senderId) {
  const funcName = 'sendImage()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(
      `${funcName}: Perfect choice 😎 To start please send me an image or enter a query and I will suggest some images for you.`,
    );
    const thatsAGoodImagePhraseVariants = [
      constants.perfect_choice,
      constants.ok_lets_start,
      constants.gonna_be_perfect_sticker,
    ];
    await sendMessage(senderId, templates.textTemplate(`${helpers.getRandomPhrase(thatsAGoodImagePhraseVariants)} ${constants.to_start_choose_template}`));
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = sendImage;
