const sharp = require('./worker/node_modules/sharp');
const fs = require('fs');
const src = 'public/images/hero.webp';
const tmp = 'public/images/hero.new.webp';
(async () => {
  const before = fs.statSync(src).size;
  await sharp(src).resize({ width: 1920, withoutEnlargement: true }).webp({ quality: 78 }).toFile(tmp);
  const m = await sharp(tmp).metadata();
  const after = fs.statSync(tmp).size;
  fs.rmSync(src);
  fs.renameSync(tmp, src);
  console.log('before', (before/1024).toFixed(0)+' KB  ->  after', m.width+'x'+m.height, (after/1024).toFixed(0)+' KB');
})();
