const path = require('path');
const gm = require('gm').subClass({ imageMagick: true });
const log = require('../../config/logger');

const photoPath = path.join(__dirname, '../..', 'temp');

/**
 * polaroid_v1() creates a polaroid-style sticker (v1)
 * @param {string} text Text to display in polaroid-style sticker
 * @returns {string} Url/path to the stiker file
 */
async function polaroid_v1(filePath, text) {
  try {
    gm()
      .command('convert')
      .in('-caption', text)
      .in('-font', 'Ubuntu')
      .in('-gravity', 'center')
      .in(filePath)
      .in('-auto-orient')
      .in('-thumbnail', '250x250')
      .in('-sharpen', '10')
      .in('-bordercolor', 'white')
      .in('-fill', 'black')
      .in('-background', 'grey20')
      .in('+polaroid')
      .in('-background', 'Transparent')
      .write(`${photoPath}/result_${Math.random()}.png`, (err) => {
        if (err) {
          const message = `Failed to create a POLAROID_V1 sticker: ${err}`;
          log.error(`polaroid_v1(): ${message}`);
          return { status: 'error', payload: message };
        }
        if (!err) {
          const message = `POLAROID_V1 sticker for file ${filePath} and text "${text}" successfully created`;
          log.info(`polaroid_v1(): ${message}`);
          return { status: 'ok', payload: `polaroid_v1(): ${message}` };
        }
      });
  } catch (error) {
    const message = `Failed to create a POLAROID_V1 sticker: ${error}`;
    log.error(`polaroid_v1(): ${message}`);
    return { status: 'error', payload: message };
  }
}
/*
const fileName = 'IMG_0798.JPG';
const fileName1 = 'IMG_0764.JPG';
const fileName2 = 'IMG_0822.JPG';
const fileName4 = 'face2018.jpg';
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
