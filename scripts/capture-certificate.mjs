// ---------------------------------------------------------------------------
// Render the Certificate of Completion (same HTML used by send-certificates.mjs)
// and compose it onto a 1080x1920 portrait canvas for the Play/App Store
// screenshot set -> playstore-screenshots/final/9-certificate.png.
//
// Standalone (no dev server needed):  node scripts/capture-certificate.mjs
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "playstore-screenshots", "final", "9-certificate.png");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const CHILD = process.env.CERT_NAME || "Hamza";
const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const paragraph =
  `${CHILD} has journeyed through the lives of all twenty-five prophets (peace be upon them) — ` +
  `listening to their stories, reflecting on kind choices, and growing in faith, kindness, and knowledge. ` +
  `May Allah bless this beautiful beginning and keep the light of learning always in their heart.`;

function dataUri(file, mime) {
  return `data:${mime};base64,${fs.readFileSync(path.join(ROOT, file)).toString("base64")}`;
}

// Mirrors certificateHtml() in send-certificates.mjs (kept in sync by hand).
function certificateHtml({ childName, dateStr, paragraph, avatar, emblem }) {
  return `<!doctype html><html><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
  <style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif}
  body{width:1122px;height:793px;background:radial-gradient(120% 100% at 50% 0%,#1b1340,#0b0720);color:#f4eede;position:relative;overflow:hidden}
  .frame{position:absolute;inset:28px;border:3px solid #f5c451;border-radius:18px;box-shadow:inset 0 0 0 2px rgba(245,196,81,.3)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px}
  .emblem{width:120px;height:120px;margin-bottom:8px}
  .brand{font-family:'Fredoka',sans-serif;letter-spacing:2px;color:#f5c451;font-size:22px;margin-bottom:6px}
  h1{font-size:46px;color:#fff;margin:10px 0 4px}
  .sub{letter-spacing:6px;font-size:14px;color:rgba(244,238,222,.7);text-transform:uppercase;margin-bottom:22px}
  .avatar{width:140px;height:140px;border-radius:50%;object-fit:cover;border:4px solid #f5c451;margin:6px 0 12px}
  .name{font-size:40px;color:#f5c451;font-weight:bold;margin:6px 0}
  .para{max-width:760px;font-size:18px;line-height:1.6;color:#f0ead8;margin:10px 0}
  .dua{margin-top:14px;padding:14px 26px;border-radius:14px;background:rgba(245,196,81,.08);border:1px solid rgba(245,196,81,.3)}
  .dua-ar{font-family:'Amiri',serif;font-size:34px;color:#f5c451;line-height:1.5;direction:rtl}
  .dua-tr{font-size:15px;color:#cfc8b8;font-style:italic;margin-top:4px}
  .dua-mn{font-size:15px;color:#f0ead8;margin-top:2px}
  .foot{position:absolute;bottom:46px;left:0;right:0;display:flex;justify-content:space-between;padding:0 90px;font-size:14px;color:rgba(244,238,222,.65)}
  </style></head><body><div class="frame"></div><div class="wrap">
    ${emblem ? `<img class="emblem" src="${emblem}"/>` : ""}
    <div class="brand">SAFAR ANBIYA · JOURNEY OF THE PROPHETS</div>
    <h1>Certificate of Completion</h1>
    <div class="sub">Awarded with love and du'a</div>
    ${avatar ? `<img class="avatar" src="${avatar}"/>` : ""}
    <div class="name">${childName}</div>
    <div class="para">${paragraph}</div>
    <div class="dua">
      <div class="dua-ar">رَبِّ زِدْنِي عِلْمًا</div>
      <div class="dua-tr">Rabbi zidnī ‘ilmā</div>
      <div class="dua-mn">“My Lord, increase me in knowledge.” — Qur’an 20:114</div>
    </div>
    <div class="foot"><span>${dateStr}</span><span>gennoor.com · admin@gennoor.com</span></div>
  </div></body></html>`;
}

async function main() {
  const emblem = dataUri("public/brand/png/emblem-512.png", "image/png");
  const avatar = dataUri("public/hamza.webp", "image/webp");
  const html = certificateHtml({ childName: CHILD, dateStr, paragraph, avatar, emblem });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1122, height: 793, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600)); // let webfonts paint
  const certBuf = await page.screenshot({ clip: { x: 0, y: 0, width: 1122, height: 793 } });
  await browser.close();

  // Compose onto a 1080x1920 portrait canvas matching the app's dark sky.
  const CW = 1080, CH = 1920, certW = 1000;
  const resized = await sharp(certBuf).resize({ width: certW }).toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((CW - certW) / 2);
  const top = Math.round((CH - meta.height) / 2);
  await sharp({ create: { width: CW, height: CH, channels: 3, background: { r: 11, g: 7, b: 32 } } })
    .composite([{ input: resized, top, left }])
    .png()
    .toFile(OUT);

  process.stdout.write(`📸 ${path.relative(ROOT, OUT)} (cert ${certW}x${meta.height} on ${CW}x${CH})\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
