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
const c = require('./helpers/constants');

// Handle text inputs
async function botMessage(event) {
  try {
    const senderId = event.sender.id;
    const message = event.message.text;

    // Greeting
    if (c.greetings.includes(message.trim().toLowerCase())) {
      dialogs.defaultWelcomeIntent(senderId);
    } else {
      // I didn't understand you
      dialogs.defaultFallbackIntent(senderId);
    }
  } catch (error) {
    log.error(`botMessage(): ${error}`);
    const senderId = event.sender.id;
    dialogs.ifErrorDefaultFallback(senderId);
  }
}

// Handle clicks on 'postback'-buttons
async function botButton(event) {
  try {
    const senderId = event.sender.id;
    const { payload } = event.postback;

    console.log(`\n\n\npayload: ${payload}`);

    switch (payload) {
      case i18n.__('btn_payload_help'): {
        dialogs.help(senderId);
        break;
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

// Handle irrelevant input types
async function botOtherMessageTypes(event) {
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
