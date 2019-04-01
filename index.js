require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');

const index = require('./routes/');
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

app.use('/', index);
app.listen(config.PORT, () => {
  log.info(`${constants.botName} starts successfully in port ${config.PORT}`);
});

/**
 * @TODO NEXT:
 * Gallery of cards in greeting for choosing sticker template
 * Reogranize greeting - if returning visitor, change texts (Welcome bac .... . To make your next custom sticker.... instead of Hi...., to make a custom sticker
 * please choose a template below)
 */
