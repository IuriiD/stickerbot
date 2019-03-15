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
  // Postback button payloads
  btn_payload_make_sticker: 'MAKE_STICKER',
  btn_payload_load_sticker: 'LOAD_STICKER',
  btn_payload_help: 'GET_HELP',
  btn_payload_get_started: 'GET_STARTED',
  // Dialog statuses
  status_awaiting_image: 'awaitingImage',
  // Custom error messages
  err501: 'Failed to create user',
  err502: 'Error fetching user from',
};

module.exports = constants;
