const config = require('../config/');
const log = require('../config/logger');

module.exports = (req, res) => {
  const hubChallenge = req.query['hub.challenge'];
  const hubMode = req.query['hub.mode'];
  const verifyTokenMatches = req.query['hub.verify_token'] === config.VERIFY_TOKEN;

  if (hubMode && verifyTokenMatches) {
    log.info(`Verify token = ${config.VERIFY_TOKEN}. Verification: success`);
    res.status(200).send(hubChallenge);
  } else {
    log.error(`Our verify token = ${config.VERIFY_TOKEN}. Token from FB = ${req.query['hub.verify_token']}. Verification: failed`);
    res.status(403).end();
  }
};
