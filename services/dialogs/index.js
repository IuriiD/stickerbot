const defaultWelcomeIntent = require('./default-welcome-intent');
const defaultFallbackIntent = require('./default-fallback-intent');
const help = require('./help');
const handleAttachments = require('./handleAttachments');

module.exports = {
  defaultWelcomeIntent,
  defaultFallbackIntent,
  help,
  handleAttachments,
};
