const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');

async function confirmRestart(senderId) {
  const funcName = 'confirmRestart()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(`${funcName}: You are going to cancel current operation. Are you sure? [Yes] [No]`);
    const btnConfirmYes = templates.postbackButton(
      i18n.__('yes'),
      constants.btn_payload_confirm_restart_yes,
    );
    const btnConfirmNo = templates.postbackButton(
      i18n.__('no'),
      constants.btn_payload_confirm_restart_no,
    );
    await sendMessage(
      senderId,
      templates.buttonTemplate(i18n.__('confirm_restart'), [btnConfirmYes, btnConfirmNo]),
    );
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = confirmRestart;
