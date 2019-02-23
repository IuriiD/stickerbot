const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const t = require('../../helpers/templates');
const c = require('../../helpers/constants');
const helpers = require('../../helpers/helpers');

async function defaultFallbackIntent(senderId) {
  try {
    // Sorry but I didn't get that
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate(i18n.__('didnt_get_that')));

    // What should I do?
    // [Make a sticker] [Load a sticker] [Help]
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const buttons = [
      t.postbackButton(i18n.__('btn_title_make_sticker'), c.btn_payload_make_sticker),
      t.postbackButton(i18n.__('btn_title_load_sticker'), c.btn_payload_load_sticker),
      t.postbackButton(i18n.__('btn_title_help'), c.btn_payload_help),
    ];
    await sendMessage(senderId, t.buttonTemplate(i18n.__('what_should_i_do'), buttons));

    // Clear dialog status
    const clearStatus = await helpers.setStatus(senderId, null);
    log.info(clearStatus);
  } catch (error) {
    log.error(`defaultFallbackIntent() error: ${error}`);
  }
}

module.exports = defaultFallbackIntent;
