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
      constants.excellent_taste,
      constants.gonna_be_perfect_sticker,
    ];
    const randomPhrase = helpers.getRandomPhrase(thatsAGoodImagePhraseVariants);
    log.info(`${funcName}: randomPhrase =`, randomPhrase);
    await sendMessage(
      senderId,
      templates.textTemplate(`${randomPhrase} ${constants.to_start_send_image}`),
    );
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = sendImage;
