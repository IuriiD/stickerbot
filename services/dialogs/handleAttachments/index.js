const i18n = require('i18n');

const log = require('../../../config/logger');
const config = require('../../../config');
const { sendMessage, sendTyping, getUserData } = require('../../../lib/fb-graph-api/');
const templates = require('../../helpers/templates');
const constants = require('../../helpers/constants');

async function handleAttachments(event, dialogStatus) {
  const funcName = 'handleAttachments()';
  const senderId = event.sender.id;

  // Process image depending on dialog status
  if (!dialogStatus || (dialogStatus && !dialogStatus.includes('awaitingImage'))) {
    // Nice image but what do you want? [Make a sticker] [Help] etc
    const buttons = [
      templates.postbackButton(i18n.__('btn_title_make_sticker'), constants.btn_payload_make_sticker),
      templates.postbackButton(i18n.__('btn_title_help'), constants.btn_payload_help),
    ];
    await sendMessage(senderId, templates.buttonTemplate(i18n.__('nice_image_but_wtf'), buttons));
    // .textTemplate(event.message.attachments[0].payload.url));
  }

  // Save image to server
  // Depending on template selected - generate a [pre-]sticker
  // Update dialogStatus
  // If ready sticker - save it to S3 and record in DB
  // We won't be saving partly ready stickers ('superTemplates') so far



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
