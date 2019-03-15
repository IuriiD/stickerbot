const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const helpers = require('../../helpers/helpers');

async function defaultWelcomeIntent(senderId) {
  const funcName = 'defaultWelcomeIntent()';
  try {
    let firstName;

    // Different greetings for new and returning users
    const getUser = await helpers.getUserByPSID(senderId);
    if (getUser.status === 200) {
      if (getUser.data === false) {
        // New user
        const { data } = await getUserData(senderId);
        if (data.first_name) {
          firstName = data.first_name;
        }

        // Hi[, %s]! 👋 I'm a StickerBot, chatbot for making stickers.
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        if (firstName) {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_username', firstName)));
        } else {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_no_username')));
        }

        const userCreated = await helpers.createNewUser(senderId, firstName);
        if (userCreated.status !== 200) {
          log.error(`${funcName}: ${userCreated.data}`);
          throw Error({ code: 501, message: constants.err501 });
        }
      } else {
        // Existing user
        // Welcome back[, %s]! 👋 I'm a StickerBot, chatbot for making stickers.
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        if (firstName) {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_username', firstName)));
        } else {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_no_username')));
        }
      }
    } else {
      log.error(`${funcName}: ${getUser.data}`);
      throw Error({ code: 502, message: constants.err502 });
    }

    // To start please choose a template below
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, templates.textTemplate(i18n.__('to_start_choose_template')));

    // Carousel of sticker templates
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const templateButtons = [
      {
        type: 'postback',
        title: 'Start Chatting',
        payload: 'DEVELOPER_DEFINED_PAYLOAD',
      },
    ];

    const singleCard4Carousel = templates.genericForCarousel('Hello', 'https://s3.amazonaws.com/stickerbot/templates/polaroid_1.png', templateButtons);

    await sendMessage(senderId, templates.galleryTemplate([singleCard4Carousel, singleCard4Carousel, singleCard4Carousel]));

    // Set dialog status to 'awaitingImage'
    const setStatus = await helpers.setStatus(senderId, constants.status_awaiting_image);
    log.info(setStatus);
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = defaultWelcomeIntent;

