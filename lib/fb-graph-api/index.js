const { promisify } = require('util');
const { request } = require('./request');
const config = require('./config/');
const log = require('../../config/logger');

const delay = promisify(setTimeout);

// Sends a single message to FB Graph API
function sendMessage(senderId, message) {
  return request('post', 'me/messages', {
    params: { recipient: { id: senderId }, message },
  });
}

/**
 * getUserData() retrieves user's data (first name is needed)
 * @param {string} senderId User's PSID
 */
function getUserData(senderId) {
  return request('get', senderId, {});
}

function sendTypingOn(senderId) {
  return request('post', 'me/messages', {
    params: { recipient: { id: senderId }, sender_action: 'typing_on' },
  });
}

function sendTypingOff(senderId) {
  return request('post', 'me/messages', {
    params: { recipient: { id: senderId }, sender_action: 'typing_off' },
  });
}

async function sendTyping(senderId, typingLengthMsec = 2000) {
  sendTypingOn(senderId);
  await delay(typingLengthMsec);
  sendTypingOff(senderId);
}

/**
 * @desc  Uploads our gif to FB using Attachment Upload API and
 *        returns image's ID
 * @param {string} imageUrl URL of image to be upladed (e.g. AWS S3)
 * @returns {false|string}  ID like '770446223303120' or false
 */

async function getFBImageId(imageUrl, retry = 0) {
  try {
    const reply = await request('post', 'me/message_attachments', {
      params: {
        message: {
          attachment: {
            type: 'image',
            payload: {
              is_reusable: true,
              url: imageUrl,
            },
          },
        },
      },
    });
    return reply.data.attachment_id;
  } catch (error) {
    if (retry < 3) {
      return getFBImageId(imageUrl, retry + 1);
    }
    return error;
  }
}

function facebookThreadAPI(jsonFile) {
  return request('POST', '/me/thread_settings', { data: jsonFile });
}

function facebookMessengerAPI(jsonFile) {
  return request('POST', '/me/messenger_profile', { data: jsonFile });
}

async function initialSetup() {
  try {
    log.info('Get Started Button...');
    await facebookThreadAPI(config.getStartedButton);
    log.info('Get Started Button: SUCCESS');
    await delay(2000);
    log.info('Domain Whitelisting...');
    await facebookThreadAPI(config.whitelisting);
    log.info('Domain Whitelisting: SUCCESS');
    await delay(2000);
    log.info('Updating Persistent Menu...');
    await facebookMessengerAPI(config.persistentMenu);
    log.info('Updating Persistent Menu: SUCCESS');
  } catch (err) {
    log.error(err.message);
  }
}

module.exports = {
  getUserData,
  sendMessage,
  sendTyping,
  getFBImageId,
  initialSetup,
  delay,
};
