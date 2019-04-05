const axios = require('axios');
const { FB_API_BASE_URL, FB_PAGE_ACCESS_TOKEN } = require('../../config/');

function fbGraphApiRequest(method, url, params) {
  const options = {
    url,
    baseURL: FB_API_BASE_URL,
    method,
  };
  options.params = {};
  Object.keys(params).forEach((key) => {
    options[key] = params[key];
  });

  options.params.access_token = FB_PAGE_ACCESS_TOKEN;
  return axios(options);
}

async function request(method, url, params) {
  try {
    return await fbGraphApiRequest(method, url, params);
  } catch (error) {
    return error;
  }
}

module.exports = { request };
