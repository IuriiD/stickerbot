const log = require('../../config/logger');
const config = require('../../config');
const { sendMessage, sendTyping } = require('../../lib/fb-graph-api');
const dialogs = require('../dialogs/index');
const { User } = require('../../models/');
const stickerTemplates = require('../helpers/stickerTemplates');
const templates = require('../helpers/templates');
const constants = require('../helpers/constants');

/**
 * getStatus() reads status of dialog for user from "Users"
 * @param {string} userId User's FB PSID
 * @returns {object} { status: 'ok', payload: 'null || 'imagePrompted' || ...' }
 * or {status: 'error', payload: '<error message>'}
 */
async function getStatus(userId) {
  try {
    const queryData = await User.findOne(
      { where: { psid: userId } },
      { attributes: ['psid', 'status'] },
    );
    if (!queryData) return { status: 'error', payload: `User ${userId} not found` };
    return { status: 200, payload: queryData.dataValues.status };
  } catch (error) {
    log.info(`getStatus() error: ${error}`);
    return { status: 500, payload: `Failed to get dialog status for user ${userId}` };
  }
}

/**
 * getUserByPSID() returns user record for PSID
 * @param {string} userId User's FB PSID
 * @returns { status: 500 || 200, data: error (for 500) || (userSearched || false for 200)}
 */
async function getUserByPSID(userId) {
  const funcName = 'getUserByPSID()';
  try {
    const userSearched = await User.findOne({ where: { psid: userId } });
    if (userSearched) {
      return { status: 200, data: userSearched };
    }
    return { status: 200, data: false };
  } catch (error) {
    const message = `Failed to retrieve user ${userId} from DB`;
    log.error(`${funcName}: ${message} = ${error}`);
    return { status: 500, data: error };
  }
}

/**
 * createNewUser() adds a new user to DB ("Users")
 * @param {string} userId User's FB PSID
 * @param {string} firstName User's first name on FB
 */
async function createNewUser(userId, firstName) {
  const funcName = 'createNewUser()';
  try {
    const userExists = await getUserByPSID(userId);
    if (userExists.status === 200) {
      if (userExists.data === false) {
        log.info(`${funcName}: Adding user ${userId} to DB`);
        const newRow = await User.create({ psid: userId, firstName });
        if (newRow) {
          return { status: 200, payload: `Created new user ${userId}` };
        }
        return { status: 500, data: `Failed to create user ${userId} in DB` };
      }
      const message = `User ${userId} exists, no need to create it`;
      log.info(`${funcName}: ${message}`);
      return { status: 200, data: message };
    }
    log.error(`${funcName}: `, userExists.data);
    return { status: userExists.status, data: userExists.data };
  } catch (error) {
    const message = `Failed to create user ${userId} in DB`;
    log.error(`${funcName}: ${message} = ${error}`);
    return { status: 500, data: error };
  }
}

/**
 * setStatus() sets new dialog status in "Users" for user with userId
 * @param {string} userId User's FB PSID
 * @param {string} newStatus null || 'imageReceived' || ...
 * @returns {object} { status: 'ok', payload: '<previous status>' }
 * or {status: 'error', payload: '<error message>'}
 */
async function setStatus(userId, newStatus) {
  try {
    const userExists = await User.findOne({ where: { psid: userId } });

    if (userExists) {
      if (userExists.dataValues.status === newStatus) {
        return { status: 200, data: `Status ${newStatus} for user ${userId} already set` };
      }

      const updatedRow = await User.update(
        {
          status: newStatus,
        },
        { where: { psid: userId } },
      );

      if (updatedRow) {
        return {
          status: 200,
          data: `Status ${newStatus} for user ${userId} successfully updated`,
        };
      }

      return { status: 500, data: `Failed to set status ${newStatus} for user ${userId}` };
    }

    const newRow = await User.create({ psid: userId, status: newStatus });
    if (newRow) {
      return { status: 200, data: `Created new user ${userId} with status ${newStatus}` };
    }

    return {
      status: 500,
      data: `Failed to create new user ${userId} with status ${newStatus}`,
    };
  } catch (error) {
    log.info(`setStatus() error: ${error}`);
    return {
      status: 500,
      data: `Got error while trying to set status ${newStatus} for user ${userId}, error: ${error}`,
    };
  }
}

/**
 * getRandomPhrase() returns a random phrase from the passed array
 */
function getRandomPhrase(phrasesArray) {
  if (phrasesArray.length === 0) return false;
  const randPos = Math.floor(Math.random() * (phrasesArray.length + 1));
  return phrasesArray[randPos];
}

/**
 * getStickerTemplatesCarousel() generates a payload to
 * display a carousel of cards showing available sticker templates
 */
function getStickerTemplatesCarousel() {
  const funcName = 'listTemplates()';
  try {
    if (Object.keys(stickerTemplates).length === 0) {
      const message = 'No sticker templates found, aborting';
      log.error(`${funcName}: ${message}`);
      return { status: 500, data: message };
    }

    log.info(
      `${funcName}: ${Object.keys(stickerTemplates).length} sticker templates are available`,
    );

    const templateCardsArray = [];

    if (Object.keys(stickerTemplates).length <= 10) {
      log.info(`${funcName}: We've got <=10 templates (${Object.keys(stickerTemplates).length})`);
      Object.keys(stickerTemplates).forEach((stickerTemplate) => {
        log.info(`Parsing template ${stickerTemplate}`);
        const templateData = stickerTemplates[stickerTemplate];
        log.info(templateData);

        const templateButtons = [
          {
            type: 'postback',
            title: getRandomPhrase(constants.chooseTemplateBtnTitles),
            payload: constants.btn_payload_sticker_template.replace(
              '%s',
              templateData.templateCodeName,
            ),
          },
        ];

        const singleCard4Carousel = templates.genericForCarousel(
          templateData.templateNameForHumans,
          templateData.templateExampleImageUrl,
          templateButtons,
          templateData.templateRequirementsText,
        );

        templateCardsArray.push(singleCard4Carousel);
      });
    }

    log.info('Final array for carousel: ', templateCardsArray);
    log.info('Final carousel: ', templates.galleryTemplate(templateCardsArray));

    // FB cards carousel can have <=10 cards, so if we have more
    // than 10 - show 9 and a card "Show next templates"
    log.info(`${funcName}: Returning data to display a carousel of sticker templates`);
    return { status: 200, data: templates.galleryTemplate(templateCardsArray) };
  } catch (error) {
    log.error(`${funcName}: error: `, error);
    return {
      status: 500,
      data: error,
    };
  }
}

// EXTRA (TO BE DELETED)
function createProjectParams(paramsGallery) {
  const projectUrl = [];
  const imageUrl = [];
  const title = [];
  paramsGallery.forEach(({ Image, LINKS, Product }) => {
    const imagelink = Image;
    const linkProducts = LINKS;
    log.info('LINKS:', linkProducts);
    projectUrl.push(linkProducts);
    imageUrl.push(imagelink);
    title.push(Product);
  });
  const params = {
    projectUrl,
    imageUrl,
    title,
  };
  return params;
}

function getButtonPostback(buttonTitle) {
  // In Dialogflow for 'postback'-type button
  // named 'Hello world!' postback should be 'HELLOWORLD'
  return buttonTitle
    .split(' ')
    .join('')
    .toUpperCase();
}

const contextAwaitingEmojis = [
  {
    name: 'awaitingemojis',
    lifespan: 1,
    parameters: {
      tries: 0,
    },
  },
];

/**
 * Helper for sending payloads from DF via backend to FB
 * @param {array} array Payload(-s) from DF
 * @param {*} callback Function to send those to FB
 */
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Takes JSON response got from Dialogflow's API and retrieves
 * messages for "platform": "facebook"
 * @param {object} response JSON response from DF API
 * @returns Sends retrieved messages to user
 */
async function forwardDfMessages(senderId, response) {
  const output = [];
  try {
    if (
      response
      && response.result
      && response.result.fulfillment
      && response.result.fulfillment.messages
    ) {
      const { messages } = response.result.fulfillment;
      const payloads = messages.filter(message => message.platform === 'facebook');
      // We will be dealing with type 0 (text) and 4 (custom payload) messages from DF.
      // Single cards (type 1), separate quick replies (type 2) and images (type 3)
      // aren't used so far
      payloads.forEach((message) => {
        if (message.type === 0) {
          output.push({
            text: message.speech,
          });
        } else if (message.type === 4) {
          output.push(message.payload.facebook);
        }
      });
      if (output.length > 0) {
        asyncForEach(output, async (message) => {
          await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
          await sendMessage(senderId, message);
        });
      }
    }
  } catch (error) {
    log.info(`forwardDfMessages() error: ${error}`);
    dialogs.ifErrorDefaultFallback(senderId);
  }
}

module.exports = {
  getStatus,
  setStatus,
  createNewUser,
  getUserByPSID,
  getStickerTemplatesCarousel,
  // EXTRA
  createProjectParams,
  getButtonPostback,
  contextAwaitingEmojis,
  forwardDfMessages,
};
