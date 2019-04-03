const path = require('path');
const fs = require('fs');
const gm = require('gm').subClass({ imageMagick: true });
const log = require('../../config/logger');

const resultsDir = path.join(__dirname, '../..', 'uploads');
const sourceDir = path.join(resultsDir, 'raw');

/**
 * polaroidV1() creates a polaroid-style sticker (v1)
 * @param {string} text Text to display in polaroid-style sticker
 * @returns {string} Url/path to the stiker file
 */
async function polaroidV1(fileName, text) {
  const funcName = 'polaroidV1()';
  log.info(
    `${funcName}: fileName = ${fileName}, text = ${fileName}, sourceDir = ${sourceDir}, resultsDir = ${resultsDir}`,
  );
  try {
    const readyStickerUrl = `${resultsDir}/${fileName}.png`;
    gm()
      .command('convert')
      .in('-caption', text)
      .in('-font', 'Ubuntu')
      .in('-gravity', 'center')
      .in(`${sourceDir}/${fileName}`)
      .in('-auto-orient')
      .in('-thumbnail', '250x250')
      .in('-sharpen', '10')
      .in('-bordercolor', 'white')
      .in('-fill', 'black')
      .in('-background', 'grey20')
      .in('+polaroid')
      .in('-background', 'Transparent')
      .write(readyStickerUrl, (err) => {
        if (err) {
          const message = `Failed to create a POLAROID_V1 sticker: ${err}`;
          log.error(`${funcName}: ${message}`);
          return { status: 500, payload: message };
        }
        if (!err) {
          const message = `POLAROID_V1 sticker for file ${fileName} and text "${text}" successfully created`;
          log.info(`${funcName}: ${message}`);
          return { status: 200, payload: readyStickerUrl };
        }
      });
  } catch (error) {
    const message = `Failed to create a POLAROID_V1 sticker: ${error}`;
    log.error(`${funcName}: ${message}`);
    return { status: 500, payload: message };
  }
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
