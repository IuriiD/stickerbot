function textTemplate(message) {
  return {
    text: message,
  };
}

function urlButton(title, url) {
  return {
    title,
    url,
    type: 'web_url',
  };
}

function quickReplyButton(title, payload) {
  return { content_type: 'text', title, payload };
}

function postbackButton(title, payload) {
  return { type: 'postback', title, payload };
}

function shareButton() {
  return { type: 'element_share' };
}

function buttonTemplate(text, buttons) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text,
        buttons,
      },
    },
  };
}

function cardTemplate(cardData) {
  return {
    title: cardData.title,
    image_url: cardData.imageUrl,
    buttons: cardData.buttons,
    subtitle: cardData.subtitle,
  };
}

function galleryTemplate(elements) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        image_aspect_ratio: 'square',
        elements,
      },
    },
  };
}

module.exports = {
  textTemplate,
  urlButton,
  quickReplyButton,
  postbackButton,
  shareButton,
  buttonTemplate,
  galleryTemplate,
  cardTemplate,
};
