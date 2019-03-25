const bunyan = require('bunyan');
const bformat = require('bunyan-format');

const formatOut = bformat({ outputMode: 'short' });

const logger = bunyan.createLogger({
  name: 'StickerbotLogger',
  level: process.env.BUNYAN_LEVEL || 'info', // minimal level for showing logs; set "fatal" for disabling
  stream: formatOut,
});

module.exports = logger;
