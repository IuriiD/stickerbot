/**
 * Facebook messenger templages,
 * both basic and customised
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

// Media template
function mediaTemplate(mediaType, url /* , buttons = null */) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'media',
        elements: [
          {
            media_type: mediaType,
            url,
            // buttons,
          },
        ],
      },
    },
  };
}

// Single generic template
function generic(title, url, buttons, subtitle = '') {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        // image_aspect_ratio: 'square',
        elements: [
          {
            title,
            image_url: url,
            subtitle,
            buttons,
          },
        ],
      },
    },
  };
}

// Generic template for carousel
function genericForCarousel(title, url, buttons, subtitle = '') {
  return {
    title,
    image_url: url,
    subtitle,
    buttons,
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
  mediaTemplate,
  generic,
  genericForCarousel,
};
