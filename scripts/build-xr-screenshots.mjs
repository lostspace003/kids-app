// ---------------------------------------------------------------------------
// Build Google Play **Android XR** screenshots (strict 8:5 landscape, 3840×2400)
// from the curated portrait shots. XR can't use a raw portrait capture, so each
// portrait image is centred on a branded 8:5 canvas (the app's own deep-purple
// radial gradient) with rounded corners + a soft shadow — the standard XR look.
//
// Source: playstore-screenshots/chromebook/final/*.png  (9:16 portrait)
//   (falls back to playstore-screenshots/tablet-10/final if chromebook missing)
// Output: playstore-screenshots/android-xr/*.png
//
// Run:  node scripts/build-xr-screenshots.mjs
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Canvas: 8:5 landscape, Play's recommended XR resolution.
const CW = 3840, CH = 2400;

const SRC_CANDIDATES = [
  path.join(ROOT, "playstore-screenshots/chromebook/final"),
  path.join(ROOT, "playstore-screenshots/tablet-10/final"),
];
const SRC = SRC_CANDIDATES.find((d) => fs.existsSync(d));
const OUT = path.join(ROOT, "playstore-screenshots/android-xr");

if (!SRC) {
  console.error("No source folder. Run the chromebook (or tab10) capture first.");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

// Brand backdrop (matches app C.bg): deep-purple radial → near-black, gold glow.
const backdrop = Buffer.from(
  `<svg width="${CW}" height="${CH}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <radialGradient id="bg" cx="50%" cy="0%" r="95%">
         <stop offset="0%"  stop-color="#1b1340"/>
         <stop offset="55%" stop-color="#0c0820"/>
         <stop offset="100%" stop-color="#070512"/>
       </radialGradient>
       <radialGradient id="glow" cx="50%" cy="42%" r="42%">
         <stop offset="0%"  stop-color="#f5c451" stop-opacity="0.10"/>
         <stop offset="100%" stop-color="#f5c451" stop-opacity="0"/>
       </radialGradient>
     </defs>
     <rect width="100%" height="100%" fill="url(#bg)"/>
     <rect width="100%" height="100%" fill="url(#glow)"/>
   </svg>`
);

// Rounded-corner mask for the foreground screenshot.
function roundedMask(w, h, r) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${w}" height="${h}" rx="${r}" ry="${r}"/>
     </svg>`
  );
}

async function buildOne(srcFile, outFile) {
  const meta = await sharp(srcFile).metadata();
  // Scale the portrait shot to ~84% of canvas height, keep aspect.
  const targetH = Math.round(CH * 0.84);
  const targetW = Math.round((meta.width / meta.height) * targetH);
  const r = Math.round(targetW * 0.055);

  const fg = await sharp(srcFile)
    .resize(targetW, targetH, { fit: "fill" })
    .composite([{ input: roundedMask(targetW, targetH, r), blend: "dest-in" }])
    .png()
    .toBuffer();

  // Soft drop shadow: a blurred dark rounded rect behind the screenshot.
  const padBlur = 60;
  const shadow = await sharp({
    create: { width: targetW + padBlur * 2, height: targetH + padBlur * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{
      input: await sharp({ create: { width: targetW, height: targetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.55 } } })
        .composite([{ input: roundedMask(targetW, targetH, r), blend: "dest-in" }])
        .png().toBuffer(),
      left: padBlur, top: padBlur,
    }])
    .blur(36)
    .png()
    .toBuffer();

  const left = Math.round((CW - targetW) / 2);
  const top = Math.round((CH - targetH) / 2);

  await sharp(backdrop)
    .composite([
      { input: shadow, left: left - padBlur, top: top - padBlur + 18 },
      { input: fg, left, top },
    ])
    .png()
    .toFile(outFile);

  process.stdout.write(`  🛰️  ${path.basename(outFile)}  (${CW}×${CH})\n`);
}

async function main() {
  const files = fs.readdirSync(SRC).filter((f) => /\.png$/i.test(f)).sort();
  process.stdout.write(`Source: ${path.relative(ROOT, SRC)}  (${files.length} images)\n`);
  let n = 0;
  for (const f of files) {
    await buildOne(path.join(SRC, f), path.join(OUT, f));
    n++;
  }
  process.stdout.write(`\nDone. ${n} Android XR screenshots written to playstore-screenshots/android-xr/.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
