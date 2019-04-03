const constants = {
  // ==> Phrases
  botName: 'StickerBot',
  hello_username: "Hi, %s! 👋 I'm StickerBot, a chatbot for making stickers",
  hello_no_username: "Hi! 👋 I'm StickerBot, a chatbot for making stickers",
  welcome_back_username: 'Welcome back, %s! 👋',
  welcome_back_no_username: 'Welcome back! 👋',
  to_start_choose_template: 'To start please choose a template below',
  to_start_send_image:
    'To start please send me an image or enter a query and I will suggest some images for you.',
  perfect_choice: 'Perfect choice 😎',
  excellent_taste: 'You have excellent taste 😎',
  gonna_be_perfect_sticker: 'I feel that this gonna be a perfect sticker 😉',
  perfect_one: "This one is perfect. I will save it in Templates in case you'll want to reuse it.",
  sticker_like_this: "We'll get a sticker like this",
  replace_photo_or_provide_text:
    'Now please send me the text for your sticker. You can also replace the image',
  replace_image: 'Replace image',
  resend_image:
    'Ok, please send me another one. Remember that it should be in jpeg or png format, not smaller than 150x150px and not bigger than 3500x2400px, 5Mb max.',
  bad_image:
    "Sorry but this won't work. Please send me an image in jpeg or png format, not smaller than 150x150px and not bigger than 3500x2400px, 5Mb max.",
  bad_phrase: 'Sorry but your phrase should be longer than %s symbols. Please try again.',
  didnt_get_that: "Sorry but I didn't get that 🤔",
  what_should_i_do: 'What should I do?',
  confirm_restart: 'You are going to cancel current operation. Are you sure?',
  nice_image_but_wtf: 'Nice image but what do you want? 🤔',
  yes: 'Yes',
  no: 'No',
  ok_then_go_on: "Ok, then let's continue with what we were doing 😉",
  dummy_text: 'Your text goes here',
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
  // ==> Postback buttons
  // Titles
  btn_title_new_sticker: 'New sticker',
  btn_title_load_sticker: 'Load a sticker',
  btn_title_help: 'Help',
  btn_title_replace_image: 'Replace image',
  // Payloads
  btn_payload_new_sticker: 'NEW_STICKER',
  btn_payload_load_sticker: 'LOAD_STICKER',
  btn_payload_help: 'GET_HELP',
  btn_payload_get_started: 'GET_STARTED',
  btn_payload_sticker_template: 'STICKERTEMPLATE#%s',
  btn_payload_confirm_restart_yes: 'CONFIRM_RESTART_YES',
  btn_payload_confirm_restart_no: 'CONFIRM_RESTART_NO',
  btn_payload_replace_image: 'REPLACE_IMAGE',
  // ==> Dialog statuses
  status_awaiting_image: 'awaitingImage',
  status_choosing_template: 'choosingTemplate',
  status_awaiting_sticker_text: 'awaitingStickerText',
  // ==> Custom error messages
  err501: 'Failed to create user',
  err502: 'Error fetching user from DB',
  // ==> Miscellaneous
  imgMimeType: 'image/png',
};

module.exports = constants;
