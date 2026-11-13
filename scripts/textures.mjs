// One-off asset pipeline: resizes NASA source images (see CREDITS.md) into WebP textures
// and simplifies the PB2002 plate boundary GeoJSON. Usage: node scripts/textures.mjs <sourceDir>
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
const out = 'public/textures';
sharp.cache(false);
const jobs = [
  ['day.jpg', 'earth-day', 82, false],
  ['night.jpg', 'earth-night', 78, false],
  ['topo.jpg', 'earth-topo', 80, true],
];
for (const [file, name, quality, grey] of jobs) {
  for (const width of [4096, 2048]) {
    if (grey && width === 4096) continue;
    let img = sharp(join(src, file), { limitInputPixels: false }).resize(width, width / 2);
    if (grey) img = img.greyscale();
    await img.webp({ quality }).toFile(join(out, `${name}-${width === 4096 ? '4k' : '2k'}.webp`));
  }
}
const geo = JSON.parse(readFileSync(join(src, 'plates.json'), 'utf8'));
const lines = geo.features.map((f) => {
  const c = f.geometry.coordinates;
  const keep = c.filter((_, i) => i % 2 === 0 || i === c.length - 1);
  return keep.map(([lon, lat]) => [Math.round(lon * 10) / 10, Math.round(lat * 10) / 10]);
});
writeFileSync('public/data/plates.json', JSON.stringify(lines));
console.log('done', lines.length, 'plate boundary segments');
