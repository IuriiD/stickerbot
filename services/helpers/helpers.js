const log = require('../../config/logger');
const config = require('../../config');
const { sendMessage, sendTyping } = require('../../lib/fb-graph-api');
const dialogs = require('../dialogs/index');
const { User } = require('../../models/');

/**
 * getStatus() reads status of dialog for user from "Users"
 * @param {string} userId User's FB PSID
 * @returns {object} { status: 'ok', payload: 'null || 'imagePrompted' || ...' }
 * or {status: 'error', payload: '<error message>'}
 */
async function getStatus(userId) {
  try {
    const queryData = await User.findOne({ attributes: ['status'] }, { where: { psid: userId } });
    console.log(queryData);
  } catch (error) {
    log.info(`getStatus() error: ${error}`);
    return { status: 'error', payload: `Failed to get dialog status for user ${userId}` };
  }
}

// getStatus('123').then(res => console.log(res));

/**
 * setStatus() sets new dialog status in "Users" for user with userId
 * @param {string} userId User's FB PSID
 * @param {string} newStatus null || 'imageReceived' || ...
 * @returns {object} { status: 'ok', payload: '<previous status>' }
 * or {status: 'error', payload: '<error message>'}
 */
async function setStatus(userId, newStatus) {
  try {
    console.log('hi');
  } catch (error) {
    log.info(`setStatus() error: ${error}`);
    return {
      status: 'error',
      payload: `Failed to set new dialog status ${newStatus} for user ${userId}`,
    };
  }
}

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
  createProjectParams,
  getButtonPostback,
  contextAwaitingEmojis,
  forwardDfMessages,
  getStatus,
  setStatus,
};
