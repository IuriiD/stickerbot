/**
 * Facebook messenger templages,
 * both basic and customised
 */

const log = require('../../config/logger');

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

// Media template (can have 1 button)
function mediaTemplate(mediaType, attachmentId, url, buttons = null) {
  const funcName = 'mediaTemplate()';
  const payload = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'media',
        elements: [
          {
            media_type: mediaType,
            // url,
            // buttons,
          },
        ],
      },
    },
  };
  if (attachmentId) {
    payload.attachment.payload.elements[0].attachment_id = attachmentId;
  } else if (url) {
    payload.attachment.payload.elements[0].url = url;
  } else {
    const message = 'Neither attachment id nor url were provided, aborting...';
    log.error(`${funcName}: ${message}`);
    return { status: 500, data: message };
  }

  if (buttons) {
    payload.attachment.payload.elements[0].buttons = [buttons[0]];
  }
  return { status: 200, data: payload };
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
