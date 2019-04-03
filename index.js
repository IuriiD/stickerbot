require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const s3 = require('./lib/aws/s3');

const routs = require('./routes/');
const config = require('./config/');
const log = require('./config/logger');
const { initialSetup } = require('./lib/fb-graph-api/');
const constants = require('./services/helpers/constants');

const app = express();

app.use(express.static('uploads'));

// initialSetup();

app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', routs);
app.listen(config.PORT, () => {
  log.info(`${constants.botName} starts successfully in port ${config.PORT}`);
});
