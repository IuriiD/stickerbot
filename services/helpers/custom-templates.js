const i18n = require('i18n');

const basicTemplates = require('./basic-templates');
// const { getButtonPostback } = require('./helpers');
const { FB_APP_ID } = require('../../config/index');

function getButtonPostback(buttonTitle) {
  // In Dialogflow for 'postback'-type button
  // named 'Hello world!' postback should be 'HELLOWORLD'
  return buttonTitle
    .split(' ')
    .join('')
    .toUpperCase();
}

// Media template with a custom GIF (provided via FB ID)
// and optional buttons & quick reply buttons
function gifTemplate(attachmentGifId, buttons = null, qr = null) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'media',
        elements: [
          {
            media_type: 'image',
            attachment_id: attachmentGifId,
            buttons,
          },
        ],
      },
    },
    quick_replies: qr,
  };
}

// Button for sharing on FB
function shareOnFacebookButton(describe, urlGif) {
  /*
  const url = `https://www.facebook.com/dialog/share?app_id=${FB_APP_ID}&display=page&href=${encodeURIComponent(
    urlGif,
  )}&redirect_uri=http%3A%2F%2Fwww.facebook.com%2F&quote=${encodeURIComponent(describe)}`;
*/
  const url = `https://www.facebook.com/dialog/share?app_id=${FB_APP_ID}&display=page&href=${encodeURIComponent(
    'http://gif.vzemojishopper.com/gifs/Google/0023_fe0f_20e3-1f3b3-1f91d-1f64d_1f3fb-1f485_1f3fc.gif',
  )}&redirect_uri=http%3A%2F%2Fwww.facebook.com%2F&quote=${encodeURIComponent(describe)}`;

  const buttonTitle = i18n.__('share_on_facebook');
  console.log('\n\nsharing url');
  console.log(url);
  return basicTemplates.urlButton(buttonTitle, url);
}

function messageGifButtons(imageFBiD, url, describe) {
  const buttons = [shareOnFacebookButton(describe, url)];
  return gifTemplate(imageFBiD, buttons);
}

// Gallery of 3 cards
function messageGallery(params) {
  const element = [];
  for (let i = 0; i < 3; i++) {
    const galleryData = {};
    galleryData.title = params.title[i];
    galleryData.imageUrl = params.imageUrl[i];
    galleryData.buttons = [basicTemplates.urlButton(i18n.__('shop_now'), params.projectUrl[i])];
    element.push(basicTemplates.cardTemplate(galleryData));
  }
  return basicTemplates.galleryTemplate(element);
}

// Customised button template with 2 buttons
// Thank you, Daria! That’s great to hear! 😊 How can I help you today?
// [Describe in 5] [Customer Service]
function thanksHowToHelp(userName) {
  const text = i18n.__('thanks_how_to_help', userName);
  const buttons = [
    basicTemplates.postbackButton(
      i18n.__('#describein5'),
      getButtonPostback(i18n.__('#describein5')),
    ),
    basicTemplates.postbackButton(
      i18n.__('customer_service'),
      getButtonPostback(i18n.__('customer_service')),
    ),
  ];
  return basicTemplates.buttonTemplate(text, buttons);
}

// Customised button template with 1 button
// Sorry I couldn’t help you ☹ ️Here's how you can get in touch with a real life human
// [Chat now]
function chatCustomerService() {
  const text = i18n.__('chat_with_us');
  const buttons = [
    basicTemplates.urlButton(i18n.__('chat_now'), 'https://www.messenger.com/t/verizon'),
  ];
  return basicTemplates.buttonTemplate(text, buttons);
}

module.exports = {
  messageGifButtons,
  messageGallery,
  shareOnFacebookButton,
  thanksHowToHelp,
  chatCustomerService,
};
