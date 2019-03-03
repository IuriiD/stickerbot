const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadImage(url, psid) {
  const filePath = path.resolve(__dirname, '../../stickers', `${psid}-${Math.random()}.png`);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve => filePath);
    writer.on('error', reject => false);
  });
}

const url = 'https://scontent.xx.fbcdn.net/v/t1.15752-9/53117722_1787598548008877_4165699608002953216_n.png?_nc_cat=102&_nc_ad=z-m&_nc_cid=0&_nc_zor=9&_nc_ht=scontent.xx&oh=66a6c7f945b2443b3fea0adbb40f417c&oe=5D1F784E';
const psid = 'TESTPSID';
downloadImage(url, psid).then(res => console.log(res));

https://stackoverflow.com/questions/12740659/downloading-images-with-node-js