/**
 * From backend we respond to button clicks and only those text inputs which need processing
 * (e.g. checking emojis) and/or customized response (products galleries, user's name insertion).
 * Responses to all other text inputs will be set up and handled on Dialogflow and only
 * "forwarded" through backend.
 */
const log = require('../config/logger');
const dialogs = require('./dialogs');
const helpers = require('./helpers/helpers');
const constants = require('./helpers/constants');
const stickerTemplates = require('./helpers/stickerTemplates');

// Handle text inputs
async function botMessage(event) {
  const funcName = 'botMessage()';
  try {
    // Get initial data
    const initialData = await helpers.getInputData(event);
    if (initialData.status === 500) {
      log.error(`${funcName}: ${initialData.data}`);
      return;
    }
    const { senderId, text: message, dialogStatus } = initialData.data;

    // Greeting
    if (constants.greetings.includes(message.trim().toLowerCase())) {
      if (!dialogStatus) {
        // Greeet user and suggest to choose a sticker template
        dialogs.defaultWelcomeIntent(senderId);
        // Dialog status >> 'choosingTemplate'
        const setStatus = await helpers.setStatus(senderId, constants.status_choosing_template);
        log.info(`${funcName}: setStatus =`, setStatus);
        return;
      }

      // But in case we are in the middle of some flow - ask user to confirm restarting
      // No dialog status change
      dialogs.confirmRestart(senderId);
      return;
    }

    // I didn't understand you
    dialogs.defaultFallbackIntent(senderId);
    // Dialog status >> null
    const clearStatus = await helpers.setStatus(senderId, null);
    log.info(`${funcName}: clearStatus =`, clearStatus);
    return;
  } catch (error) {
    log.error(`${funcName}: ${error}`);
    const senderId = event.sender.id;
    dialogs.somethingWentWrong(senderId);
  }
}

// Handle clicks on 'postback'-buttons
async function botButton(event) {
  const funcName = 'botButton()';
  try {
    // Get initial data
    const initialData = await helpers.getInputData(event);
    if (initialData.status === 500) {
      log.error(`${funcName}: ${initialData.data}`);
      return;
    }
    const { senderId, btnPayload: payload, dialogStatus } = initialData.data;

    switch (payload) {
      // Get started
      case constants.btn_payload_get_started: {
        if (!dialogStatus) {
          // Greeet user and suggest to choose a sticker template
          dialogs.defaultWelcomeIntent(senderId);
          // Dialog status >> 'choosingTemplate'
          const setStatus = await helpers.setStatus(senderId, constants.status_choosing_template);
          log.info(`${funcName}: setStatus =`, setStatus);
          return;
        }
        break;
      }

      // Confirm restart - Yes
      case constants.btn_payload_confirm_restart_yes: {
        log.info(`${funcName}: Confirm restart >> Yes, launching dialog "defaultWelcomeIntent"`);
        if (dialogStatus) {
          dialogs.defaultWelcomeIntent(senderId);
          // Dialog status >> 'choosingTemplate'
          const setStatus = await helpers.setStatus(senderId, constants.status_choosing_template);
          log.info(`${funcName}: setStatus =`, setStatus);
          return;
        }

        // Ok, then continue
        // Dialog status unchanged
        log.info(
          `${funcName}: Confirm restart >> No, launching dialog "okThenGoOn", dialog status unchanged`,
        );
        dialogs.okThenGoOn(senderId);
        return;
      }

      // Confirm restart - No
      case constants.btn_payload_confirm_restart_no: {
        // Ok, then continue
        // Dialog status unchanged
        log.info(
          `${funcName}: Confirm restart >> No, launching dialog "okThenGoOn", dialog status unchanged`,
        );
        dialogs.okThenGoOn(senderId);
        return;
      }

      // Sticker Templates - Polaroid-1
      case `${constants.btn_payload_sticker_template.replace(
        '%s',
        stickerTemplates.polaroid1.templateCodeName,
      )}`: {
        log.info(`${funcName}: Choose templage >> POLAROID1`);
        dialogs.sendImage(senderId);
        // Dialog status >> 'POLAROID1#awaitingImage'
        const setStatus = await helpers.setStatus(
          senderId,
          `${stickerTemplates.polaroid1.templateCodeName}#${constants.status_awaiting_image}`,
        );
        log.info(`${funcName}: setStatus =`, setStatus);
        return;
      }
      default:
        log.info("We've got a botton click from non-existing button!");
    }
  } catch (error) {
    const message = `Error processing button click: ${error}`;
    log.error(`${funcName}: ${message}`);
    // @TODO Failure dialog
  }
}

// Handle attachments
async function botAttachment(event) {
  const funcName = 'botAttachment()';
  try {
    // Get initial data
    const initialData = await helpers.getInputData(event);
    if (initialData.status === 500) {
      log.error(`${funcName}: ${initialData.data}`);
      return;
    }
    const { senderId, attachmentUrl, dialogStatus } = initialData.data;

    dialogs.handleAttachments(senderId, attachmentUrl, dialogStatus);
  } catch (error) {
    const message = `Error processing attachment: ${error}`;
    log.error(`${funcName}: ${message}`);
    // @TODO Failure dialog
  }
}

module.exports = {
  botMessage,
  botButton,
  botAttachment,
};
