/**
 * From backend we respond to button clicks and only those text inputs which need processing
 * (e.g. checking emojis) and/or customized response (products galleries, user's name insertion).
 * Responses to all other text inputs will be set up and handled on Dialogflow and only
 * "forwarded" through backend.
 */
const i18n = require('i18n');
const config = require('../config/');

const log = require('../config/logger');

const dialogs = require('./dialogs');
const helpers = require('./helpers/helpers');
const constants = require('./helpers/constants');
const stickerTemplates = require('./helpers/stickerTemplates');

// Handle text inputs
async function botMessage(event) {
  const funcName = 'botMessage()';
  try {
    const senderId = event.sender.id;
    log.info(`${funcName}: senderId = ${senderId}`);
    const message = event.message.text;
    log.info(`${funcName}: message = ${event.message.text}`);
    const dialogStatusData = await helpers.getStatus(senderId);
    log.info(`${funcName}: dialogStatus = `, dialogStatusData);
    let dialogStatus = null;
    if (dialogStatusData.status === 200) {
      dialogStatus = dialogStatusData.data;
    }

    // Greeting
    if (constants.greetings.includes(message.trim().toLowerCase())) {
      if (!dialogStatus) {
        // Greeet user and suggest to choose a sticker template
        // Dialog status >> 'choosingTemplate'
        const setStatus = await helpers.setStatus(senderId, constants.status_choosing_template);
        log.info(`${funcName}: setStatus =`, setStatus);
        return dialogs.defaultWelcomeIntent(senderId);
      }

      // But in case we are in the middle of some flow - ask user to confirm restarting
      // No dialog status change
      return dialogs.confirmRestart(senderId);
    }

    // I didn't understand you
    // Dialog status >> null
    const clearStatus = await helpers.setStatus(senderId, null);
    log.info(`${funcName}: clearStatus =`, clearStatus);
    return dialogs.defaultFallbackIntent(senderId);
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
    const senderId = event.sender.id;
    log.info(`${funcName}: senderId = ${senderId}`);
    const { payload } = event.postback;
    log.info(`${funcName}: payload = ${payload}`);
    const dialogStatus = await helpers.getStatus(senderId);
    log.info(`${funcName}: dialogStatus = `, dialogStatus);

    switch (payload) {
      // Confirm restart - Yes
      case constants.btn_payload_confirm_restart_yes: {
        log.info(`${funcName}: Confirm restart >> Yes, launching dialog "defaultWelcomeIntent"`);
        if (dialogStatus) {
          // Dialog status >> 'choosingTemplate'
          const setStatus = await helpers.setStatus(senderId, constants.status_choosing_template);
          log.info(`${funcName}: setStatus =`, setStatus);
          return dialogs.defaultWelcomeIntent(senderId);
        }

        // Ok, then continue
        // Dialog status unchanged
        log.info(
          `${funcName}: Confirm restart >> No, launching dialog "okThenGoOn", dialog status unchanged`,
        );
        return dialogs.okThenGoOn(senderId);
      }

      // Confirm restart - No
      case constants.btn_payload_confirm_restart_no: {
        // Ok, then continue
        // Dialog status unchanged
        log.info(
          `${funcName}: Confirm restart >> No, launching dialog "okThenGoOn", dialog status unchanged`,
        );
        return dialogs.okThenGoOn(senderId);
      }

      // Sticker Templates - Polaroid-1
      case `${constants.btn_payload_sticker_template.replace(
        '%s',
        stickerTemplates.polaroid1.templateCodeName,
      )}`: {
        log.info(`${funcName}: Choose templage >> POLAROID1`);
        // Dialog status >> 'POLAROID1#awaitingImage'
        const setStatus = await helpers.setStatus(
          senderId,
          `${stickerTemplates.polaroid1.templateCodeName}#${constants.status_awaiting_image}`,
        );
        log.info(`${funcName}: setStatus =`, setStatus);
        return dialogs.sendImage(senderId);
      }
      /* case 'TRYDESCRIBEIN5':
      case 'STARTOVER':
      case 'DESCRIBEIN5':
      case 'TRYAGAIN':
      case 'TRY5NEWEMOJIS':
      case '#DESCRIBEIN5': {
        const newContexts = helpers.contextAwaitingEmojis;
        await dfPost(senderId, newContexts);
        dialogs.tryAgain(senderId);
        break;
      }
      case 'CUSTOMERSERVICE':
        dialogs.contactVerizon(senderId);
        break;
      case 'SHARE#DESCRIBEIN5':
        dialogs.showGif(senderId);
        break;
      case 'SHOPBYBRAND':
        dialogs.changeDeviceBrand(senderId);
        break;
      case 'DEVICEBRANDSAMSUNG':
        dialogs.showDevicesForBrand(senderId, 'Samsung');
        break;
      case 'DEVICEBRANDAPPLE':
        dialogs.showDevicesForBrand(senderId, 'Apple');
        break;
      case 'DEVICEBRANDGOOGLE':
        dialogs.showDevicesForBrand(senderId, 'Google');
        break; */
      default:
        log.info("We've got a botton click from non-existing button!");
    }
  } catch (error) {
    log.error(`botButton(): ${error}`);
    const senderId = event.sender.id;
    dialogs.ifErrorDefaultFallback(senderId);
  }
}

// Handle attachments
async function botOtherMessageTypes(event) {
  dialogs.handleAttachments(event);
  /*
  console.log('\nbotOtherMessageTypes');
  try {
    const senderId = event.sender.id;
    // 2 main cases depending on DF context:
    const awaitingEmojis = await dfGet(senderId, 'awaitingemojis');
    log.info(`senderId ${senderId}, awaitingEmojis: ${JSON.stringify(awaitingEmojis)}`);
    // user enters extra stuff when emojis are expected >> 'Invalid input' and
    if (awaitingEmojis && awaitingEmojis.name && awaitingEmojis.name === 'awaitingemojis') {
      dialogs.handleFailedEmojisInput(senderId, 'invalid_input', []);
      // ... all other contexts >> Default Fallback Intent
    } else {
      log.info(`senderId ${senderId}, context awaitingemojis - NOT found`);
      dialogs.defaultFallbackIntent(senderId);
    }
  } catch (error) {
    log.error(`botOtherMessageTypes(): ${error}`);
    const senderId = event.sender.id;
    dialogs.ifErrorDefaultFallback(senderId);
  } */
}

module.exports = {
  botMessage,
  botButton,
  botOtherMessageTypes,
};
