const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');

async function defaultFallbackIntent(senderId) {
  const funcName = 'defaultFallbackIntent()';
  try {
    // Sorry but I didn't get that
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, templates.textTemplate(constants.didnt_get_that));

    // What should I do?
    // [Make a sticker] [Load a sticker] [Help]
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const buttons = [
      templates.postbackButton(
        constants.btn_payload_new_sticker,
        constants.btn_payload_new_sticker,
      ),
      templates.postbackButton(
        constants.btn_title_load_sticker,
        constants.btn_payload_load_sticker,
      ),
      templates.postbackButton(constants.btn_title_help, constants.btn_payload_help),
    ];
    await sendMessage(senderId, templates.buttonTemplate(constants.what_should_i_do, buttons));
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = defaultFallbackIntent;
