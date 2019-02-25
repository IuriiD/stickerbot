require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const i18n = require('i18n');

const index = require('./routes/');
const config = require('./config/');
const log = require('./config/logger');
const { initialSetup } = require('./lib/fb-graph-api/');

const app = express();

// initialSetup();

app.use(logger('dev'));

i18n.configure({
  locales: ['en'],
  directory: `${__dirname}/locales`,
});

app.use(i18n.init);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', index);
app.listen(config.PORT, () => {
  log.info(`Application starts successfully in port ${config.PORT}`);
});

/**
 * @TODO NEXT:
 * Gallery of cards in greeting for choosing sticker template
 * Reogranize greeting - if returning visitor, change texts (Welcome bac .... . To make your next custom sticker.... instead of Hi...., to make a custom sticker
 * please choose a template below)
 */
