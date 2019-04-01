const processMessage = require('../services/');
const log = require('../config/logger');

module.exports = (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          log.info(`Processing text message = ${event.message.text}`);
          processMessage.botMessage(event);
        } else if (event.postback && event.postback.payload) {
          log.info(`Processing button click, postback = ${event.postback.payload}`);
          processMessage.botButton(event);
        } else if (event.message && event.message.attachments) {
          log.info('Processing attachment =', event.message.attachments);
          processMessage.botAttachment(event);
        }
      });
    });
    res.status(200).end();
  }
};
