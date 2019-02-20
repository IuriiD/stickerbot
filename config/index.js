const joi = require('joi');

const schema = joi
  .object()
  .options({ abortEarly: false })
  .keys({
    ENV: joi.string().default('development'),
    NODE_ENV: joi.string().default('development'),
    PORT: joi
      .number()
      .required()
      .default(8080),
    FB_PAGE_ACCESS_TOKEN: joi.string().required(),
    FB_API_BASE_URL: joi.string().required(),
    FB_APP_ID: joi.number().required(),
    VERIFY_TOKEN: joi.string().required(),
    DEFAULT_MSG_DELAY_MSEC: joi
      .number()
      .required()
      .default(2000),
  })
  .unknown()
  .required();
const { error, value: envVars } = joi.validate(process.env, schema);
if (error) {
  throw error.message;
}
const config = Object.freeze(JSON.parse(JSON.stringify(envVars)));

module.exports = config;
