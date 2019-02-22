const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const t = require('../../helpers/templates');

async function getHelp(senderId) {
  try {
    // const { data } = await getUserData(senderId);

    // Hi, %s! 👋 I'm a StickerBot, chatbot for making custom stickers.
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate('HERE OUR HELP GOES'));
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = getHelp;
