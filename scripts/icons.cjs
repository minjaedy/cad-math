const sharp=require('sharp'),fs=require('fs'),path=require('path');
(async()=>{const dir=path.join(__dirname,'../public/icons'),svg=fs.readFileSync(path.join(dir,'icon.svg'));
for(const size of [32,192,512,1024])await sharp(svg).resize(size,size).png().toFile(path.join(dir,`icon-${size}.png`));
const full=Buffer.from(svg.toString().replace('viewBox="0 0 1024 1024"','viewBox="0 0 1024 1024"').replace('<rect x="58"','<rect width="1024" height="1024" fill="#e8edda"/><rect x="58"'));
await sharp(full).resize(512,512).png().toFile(path.join(dir,'maskable-512.png'));
await sharp(full).resize(180,180).png().toFile(path.join(dir,'apple-touch-icon.png'));
console.log('App icons: transparent Dock/desktop PNGs, opaque Apple/maskable PNGs.');})();
