const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const t = require('../../helpers/templates');

async function defaultWelcomeIntent(senderId) {
  try {
    const { data } = await getUserData(senderId);

    // Hi, %s! 👋 I'm a StickerBot, chatbot for making custom stickers.
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate(i18n.__('hello', data.first_name)));

    // To start making a sticker like the one shown below please send me a photo (jpeg or png format,
    // not smaller than 150x150px and not bigger than 3500x2400px, 5Mb max)
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate(i18n.__('to_start_send_image')));
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = defaultWelcomeIntent;
