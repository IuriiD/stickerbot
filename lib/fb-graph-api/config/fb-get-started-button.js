const constants = require('../../../services/helpers/constants');

module.exports = {
  setting_type: 'call_to_actions',
  thread_state: 'new_thread',
  call_to_actions: [
    {
      payload: constants.btn_payload_get_started,
    },
  ],
};
