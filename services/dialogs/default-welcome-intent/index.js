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
        log.info(`${funcName}: User ${senderId} was not found in DB (new user)`);
        const { data } = await getUserData(senderId);
        log.info(`${funcName}: getUserData = `, data);
        if (data.first_name) {
          firstName = data.first_name;
          log.info(`${funcName}: firstName = `, firstName);
        }

        log.info(`${funcName}: saving new user ${senderId} with firstName ${firstName} in DB`);
        const userCreated = await helpers.createNewUser(senderId, firstName);
        if (userCreated.status !== 200) {
          log.error(`${funcName}: ${userCreated.data}`);
          throw Error({ code: 501, message: constants.err501 });
        }

        // Hi[, %s]! 👋 I'm a StickerBot, chatbot for making stickers.
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        log.info(
          `${funcName}: sending "Hi[, ${firstName}]! 👋 I'm a StickerBot, chatbot for making stickers."`,
        );
        if (firstName) {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_username', firstName)));
        } else {
          await sendMessage(senderId, templates.textTemplate(i18n.__('hello_no_username')));
        }
      } else {
        // Existing user
        // Welcome back[, %s]! 👋 I'm a StickerBot, chatbot for making stickers.
        log.info(`${funcName}: User ${senderId} exists in DB (returning user)`);
        await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
        log.info(
          `${funcName}: sending "Welcome back[, ${
            getUser.data.firstName
          }]! 👋 I'm a StickerBot, chatbot for making stickers."`,
        );
        if (getUser.data.firstName) {
          await sendMessage(
            senderId,
            templates.textTemplate(i18n.__('welcome_back_username', getUser.data.firstName)),
          );
        } else {
          await sendMessage(senderId, templates.textTemplate(i18n.__('welcome_back_no_username')));
        }
      }
    } else {
      log.error(`${funcName}: ${getUser.data}`);
      throw Error({ code: 502, message: constants.err502 });
    }

    // To start please choose a template below
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(`${funcName}: sending "To start please choose a template below"`);
    await sendMessage(senderId, templates.textTemplate(i18n.__('to_start_choose_template')));

    // Carousel of sticker templates
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    /* const templateButtons = [
      {
        type: 'postback',
        title: 'Start Chatting',
        payload: 'DEVELOPER_DEFINED_PAYLOAD',
      },
    ];

    const singleCard4Carousel = templates.genericForCarousel(
      'Hello',
      'https://s3.amazonaws.com/stickerbot/templates/polaroid_1.png',
      templateButtons,
    ); */
    const templatesAvailable = helpers.getStickerTemplatesCarousel();
    if (templatesAvailable.status === 200) {
      log.info(`${funcName}: Showing a carousel of available templates`);
      log.info(templatesAvailable.data);
      await sendMessage(senderId, templatesAvailable.data);
    } else {
      log.error(`${funcName}: error = `, templatesAvailable.data);
    }

    // Set dialog status to 'awaitingImage'
    const setStatus = await helpers.setStatus(senderId, constants.status_awaiting_image);
    log.info(`${funcName}: setStatus =`, setStatus);
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = defaultWelcomeIntent;
