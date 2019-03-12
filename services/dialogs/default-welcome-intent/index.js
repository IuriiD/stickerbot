const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const t = require('../../helpers/templates');
const c = require('../../helpers/constants');
const helpers = require('../../helpers/helpers');

async function defaultWelcomeIntent(senderId) {
  try {
    const { data } = await getUserData(senderId);

    // Hi, %s! 👋 I'm a StickerBot, chatbot for making custom stickers.
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate(i18n.__('hello', data.first_name)));

    // To start please choose a template below
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    await sendMessage(senderId, t.textTemplate(i18n.__('to_start_choose_template')));

    // Carousel of sticker templates
    await sendTyping(senderId, config.DEFAULT_MSG_DELAY_MSEC);
    const templateButtons = [
      {
        "type":"postback",
        "title":"Start Chatting",
        "payload":"DEVELOPER_DEFINED_PAYLOAD"
      },
    ];
    const card = t.generic('Polaroid-1', 'https://s3.amazonaws.com/stickerbot/templates/polaroid_1.png', templateButtons, '1 photo, 1 phrase');

    console.log(JSON.stringify(card));
    
    await sendMessage(senderId, t.galleryTemplate([card]));

    // Set dialog status to 'awaitingImage'
    const setStatus = await helpers.setStatus(senderId, c.status_awaiting_image);
    log.info(setStatus);
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = defaultWelcomeIntent;

