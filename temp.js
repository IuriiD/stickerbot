const log = require('./config/logger');
const { User } = require('./models/');

/**
 * getStatus() reads status of dialog for user from "Users"
 * @param {string} userId User's FB PSID
 * @returns {object} { status: 'ok', payload: 'null || 'imagePrompted' || ...' }
 * or {status: 'error', payload: '<error message>'}
 */
async function getStatus(userId) {
  try {
    const queryData = await User.findOne({ attributes: ['status'] }, { where: { psid: userId } });
    if (!queryData) {
      return { status: 'error', payload: `Failed to find user ${userId} in DB` };
    }
    return { status: 'ok', payload: queryData.dataValues.status };
  } catch (error) {
    log.info(`getStatus() error: ${error}`);
    return { status: 'error', payload: `Failed to get dialog status for user ${userId}` };
  }
}

/**
 * setStatus() sets new dialog status in "Users" for user with userId
 * @param {string} userId User's FB PSID
 * @param {string} newStatus null || 'imageReceived' || ...
 * @returns {object} { status: 'ok', payload: '<previous status>' }
 * or {status: 'error', payload: '<error message>'}
 */
async function setStatus(userId, newStatus) {
  try {
    // Read previous dialog status
    let queryData = await getStatus(userId);
    let previousStatus;
    if (queryData && queryData.status === 'ok') {
      previousStatus = queryData.payload;
    } else {
      previousStatus = null;
    }

    queryData = await User.upsert({ status: newStatus, psid: userId });
    console.log(queryData);
    return queryData;
  } catch (error) {
    log.info(`setStatus() error: ${error}`);
    return {
      status: 'error',
      payload: `Failed to set new dialog status ${newStatus} for user ${userId}`,
    };
  }
}

// setStatus('123', 'imagePrompted').then(res => console.log(res));
getStatus('123').then(res => console.log(res));

module.exports = {
  getStatus,
  setStatus,
};
