const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');
const helpers = require('../../helpers/helpers');
const smthWentWrong = require('../somethingWentWrong/');

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
          await sendMessage(
            senderId,
            templates.textTemplate(constants.hello_username.replace('%s', firstName)),
          );
        } else {
          await sendMessage(senderId, templates.textTemplate(constants.hello_no_username));
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
            templates.textTemplate(
              constants.welcome_back_username.replace('%s', getUser.data.firstName),
            ),
          );
        } else {
          await sendMessage(senderId, templates.textTemplate(constants.welcome_back_no_username));
        }
      }
    } else {
      log.error(`${funcName}: ${getUser.data}`);
      throw Error({ code: 502, message: constants.err502 });
    }

    // To start please choose a template below
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    log.info(`${funcName}: sending "To start please choose a template below"`);
    await sendMessage(senderId, templates.textTemplate(constants.to_start_choose_template));

    // Carousel of sticker templates
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const templatesAvailable = helpers.getStickerTemplatesCarousel();
    if (templatesAvailable.status === 200) {
      log.info(`${funcName}: Showing a carousel of available templates`);
      await sendMessage(senderId, templatesAvailable.data);
    } else {
      log.error(`${funcName}: error = `, templatesAvailable.data);
    }
  } catch (error) {
    log.error(`${funcName} error: ${error}`);
    smthWentWrong(senderId);
  }
}

module.exports = defaultWelcomeIntent;
