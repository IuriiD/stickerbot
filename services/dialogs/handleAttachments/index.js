const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const t = require('../../helpers/templates');

async function handleAttachments(event) {
  console.log(JSON.stringify(event, null, 2));
  try {
    const senderId = event.sender.id;

    if (
      event.message.attachments[0]
      && event.message.attachments[0].type === 'image'
      && !event.message.sticker_id
    ) {
      console.log('Good image');
      await sendMessage(senderId, t.textTemplate(event.message.attachments[0].payload.url));
      const mediaParams = {
        media_type: 'image',
        url: event.message.attachments[0].payload.url,
      };
      console.log(JSON.stringify(mediaParams, null, 2));
      await sendMessage(senderId, {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'media',
            elements: [
              {
                media_type: 'image',
                url: event.message.attachments[0].payload.url,
              },
            ],
          },
        },
      });
    } else {
      console.log('Bad image');
    }
  } catch (error) {
    log.error(`defaultWelcomeIntent() error: ${error}`);
  }
}

module.exports = handleAttachments;
