const config = require('../config/');

module.exports = (req, res) => {
  const hubChallenge = req.query['hub.challenge'];
  const hubMode = req.query['hub.mode'];
  const verifyTokenMatches = req.query['hub.verify_token'] === config.VERIFY_TOKEN;

  console.log(hubChallenge);
  console.log(hubMode);
  console.log(req.query['hub.verify_token']);
  console.log(config.VERIFY_TOKEN);
  console.log(verifyTokenMatches);

  if (hubMode && verifyTokenMatches) {
    res.status(200).send(hubChallenge);
  } else {
    res.status(403).end();
  }
};
