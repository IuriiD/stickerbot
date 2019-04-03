const path = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');
const log = require('../../config/logger');
const config = require('../../config/');

const s3bucket = new AWS.S3({
  accessKeyId: config.AWS_ACCESSKEY,
  secretAccessKey: config.AWS_SECRETKEY,
  region: config.AWS_REGION,
  params: { Bucket: config.AWS_BUCKET },
});

/**
 * uploadToS3() uploads file to AWS S3
 */
async function uploadToS3(filename, directory, mimetype, data) {
  const funcName = 'uploadToS3()';
  log.info(`${funcName}: filename = ${filename}, mimetype = ${mimetype}, `);
  try {
    if (!filename || !data || !mimetype) {
      const message = 'Filename, mimetype and/or image data missing';
      log.error(`${funcName}: ${message}`);
      return { status: 500, data: message };
    }
    const uploadResult = await s3bucket
      .upload({
        Key: `${directory}/${filename}`,
        Body: data,
        ContentType: mimetype,
        ACL: 'public-read',
      })
      .promise();
    log.info(`${funcName}: uploadResult = `, uploadResult);
    return { status: 200, data: uploadResult.Location };
  } catch (error) {
    const message = `Failed to upload file to S3, error: ${error}`;
    log.error(`${funcName}: ${message}`);
    return { status: 500, data: message };
  }
}

const filePath = path.join(__dirname, '1.jpg');
const rS = fs.createReadStream(filePath);
// uploadToS3('hello.jpg', config.AWS_PREVIEW_FOLDER, 'image/jpeg', rS);

module.exports = {
  uploadToS3,
};
