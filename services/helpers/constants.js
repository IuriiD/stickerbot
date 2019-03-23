const constants = {
  greetings: [
    'hi',
    'hello',
    'helo',
    'hey',
    'good morning',
    'morning',
    'good day',
    'welcome',
    'aloha',
    'привет',
    'start over',
    'restart',
    'from beginning',
    'from the beginning',
    'begin',
    'start',
    'get started',
    'get_started',
    'hii',
    'good evening',
    'evening',
    'welcome',
    'hey there',
  ],
  // Variants of title for button to choose sticker template
  chooseTemplateBtnTitles: [
    "I'll take this one",
    'This one is perfect',
    "Let's go",
    "That's what I need",
    "I'll try this one",
  ],
  // Postback button payloads
  btn_payload_make_sticker: 'MAKE_STICKER',
  btn_payload_load_sticker: 'LOAD_STICKER',
  btn_payload_help: 'GET_HELP',
  btn_payload_get_started: 'GET_STARTED',
  btn_payload_sticker_template: 'STICKERTEMPLATE#%s',
  // Dialog statuses
  status_awaiting_image: 'awaitingImage',
  // Custom error messages
  err501: 'Failed to create user',
  err502: 'Error fetching user from',
};

module.exports = constants;
