const processMessage = require('../services/');

module.exports = (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          processMessage.botMessage(event);
        } else if (event.postback && event.postback.payload) {
          processMessage.botButton(event);
        } else if (event.message && event.message.attachments) {
          processMessage.botAttachment(event);
        }
      });
    });
    res.status(200).end();
  }
};
