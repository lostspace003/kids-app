// ---------------------------------------------------------------------------
// Capture Play Store / App Store screenshots at exactly 1080x1920 (portrait
// phone: 360x640 CSS @ deviceScaleFactor 3) by driving the running dev server
// with the system Chrome via puppeteer-core.
//
// Pre-auth screens (splash, intro, login) come from the real "/" route.
// Map + stage come from the dev-only "/devmap" route (renders the journey with
// a dummy profile, no login) so the whole interactive flow is reachable.
//
// Run the dev server first (npm run dev), then:  node scripts/capture-screenshots.mjs
//   --lang en|ur   (UI language for map/stage; default en for the store listing)
//   --base http://localhost:3000
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "playstore-screenshots");
const FINAL = path.join(OUT, "final");

const args = process.argv.slice(2);
const argVal = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const LANG = argVal("--lang", "en");
const BASE = argVal("--base", "http://localhost:3000");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FINAL, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=3"],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  const shots = [];
  const shot = async (...names) => {
    // settle: let fonts/animation frame paint
    await sleep(450);
    for (const name of names) {
      const dir = name.includes("/") ? OUT : OUT;
      const file = name.startsWith("final/") ? path.join(OUT, name) : path.join(OUT, name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file });
      shots.push(name);
      process.stdout.write(`  📸 ${name}\n`);
    }
  };

  // Helpers that operate on the live DOM.
  const cardText = () =>
    page.evaluate(() => {
      const card = document.querySelector(".ipj-scroll");
      return card ? card.innerText : "";
    });
  const clickSel = async (sel, nth = 0) =>
    page.evaluate((s, n) => {
      const els = [...document.querySelectorAll(s)];
      if (els[n]) { els[n].click(); return true; }
      return false;
    }, sel, nth);
  const clickText = async (txt) =>
    page.evaluate((t) => {
      const els = [...document.querySelectorAll("button, a")];
      const el = els.find((e) => (e.innerText || "").toLowerCase().includes(t.toLowerCase()));
      if (el) { el.click(); return true; }
      return false;
    }, txt);
  const has = async (sel) => page.evaluate((s) => !!document.querySelector(s), sel);
  const waitCard = async () => { try { await page.waitForSelector(".ipj-scroll", { timeout: 8000 }); } catch {} };

  // ---- Pre-auth screens (real site) ------------------------------------
  await page.evaluateOnNewDocument((lang) => {
    try { localStorage.setItem("ipj_lang_v2", lang); localStorage.setItem("ipj_voice", "male"); } catch (e) {}
  }, LANG);

  process.stdout.write("Pre-auth screens…\n");
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await sleep(1200);
  await shot("01-splash.png", "final/1-launch.png");

  // Splash → intro/about
  if (await clickText("begin")) { await sleep(1200); await shot("02-about.png"); }
  // Intro → login
  if (await clickText("login")) { await sleep(1200); await shot("03-login.png"); }

  // ---- Map + stage (dev preview route) ---------------------------------
  process.stdout.write("Map + stage…\n");
  await page.goto(`${BASE}/devmap`, { waitUntil: "networkidle2" });
  await sleep(1600);
  await shot("04-map.png", "final/2-journey-map.png");

  // Scrolled map
  await page.evaluate(() => {
    const sc = document.querySelector(".ipj-scroll, .ipj-scroll-map") || document.scrollingElement;
    const target = document.querySelector('[class*="ipj-scroll"]');
    (target || window).scrollBy ? (target || window).scrollBy(0, 700) : window.scrollTo(0, 700);
  });
  await sleep(700);
  await shot("05-map-scrolled.png");

  // Open prophet #1 → language modal
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const node = btns.find((b) => (b.innerText || "").trim() === "1");
    if (node) node.click();
  });
  await sleep(900);
  if (await has(".ipj-primary")) await shot("06-language-picker.png", "final/8-languages.png");

  // Choose language → enter stage
  if (LANG === "en") await clickText("English");
  else await clickSel(".ipj-choice", 0);
  await waitCard();
  await sleep(1000);

  // Walk the beats. Fixed order: arrive → story* → decision → dres → modern →
  // mres → ayah* → quiz → reward.
  let stageN = 0;
  let seenAyah = false;
  const named = {};
  for (let step = 0; step < 40; step++) {
    const txt = (await cardText()).toLowerCase();
    stageN++;
    const stageName = `${String(6 + stageN).padStart(2, "0")}-stage-${String(stageN).padStart(2, "0")}.png`;

    // Identify beat for the curated final/ set (first occurrence wins).
    const isAyah = /qur|verse|aayat|ayah/.test(txt) || (await has('[style*="direction:rtl"]'));
    const hasPrimary = await has(".ipj-primary");
    const hasChoice = await has(".ipj-choice");
    const isReward = /land lit|manzil roshan|noor|badge|tamgha/.test(txt) && /journey|safar/.test(txt);

    const extra = [];
    if (/the story|kahani/.test(txt) && !named.story) { named.story = 1; extra.push("final/3-story.png"); }
    if (isAyah && !named.ayah) { named.ayah = 1; extra.push("final/4-quran-ayah.png"); seenAyah = true; }
    if (isAyah) seenAyah = true;
    if (hasChoice && !hasPrimary && !seenAyah && !named.decision) { named.decision = 1; extra.push("final/5-decision.png"); }
    if (hasChoice && !hasPrimary && seenAyah && !named.quiz) { named.quiz = 1; extra.push("final/6-quiz.png"); }
    if (isReward && !named.reward) { named.reward = 1; extra.push("final/7-reward-badge.png"); }

    await shot(stageName, ...extra);

    if (isReward) break;

    // Advance.
    if (hasPrimary) {
      await clickSel(".ipj-primary", 0);
    } else if (hasChoice) {
      await clickSel(".ipj-choice", 0);
    } else {
      break;
    }
    await sleep(950);
  }

  await browser.close();
  process.stdout.write(`\nDone. ${shots.length} screenshots written to playstore-screenshots/.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
