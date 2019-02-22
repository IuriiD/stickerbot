/**
 * Facebook messenger templages, both basic
 * and customised
 */

// Text message
function textTemplate(message) {
  return {
    text: message,
  };
}

// Url button
function urlButton(title, url) {
  return {
    title,
    url,
    type: 'web_url',
  };
}

// Quick reply button
function quickReplyButton(title, payload) {
  return { content_type: 'text', title, payload };
}

// Postback button
function postbackButton(title, payload) {
  return { type: 'postback', title, payload };
}

// Share button
function shareButton() {
  return { type: 'element_share' };
}

// Button template
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

// Single card (generic) template
function cardTemplate(cardData) {
  return {
    title: cardData.title,
    image_url: cardData.imageUrl,
    buttons: cardData.buttons,
    subtitle: cardData.subtitle,
  };
}

// Carousel of cards
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
