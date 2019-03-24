const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');

async function defaultFallbackIntent(senderId) {
  try {
    // Sorry but I didn't get that
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, templates.textTemplate(i18n.__('didnt_get_that')));

    // What should I do?
    // [Make a sticker] [Load a sticker] [Help]
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const buttons = [
      templates.postbackButton(
        i18n.__('btn_title_make_sticker'),
        constants.btn_payload_make_sticker,
      ),
      templates.postbackButton(
        i18n.__('btn_title_load_sticker'),
        constants.btn_payload_load_sticker,
      ),
      templates.postbackButton(i18n.__('btn_title_help'), constants.btn_payload_help),
    ];
    await sendMessage(senderId, templates.buttonTemplate(i18n.__('what_should_i_do'), buttons));
  } catch (error) {
    log.error(`defaultFallbackIntent() error: ${error}`);
  }
}

module.exports = defaultFallbackIntent;
