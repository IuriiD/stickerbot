const express = require('express');
const fbAunt = require('./fb-init');

const router = express.Router();

router.get('/health', (req, res) => {
  res.send('OK');
});

router.use(fbAunt);

module.exports = router;
