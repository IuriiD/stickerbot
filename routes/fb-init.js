const express = require('express');

const router = express.Router();
const verificationController = require('../controllers/verification');
const messageWebhookController = require('../controllers/messageWebhook');

router.get('/', verificationController);
router.post('/', messageWebhookController);

module.exports = router;
