const defaultWelcomeIntent = require('./default-welcome-intent');
const defaultFallbackIntent = require('./default-fallback-intent');
const help = require('./help');
const handleAttachments = require('./handleAttachments');
const confirmRestart = require('./confirmRestart');
const okThenGoOn = require('./okThenGoOn');
const sendImage = require('./sendImage');

module.exports = {
  defaultWelcomeIntent,
  defaultFallbackIntent,
  help,
  handleAttachments,
  confirmRestart,
  okThenGoOn,
  sendImage,
};
