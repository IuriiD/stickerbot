const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const { buttonTemplate, postbackButton, urlButton } = require('../../helpers/basic-templates');
const { dfPost } = require('../../../lib/apiai-api');
// const helpers = require('../../helpers/helpers');

function getButtonPostback(buttonTitle) {
  // In Dialogflow for 'postback'-type button
  // named 'Hello world!' postback should be 'HELLOWORLD'
  return buttonTitle
    .split(' ')
    .join('')
    .toUpperCase();
}

async function ifErrorDefaultFallback(senderId) {
  try {
    // Hmmm… I’m not getting that. What would you like to do?
    // [Describe in 5] [Contact Verizon]
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const buttons = [
      postbackButton(i18n.__('#describein5'), getButtonPostback(i18n.__('#describein5'))),
      urlButton(i18n.__('contact_verizon'), 'https://www.messenger.com/t/verizon'),
    ];
    await sendMessage(senderId, buttonTemplate(i18n.__('default_fallback'), buttons));
    await dfPost(senderId, []);
  } catch (error) {
    log.error(`ifErrorDefaultFallback() error: ${error}`);
  }
}

module.exports = ifErrorDefaultFallback;
