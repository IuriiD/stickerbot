const fs = require('fs');
const uuid = require('uuid/v4');
const path = require('path');
const axios = require('axios');
const log = require('../../config/logger');

async function downloadImage(url, psid) {
  const funcName = 'downloadImage()';
  log.info(`${funcName}: url = ${url}, psid = ${psid}`);
  if (!psid) {
    const message = 'No PSID provided, aborting..';
    log.error(`${funcName}: ${message}`);
    return { status: 500, data: message };
  }
  try {
    const relPathToRawImgFolder = '../../uploads/raw';
    const fileExtension = url
      .split('?_nc_cat')[0]
      .split('.')
      .slice(-1)[0];
    log.info(`${funcName}: image extension = `, fileExtension);

    const filePath = path.resolve(
      __dirname,
      relPathToRawImgFolder,
      `${psid}===${uuid()}.${fileExtension}`,
    );
    log.info(`${funcName}: filePath = `, filePath);

    const writer = fs.createWriteStream(filePath);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve({ status: 200, data: filePath }));
      writer.on('error', error => reject({ status: 500, data: error }));
    });
  } catch (error) {
    log.error(`${funcName}: error = `, error);
    return { status: 500, data: error };
  }
}

/*
const url = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/53117722_1787598548008877_4165699608002953216_n.png?_nc_cat=102&_nc_ad=z-m&_nc_cid=0&_nc_zor=9&_nc_ht=scontent.xx&oh=66a6c7f945b2443b3fea0adbb40f417c&oe=5D1F784E';
const url1 = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/56178542_836027710109436_4291484549969346560_n.jpg?_nc_cat=107&_nc_ad=z-m&_nc_cid=0&_nc_zor=9&_nc_ht=scontent.xx&oh=0216cc590bebd555f17af9fb76571398&oe=5D45928F';
const psid = 'TESTPSID';
*/
// downloadImage(url, psid).then(res => console.log(res));

module.exports = { downloadImage };
