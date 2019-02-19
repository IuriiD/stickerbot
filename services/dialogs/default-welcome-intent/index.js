const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const { textTemplate } = require('../../helpers/basic-templates');

async function defaultWelcomeIntent(senderId, text) {
  try {
    // const { data } = await getUserData(senderId);
    log.info(`senderId: ${senderId}`);

    // Hi, %s! 👋 It’s me, Verizon Emoji's Shopping Assistant, aka VESA!
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    // await sendMessage(senderId, textTemplate(i18n.__('hello', data.first_name)));
    await sendMessage(senderId, textTemplate(`You said: ${text}`));
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = defaultWelcomeIntent;
