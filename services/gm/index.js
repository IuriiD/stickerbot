const path = require('path');
const fs = require('fs');
const gm = require('gm').subClass({ imageMagick: true });
const log = require('../../config/logger');

const resultsPath = path.join(__dirname, '../..', 'uploads');
const sourcePath = path.join(resultsPath, 'raw');

/**
 * polaroidV1() creates a polaroid-style sticker (v1)
 * @param {string} text Text to display in polaroid-style sticker
 * @param {string} fileName Name of input and output file, with extension (e.g. hello_world.png)
 * @returns {string} Name of result file with extension
 */
async function polaroidV1(fileName, text) {
  const funcName = 'polaroidV1()';
  log.info(
    `${funcName}: fileName = ${fileName}, text = ${text}, source image = ${sourcePath}/${fileName}, result = ${resultsPath}/${fileName}`,
  );
  const fileNameWithoutExtension = fileName.split('.')[0];
  const stickerUrl = `${resultsPath}/${fileNameWithoutExtension}.png`;

  return new Promise((resolve, reject) => {
    gm()
      .command('convert')
      .in('-caption', text)
      .in('-font', 'Ubuntu')
      .in('-gravity', 'center')
      .in(`${sourcePath}/${fileName}`)
      .in('-auto-orient')
      .in('-thumbnail', '250x250')
      .in('-sharpen', '10')
      .in('-bordercolor', 'white')
      .in('-fill', 'black')
      .in('-background', 'grey20')
      .in('+polaroid')
      .in('-background', 'Transparent')
      .write(stickerUrl, (err) => {
        if (err) {
          const message = `Failed to create a POLAROID_V1 sticker: ${err}`;
          log.error(`${funcName}: ${message}`);
          reject({ status: 500, data: message });
        }
        if (!err) {
          const message = `POLAROID_V1 sticker for file ${fileName} and text "${text}" successfully created = ${stickerUrl}`;
          log.info(`${funcName}: ${message}`);
          resolve({
            status: 200,
            data: { stickerUrl, fileName: `${fileNameWithoutExtension}.png` },
          });
        }
      });
  });
}

module.exports = { polaroidV1 };
/*
const fileName = 'file1.jpg';
const fileName1 = 'file2.png';
const fileName2 = 'file3.jpg';
const myPath = path.resolve(__dirname, fileName1);
console.log(myPath);
if (fs.existsSync(myPath)) {
  console.log('File exists!');
}
polaroidV1(myPath, 'Hello world!');
*/
/*
gm(myPath).size((err, size) => {
  if (err) {
    console.log(err);
  } else {
    console.log(size);
  }
});
*/
/*
const fileName = 'show-me-morpheus.jpg';
const fileName1 = 'Screenshot from 2019-04-02 14-51-13.png';
const fileName2 = 'red-pill-blue-pill.jpg';
console.log(`photoPath = ${photoPath}`);

gm(`${photoPath}/${fileName}`).size((err, size) => {
  if (!err) {
    console.log(`size = ${JSON.stringify(size)})`);
  } else {
    console.log(`error = ${err}`);
  }
});
*/
/*
gm(`${photoPath}/${fileName}`)
  .autoOrient()
  .write(`${photoPath}/result2.png`, (err) => {
    if (!err) console.log('done');
  });
  */

/*
gm(`${photoPath}/${fileName}`)
  .flip()
  .magnify()
  .rotate('green', 45)
  .blur(7, 3)
  .crop(300, 300, 150, 130)
  .edge(3)
  .write(`${photoPath}/result3.png`, (err) => {
    if (!err) console.log('crazytown has arrived');
  });
  */

/*
gm(`${photoPath}/${fileName}`)
  .stroke('#ffffff')
  .drawCircle(10, 10, 20, 10)
  .font('Helvetica.ttf', 12)
  .drawText(30, 20, 'GMagick!')
  .write(`${photoPath}/result4.png`, (err) => {
    if (!err) console.log('done');
  });
  */

/*
gm(`${photoPath}/${fileName}`)
  .in('-background', 'none')
  .in('-font', 'Verdana')
  .in('-fill', 'red')
  .in('-gravity', 'center')
  .in('-size', '165x70')
  .in('label:ImageMagic\nis cool!')
  .write(`${photoPath}/result_${Math.random()}.png`, (err) => {
    if (!err) console.log('done');
    if (err) console.log(err);
  });
  */

/*
gm()
  .montage(`${photoPath}/${fileName}`)
  .montage(`${photoPath}/${fileName1}`)
  .geometry('+100+150')
  .write(`${photoPath}/result_${Math.random()}.png`, (err) => {
    if (!err) console.log('done');
    if (err) console.log(err);
  });
*/

// Polaroid
/*
gm()
  .command('convert')
  .in('-caption', 'Hello world2')
  .in(`${photoPath}/${fileName1}`)
  .in('-thumbnail', '250x250')
  .in('+polaroid')
  // insert other options...
  .write(`${photoPath}/result_${Math.random()}.png`, (err) => {
    if (err) return console.log(err);
    if (!err) console.log('Done');
  });
*/
