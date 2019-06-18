const defaultWelcomeIntent = require('./default-welcome-intent');
const defaultFallbackIntent = require('./default-fallback-intent');
const help = require('./help');
const handleAttachmentsPolaroid = require('./handleAttachmentsPolaroid');
const confirmRestart = require('./confirmRestart');
const okThenGoOn = require('./okThenGoOn');
const sendImage = require('./sendImage');
const smthWentWrong = require('./somethingWentWrong');

module.exports = {
  defaultWelcomeIntent,
  defaultFallbackIntent,
  help,
  handleAttachmentsPolaroid,
  confirmRestart,
  okThenGoOn,
  sendImage,
  smthWentWrong,
};
