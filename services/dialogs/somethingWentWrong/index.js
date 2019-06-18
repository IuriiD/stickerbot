const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const helpers = require('../../helpers/helpers');

async function smthWentWrong(senderId) {
  const funcName = 'smthWentWrong()';
  try {
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(
      `${funcName}: Sorry but something went wrong and we'll need to start over? [New sticker] [Load a sticker] [Help]`,
    );
    const buttons = [
      templates.postbackButton(constants.btn_title_new_sticker, constants.btn_payload_new_sticker),
      templates.postbackButton(
        constants.btn_title_load_sticker,
        constants.btn_payload_load_sticker,
      ),
      templates.postbackButton(constants.btn_title_help, constants.btn_payload_help),
    ];
    await sendMessage(senderId, templates.buttonTemplate(constants.smth_went_wrong, buttons));

    // Dialog status >> null
    const clearStatus = await helpers.setStatus(senderId, null);
    log.info(`${funcName}: clearStatus =`, clearStatus);
  } catch (error) {
    log.error(`${funcName}: error =`, error);
  }
}

module.exports = smthWentWrong;
