const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'VerizonBot-BunyanLogger',
  level: process.env.BUNYAN_LEVEL || 'info', // minimal level for showing logs; set "fatal" for disabling
  stream: process.stdout,
});

module.exports = logger;
