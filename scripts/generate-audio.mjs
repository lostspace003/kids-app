// ---------------------------------------------------------------------------
// Pre-generate narration audio with Azure Speech, for The Prophets' Journey.
//
// For every narratable beat (both languages, both travellers) this:
//   1. assembles the EXACT spoken string the app will produce (shared module),
//   2. synthesises it via Azure TTS with warm female voices + SSML pauses,
//   3. captures Azure word-boundary timings,
//   4. writes public/audio/<hash>.mp3 and updates public/audio/manifest.json.
//
// The app then plays public/audio/<hash>.mp3 and highlights words from the
// manifest. Clips are content-hashed, so identical text (e.g. a story panel
// shared between travellers) is generated only once.
//
// Run:  SPEECH_KEY=... SPEECH_REGION=centralindia npm run gen:audio
// Flags: --force  re-synthesise even if the mp3 already exists
//        --limit N  only do the first N missing clips (handy for a test run)
// ---------------------------------------------------------------------------

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import sdk from "microsoft-cognitiveservices-speech-sdk";

process.on("unhandledRejection", (e) => { console.error("UNHANDLED REJECTION:", e); process.exit(1); });

import { PROPHET_DATA } from "../app/data/prophets-data.js";
import { PROPHET_UR } from "../app/data/prophets-ur.js";
import { PROPHET_UR_SCRIPT } from "../app/data/prophets-ur-script.js";
import { PROPHET_AYAH } from "../app/data/prophets-ayah.js";
import { narrationForBeat, enumerateBeats, lineNarration, GENDERS } from "../app/lib/narration.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "audio");

// --- voice config (overridable via env) ----------------------------------
const VOICE = {
  en: process.env.VOICE_EN || "en-US-JennyNeural",
  ur: process.env.VOICE_UR || "ur-PK-AsadNeural", // warm, deep Pakistani storyteller
  ar: process.env.VOICE_AR || "ar-SA-HamedNeural", // spoken-Arabic aid (qari audio is separate)
};
const STYLE = { en: process.env.STYLE_EN || "friendly", ur: "", ar: "" };
const LOCALE = { en: "en-US", ur: "ur-PK", ar: "ar-SA" };
// Per-language prosody. Urdu (Asad) gets a deeper pitch + gentle rate for warmth.
const RATE = { en: process.env.TTS_RATE || "-6%", ur: "-3%", ar: "-6%" };
const PITCH = { en: "0%", ur: "-3%", ar: "0%" };

// Pronunciation lexicon for the Urdu voice — applied only at synthesis (does
// not affect the content hash or word highlighting). Confirmed by ear.
const URDU_LEX = {
  "ماشاءاللہ": `<sub alias="ماشا اللہ">ماشاءاللہ</sub>`,
  "بسم اللہ": `<phoneme alphabet="ipa" ph="bɪsmɪlˈlaːh">بسم اللہ</phoneme>`,
  "دھیان": `<phoneme alphabet="ipa" ph="d̪ʱjaːn">دھیان</phoneme>`,
};
function applyUrduLex(text) {
  let t = text;
  for (const [term, repl] of Object.entries(URDU_LEX)) t = t.split(term).join(repl);
  return t;
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = (() => { const i = args.indexOf("--limit"); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();
const ONLY_LANG = (() => { const i = args.indexOf("--lang"); return i >= 0 ? args[i + 1] : null; })();

// --- credentials ----------------------------------------------------------
let KEY = process.env.SPEECH_KEY;
let REGION = process.env.SPEECH_REGION;
if (!KEY) {
  // Fall back to the Azure CLI (user asked us to provision via `az`).
  try {
    const acct = process.env.SPEECH_ACCOUNT || "gennoor-speech";
    const rg = process.env.SPEECH_RG || "rg-gennoor-tech";
    // Strip ALL whitespace — a stray \r from cmd.exe silently breaks auth.
    KEY = execSync(`az cognitiveservices account keys list --name ${acct} --resource-group ${rg} --query key1 -o tsv`, { encoding: "utf8" }).replace(/\s/g, "");
    REGION = REGION || execSync(`az cognitiveservices account show --name ${acct} --resource-group ${rg} --query location -o tsv`, { encoding: "utf8" }).replace(/\s/g, "");
    console.log(`Using Azure CLI credentials for "${acct}" (${REGION}).`);
  } catch (e) {
    console.error("No SPEECH_KEY set and Azure CLI lookup failed:", e.message);
    process.exit(1);
  }
}
if (!REGION) REGION = "centralindia";

// --- helpers --------------------------------------------------------------
const xmlEscape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// Add gentle pauses after sentence-ending punctuation and clause commas.
function withBreaks(text) {
  // Handles Latin (.!?,—:;) and Urdu (۔ ؟ ؛ ،) punctuation alike.
  return xmlEscape(text)
    .replace(/([.!?۔؟])(\s+)/g, '$1<break time="420ms"/>$2')
    .replace(/([—:;؛])(\s+)/g, '$1<break time="260ms"/>$2')
    .replace(/([,،])(\s+)/g, '$1<break time="140ms"/>$2');
}

function buildSsml(spoken, lang) {
  let content = withBreaks(spoken);
  if (lang === "ur") content = applyUrduLex(content); // pronunciation fixes
  const inner = `<prosody rate="${RATE[lang]}" pitch="${PITCH[lang]}">${content}</prosody>`;
  const body = STYLE[lang]
    ? `<mstts:express-as style="${STYLE[lang]}">${inner}</mstts:express-as>`
    : inner;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${LOCALE[lang]}"><voice name="${VOICE[lang]}">${body}</voice></speak>`;
}

const normWord = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Map Azure word-boundary times onto display tokens. Azure may GROUP several
// words into one boundary (esp. Urdu: "dhyan se") or keep them 1:1 (English),
// so we walk both sides by accumulated text and interpolate within each group.
function alignWords(realMap, realB) {
  const w = [];
  let j = 0;
  for (let i = 0; i < realB.length && j < realMap.length; i++) {
    const target = normWord(realB[i].text);
    const t0 = realB[i].ms;
    const t1 = i + 1 < realB.length ? realB[i + 1].ms : t0 + 400;
    let acc = "";
    const spanned = [];
    while (j < realMap.length && acc.length < target.length) { acc += normWord(realMap[j].text); spanned.push(realMap[j].di); j++; }
    if (!spanned.length && j < realMap.length) { spanned.push(realMap[j].di); j++; }
    const m = spanned.length || 1;
    spanned.forEach((di, k) => w.push([di, Math.round(t0 + (k / m) * (t1 - t0))]));
  }
  // Any tail tokens with no boundary keep the last known time.
  const lastMs = w.length ? w[w.length - 1][1] : 0;
  while (j < realMap.length) { w.push([realMap[j].di, lastMs]); j++; }
  return w;
}

function synthesize(spoken, lang, map, outPath) {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(KEY, REGION);
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3;
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outPath);
    const synth = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    const boundaries = [];
    synth.wordBoundary = (_s, e) => {
      // audioOffset is in 100-ns ticks. Azure also fires boundaries for
      // punctuation marks, so keep the text to filter those out.
      boundaries.push({ ms: Math.round(e.audioOffset / 10000), text: e.text || "" });
    };
    const isWord = (t) => /[\p{L}\p{N}]/u.test(t);
    // Display tokens that carry a spoken word (drop punctuation-only tokens such
    // as the lone "." left by a silent honorific), with their text for matching.
    const realMap = map.filter((m) => isWord(spoken.slice(m.s, m.e))).map((m) => ({ di: m.di, text: spoken.slice(m.s, m.e) }));
    synth.speakSsmlAsync(
      buildSsml(spoken, lang),
      (result) => {
        synth.close();
        if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
          return reject(new Error("Synthesis failed: " + (result.errorDetails || result.reason)));
        }
        const realB = boundaries.filter((b) => isWord(b.text));
        const w = alignWords(realMap, realB);
        const durMs = Math.round((result.audioDuration || 0) / 10000) || (w.length ? w[w.length - 1][1] + 600 : 0);
        resolve({ d: durMs, w, mismatch: realB.length !== realMap.length });
      },
      (err) => { synth.close(); reject(err); }
    );
  });
}

// --- enumerate every clip --------------------------------------------------
function allClips() {
  const clips = new Map(); // key -> { spoken, lang, map }
  for (const d of PROPHET_DATA) {
    const u = PROPHET_UR[d.id] || null;
    const us = PROPHET_UR_SCRIPT[d.id] || null;
    for (const lang of ["en", "ur"]) {
      if (ONLY_LANG && lang !== ONLY_LANG) continue;
      for (const gender of GENDERS) {
        for (const beat of enumerateBeats(d, lang === "ur" ? (us || u) : null)) {
          const r = narrationForBeat({ d, u, us, lang, gender, sub: beat.sub, panel: beat.panel || 0, picked: beat.picked || null });
          if (!r.spoken) continue;
          if (!clips.has(r.key)) clips.set(r.key, { spoken: r.spoken, lang, map: r.map });
        }
      }
    }
  }
  // Ayah audio: spoken Arabic (ar) + EN meaning + UR meaning, per verse.
  for (const id of Object.keys(PROPHET_AYAH)) {
    for (const a of PROPHET_AYAH[id]) {
      for (const [lang, text] of [["ar", a.ar], ["en", a.en], ["ur", a.ur]]) {
        if (ONLY_LANG && lang !== ONLY_LANG) continue;
        const r = lineNarration({ lang, text });
        if (r.spoken && !clips.has(r.key)) clips.set(r.key, { spoken: r.spoken, lang, map: r.map });
      }
    }
  }
  return clips;
}

// Full valid key set across ALL languages (ignores --lang), for pruning.
function validKeySet() {
  const keys = new Set();
  for (const d of PROPHET_DATA) {
    const u = PROPHET_UR[d.id] || null;
    const us = PROPHET_UR_SCRIPT[d.id] || null;
    for (const lang of ["en", "ur"]) {
      for (const gender of GENDERS) {
        for (const beat of enumerateBeats(d, lang === "ur" ? (us || u) : null)) {
          const r = narrationForBeat({ d, u, us, lang, gender, sub: beat.sub, panel: beat.panel || 0, picked: beat.picked || null });
          if (r.spoken) keys.add(r.key);
        }
      }
    }
  }
  for (const id of Object.keys(PROPHET_AYAH)) {
    for (const a of PROPHET_AYAH[id]) {
      for (const [lang, text] of [["ar", a.ar], ["en", a.en], ["ur", a.ur]]) {
        const r = lineNarration({ lang, text });
        if (r.spoken) keys.add(r.key);
      }
    }
  }
  return keys;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

  const clips = allClips();
  const entries = [...clips.entries()];
  console.log(`Voices: en=${VOICE.en}, ur=${VOICE.ur} | ${entries.length} unique clips total.`);

  let done = 0, made = 0, skipped = 0, mismatches = 0, failed = 0;
  for (const [key, clip] of entries) {
    const mp3 = path.join(OUT_DIR, key + ".mp3");
    if (!FORCE && fs.existsSync(mp3) && manifest[key]) { skipped++; continue; }
    if (made >= LIMIT) break;
    try {
      const meta = await synthesize(clip.spoken, clip.lang, clip.map, mp3);
      manifest[key] = { d: meta.d, w: meta.w, l: clip.lang };
      if (meta.mismatch) mismatches++;
      made++;
      process.stdout.write(`  ✓ ${made}/${entries.length - skipped} ${key} (${clip.lang}, ${meta.d}ms, ${meta.w.length}w)${meta.mismatch ? " ~timing" : ""}\n`);
      if (made % 10 === 0) fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    } catch (e) {
      failed++;
      console.error(`  ✗ ${key}: ${e.message}`);
    }
    done++;
  }
  // Prune orphaned clips (e.g. old Roman-Urdu audio replaced by Urdu-script).
  if (!LIMIT || LIMIT === Infinity) {
    const valid = validKeySet();
    let pruned = 0;
    for (const k of Object.keys(manifest)) {
      if (!valid.has(k)) { delete manifest[k]; try { fs.unlinkSync(path.join(OUT_DIR, k + ".mp3")); } catch (e) {} pruned++; }
    }
    if (pruned) console.log(`Pruned ${pruned} orphaned clips.`);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log(`Done. made=${made} skipped=${skipped} failed=${failed} timingMismatches=${mismatches}`);
  console.log(`Manifest: ${manifestPath} (${Object.keys(manifest).length} clips)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
