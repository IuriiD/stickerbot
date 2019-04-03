const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');

async function okThenGoOn(senderId) {
  const funcName = 'okThenGoOn()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(`${funcName}: Ok, then let's continue with what we were doing`);
    await sendMessage(senderId, templates.textTemplate(constants.ok_then_go_on));
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = okThenGoOn;
