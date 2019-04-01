const constants = require('../../../services/helpers/constants');

module.exports = {
  persistent_menu: [
    {
      locale: 'default',
      composer_input_disabled: false,
      call_to_actions: [
        {
          type: 'postback',
          title: constants.btn_title_new_sticker,
          payload: constants.btn_payload_new_sticker,
        },
        {
          type: 'postback',
          title: constants.btn_title_load_sticker,
          payload: constants.btn_payload_load_sticker,
        },
        {
          type: 'postback',
          title: constants.btn_title_help,
          url: constants.btn_payload_help,
        },
      ],
    },
  ],
};
