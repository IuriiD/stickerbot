const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const { textTemplate } = require('../../helpers/basic-templates');
const ifErrorDefaultFallback = require('../default-fallback-intent/ifError');

async function defaultWelcomeIntent(senderId) {
  try {
    const { data } = await getUserData(senderId);
    log.info(`\n\n\nName: ${data.first_name}`);

    // Hi, %s! 👋 It’s me, Verizon Emoji's Shopping Assistant, aka VESA!
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, textTemplate(i18n.__('hello', data.first_name)));

    // Describe the person you’re shopping for in 5 emojis and I’ll
    // recommend the perfect holiday gift!
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, textTemplate(i18n.__('prompt_5_emojis')));
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
    ifErrorDefaultFallback(senderId);
  }
}

module.exports = defaultWelcomeIntent;
