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

// Block of functions to send "Typing"
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
 * getFBAttachmentId() Uploads image to FB and returns attachment ID
 * @param {string} imageUrl URL of image to be upladed (AWS S3)
 * @param {string} mediaType 'image' or 'video'
 * @param {bool} retry If to retry (up to 3 times)
 * @returns {status: 200|500, data: error_msg|id}  ID like '770446223303120' or false
 */
async function getFBAttachmentId(mediaUrl, mediaType = 'image', retry = false) {
  const funcName = 'getFBAttachmentId()';
  log.info(`${funcName}: mediaUrl = ${mediaUrl}, mediaType = ${mediaType}, retry = ${retry}`);
  try {
    const fbReply = await request('POST', 'me/message_attachments', {
      params: {
        message: {
          attachment: {
            type: mediaType,
            payload: {
              is_reusable: true,
              url: mediaUrl,
            },
          },
        },
      },
    });
    if (fbReply.data) {
      if (fbReply.data.attachment_id) {
        return { status: 200, data: fbReply.data.attachment_id };
      }
    }
    throw new Error('Error from FB while getting attachment id');
  } catch (error) {
    if (retry) {
      return getFBAttachmentId(mediaUrl, mediaType, false);
    }
    const message = `Failed to get FB attachment ID for ${mediaUrl}. Error = ${error}`;
    log.error(`${funcName}: ${message}`);
    return { status: 500, data: message };
  }
}

// Block of functions to setup Get started, Persistent menu and whitelist domains
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
    log.info(`Domain Whitelisting (${config.whitelisting.whitelisted_domains})...`);
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
  getFBAttachmentId,
  initialSetup,
};
