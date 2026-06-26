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
  ur: process.env.VOICE_UR || "ur-PK-AsadNeural", // Urdu MALE — warm, deep Pakistani storyteller
  ur_f: process.env.VOICE_UR_F || "ur-PK-UzmaNeural", // Urdu FEMALE
  ar: process.env.VOICE_AR || "ar-SA-HamedNeural", // spoken-Arabic aid (qari audio is separate)
};
const STYLE = { en: process.env.STYLE_EN || "friendly", ur: "", ar: "" };
const LOCALE = { en: "en-US", ur: "ur-PK", ar: "ar-SA" };
// Per-language prosody. Urdu is tuned to match the user-approved voice samples
// exactly: rate -4%, natural pitch (no artificial deepening), and no injected
// <break> pauses — the neural voices (Asad / Uzma) pace themselves naturally.
const RATE = { en: process.env.TTS_RATE || "-6%", ur: "-4%", ar: "-6%" };
const PITCH = { en: "0%", ur: "0%", ar: "0%" };

// Normalize stray Arabic *presentation-form* glyphs (and the one mis-read Arabic
// heh) that the Urdu voice skips or mispronounces, to their proper base letters.
// The biggest culprit is the lam-alef ligature ﻻ (U+FEFB), which the voice drops
// entirely — that's the "wala→wa" / half-skipped-word fault. Applied at synthesis
// only, so it does NOT change the content hash: a --force re-render fixes the
// audio without regenerating clip filenames or pruning. The honorific ﷺ (U+FDFA)
// and the Qur'anic ornate brackets ﴾﴿ are deliberately left untouched (a blanket
// NFKC would corrupt them — e.g. ﷺ expands to a full phrase).
const URDU_NORMALIZE = {
  "ﻻ": "لا", // ﻻ → لا  (fixes "wala→wa" / half-skipped words)
  "ﻇ": "ظ",       // ﻇ → ظ
  "ﺛ": "ث",       // ﺛ → ث
  "ﺚ": "ث",       // ﺚ → ث
  "ﺂ": "آ",       // ﺂ → آ
};
function normalizeUrdu(text) {
  let t = text;
  for (const [bad, good] of Object.entries(URDU_NORMALIZE)) t = t.split(bad).join(good);
  // Arabic heh ه (U+0647) → Urdu heh ہ (U+06C1) ONLY for the standalone pronoun
  // "وه" (→ "وہ"), which the voice mis-reads as "ve". Whole-token only (lookaround
  // on Arabic-letter ranges) so within-word heh is left for a later ear-check.
  t = t.replace(/(?<![؀-ۿ])وه(?![؀-ۿ])/g, "وہ");
  return t;
}

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

// Word-level pronunciation fixes for SHORT Urdu words the voice gets wrong by
// vowel: it reads the bare (harakat-less) spelling with the wrong vowels. Keyed
// on the exact word with a harakat-disambiguated spoken alias. CRITICAL: unlike
// URDU_LEX above these MUST match WHOLE TOKENS — a naive substring replace would
// corrupt unrelated words (امی hits امید "hope" / امین; سوا hits سوال "question" /
// سوار "rider"). The lookarounds bound the match to non-Arabic-letter edges.
// NEEDS an ear-check on the regenerated audio. Synthesis-only (hash-stable).
const URDU_LEX_WORD = {
  "لوٹ": "لَوٹ",      // laut (return) — not "loot"
  "امی": "اَمّی",     // ammi (mother) — not "ummi"
  "سوا": "سِوا",      // siwa (except) — not "saraa"/"sawaa"
  "سوائے": "سِوائے",  // siwaaye (except)
};
const URDU_WORD_RE = Object.entries(URDU_LEX_WORD).map(([w, alias]) => [
  new RegExp("(?<![؀-ۿ])" + w + "(?![؀-ۿ])", "g"),
  `<sub alias="${alias}">${w}</sub>`,
]);
function applyUrduLexWord(text) {
  let t = text;
  for (const [re, repl] of URDU_WORD_RE) t = t.replace(re, repl);
  return t;
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = (() => { const i = args.indexOf("--limit"); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity; })();
const ONLY_LANG = (() => { const i = args.indexOf("--lang"); return i >= 0 ? args[i + 1] : null; })();
// On some Node/OS combos the Azure SDK writes the mp3 but its completion
// callback never fires, stalling the run. We race synthesis against a timeout
// and, on stall, resolve from the finished file (see synthesize). --sdk-timeout
// overrides the wait (ms); otherwise it adapts: generous until a stall is seen,
// then short so the rest of the batch flies through.
const SDK_TIMEOUT = (() => { const i = args.indexOf("--sdk-timeout"); return i >= 0 ? parseInt(args[i + 1], 10) : null; })();

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

// Add gentle pauses at punctuation so the narration breathes. The em-dash "—"
// gets its own, clearly audible pause (the storyteller should settle before
// proceeding), distinct from the shorter clause/comma pauses.
function withBreaks(text) {
  // Handles Latin (.!?,—:;) and Urdu (۔ ؟ ؛ ،) punctuation alike.
  return xmlEscape(text)
    .replace(/([.!?۔؟])(\s+)/g, '$1<break time="450ms"/>$2')   // sentence end
    .replace(/(—)(\s*)/g, '$1<break time="380ms"/>$2')          // em-dash: clear pause before proceeding
    .replace(/([:;؛])(\s+)/g, '$1<break time="260ms"/>$2')      // clause break
    .replace(/([,،])(\s+)/g, '$1<break time="160ms"/>$2');      // comma
}

function buildSsml(spoken, lang, voiceName) {
  // Urdu matches the approved samples: escape only (no injected <break> tags) so
  // the voice paces itself at punctuation, then apply the pronunciation lexicon.
  // English/Arabic keep the gentle injected pauses.
  let content = lang === "ur" ? applyUrduLexWord(applyUrduLex(xmlEscape(normalizeUrdu(spoken)))) : withBreaks(spoken);
  const inner = `<prosody rate="${RATE[lang]}" pitch="${PITCH[lang]}">${content}</prosody>`;
  const body = STYLE[lang]
    ? `<mstts:express-as style="${STYLE[lang]}">${inner}</mstts:express-as>`
    : inner;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${LOCALE[lang]}"><voice name="${voiceName || VOICE[lang]}">${body}</voice></speak>`;
}


const MIN_MP3_BYTES = 800; // anything smaller isn't real audio
const TTS_ENDPOINT = `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

// Even-spread word timings, used when we have no prior boundaries (the REST
// endpoint doesn't return them): distribute display tokens across the duration.
function evenTimings(realMap, durMs) {
  const n = realMap.length || 1;
  return realMap.map((m, i) => [m.di, Math.round((i / n) * durMs)]);
}

// Synthesize one clip via the Azure Speech REST endpoint (plain HTTPS). We use
// REST instead of the SDK on purpose: the SDK streams over a WebSocket, which is
// blocked on some networks and there silently produces 0-byte files. REST returns
// the COMPLETE mp3 in the response body, so we only ever write a fully-formed clip
// — a failure throws and never touches the existing file.
//
// REST gives no word-boundary timings. For the normalization / lexicon / pause
// passes the clip hash is unchanged, so the PREVIOUS manifest timings remain
// valid and are reused; brand-new clips fall back to an even-spread estimate.
async function synthesize(spoken, lang, map, outPath, voiceName, { prevMeta = null, timeoutMs = 20000 } = {}) {
  const isWord = (t) => /[\p{L}\p{N}]/u.test(t);
  const realMap = map.filter((m) => isWord(spoken.slice(m.s, m.e))).map((m) => ({ di: m.di }));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let buf;
  try {
    const res = await fetch(TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml; charset=utf-8",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "prophets-journey",
      },
      body: Buffer.from(buildSsml(spoken, lang, voiceName), "utf8"),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`REST TTS HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 140)}`);
    buf = Buffer.from(await res.arrayBuffer());
  } finally { clearTimeout(timer); }
  if (!buf || buf.length < MIN_MP3_BYTES) throw new Error(`empty output (${buf ? buf.length : 0}B) — existing clip kept`);

  // Reuse prior timings if present (hash-stable passes); else estimate duration
  // from a 48 kbit/s mono mp3 (bits / 48 kbit = ms) and spread words evenly.
  const durMs = (prevMeta && prevMeta.d) || Math.max(400, Math.round((buf.length * 8) / 48));
  const w = (prevMeta && Array.isArray(prevMeta.w) && prevMeta.w.length) ? prevMeta.w : evenTimings(realMap, durMs);

  // Atomic write: temp file -> rename, so outPath is only ever a complete clip.
  const tmpPath = outPath + ".part";
  fs.writeFileSync(tmpPath, buf);
  fs.renameSync(tmpPath, outPath);
  return { d: durMs, w, mismatch: false, estimated: !(prevMeta && prevMeta.w && prevMeta.w.length) };
}

// --- enumerate every clip --------------------------------------------------
// Voice variants per language. Urdu renders twice (male=Asad, female=Uzma) into
// separate key namespaces; English/Arabic render once.
function voiceVariants(lang) {
  if (lang === "ur") return [["male", VOICE.ur], ["female", VOICE.ur_f]];
  return [["male", VOICE[lang]]];
}

function allClips() {
  const clips = new Map(); // key -> { spoken, lang, map, voiceName }
  for (const d of PROPHET_DATA) {
    const u = PROPHET_UR[d.id] || null;
    const us = PROPHET_UR_SCRIPT[d.id] || null;
    for (const lang of ["en", "ur"]) {
      if (ONLY_LANG && lang !== ONLY_LANG) continue;
      for (const [voice, voiceName] of voiceVariants(lang)) {
        for (const gender of GENDERS) {
          for (const beat of enumerateBeats(d, lang === "ur" ? (us || u) : null)) {
            const r = narrationForBeat({ d, u, us, lang, gender, sub: beat.sub, panel: beat.panel || 0, picked: beat.picked || null, voice });
            if (!r.spoken) continue;
            if (!clips.has(r.key)) clips.set(r.key, { spoken: r.spoken, lang, map: r.map, voiceName });
          }
        }
      }
    }
  }
  // Ayah audio: spoken Arabic (ar) + EN meaning + UR meaning, per verse.
  for (const id of Object.keys(PROPHET_AYAH)) {
    for (const a of PROPHET_AYAH[id]) {
      for (const [lang, text] of [["en", a.en], ["ur", a.ur]]) {
        if (ONLY_LANG && lang !== ONLY_LANG) continue;
        for (const [voice, voiceName] of voiceVariants(lang)) {
          const r = lineNarration({ lang, text, voice });
          if (r.spoken && !clips.has(r.key)) clips.set(r.key, { spoken: r.spoken, lang, map: r.map, voiceName });
        }
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
      for (const [voice] of voiceVariants(lang)) {
        for (const gender of GENDERS) {
          for (const beat of enumerateBeats(d, lang === "ur" ? (us || u) : null)) {
            const r = narrationForBeat({ d, u, us, lang, gender, sub: beat.sub, panel: beat.panel || 0, picked: beat.picked || null, voice });
            if (r.spoken) keys.add(r.key);
          }
        }
      }
    }
  }
  for (const id of Object.keys(PROPHET_AYAH)) {
    for (const a of PROPHET_AYAH[id]) {
      for (const [lang, text] of [["en", a.en], ["ur", a.ur]]) {
        for (const [voice] of voiceVariants(lang)) {
          const r = lineNarration({ lang, text, voice });
          if (r.spoken) keys.add(r.key);
        }
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
  console.log(`Voices: en=${VOICE.en}, ur(m)=${VOICE.ur}, ur(f)=${VOICE.ur_f} | ${entries.length} unique clips total.`);

  let done = 0, made = 0, skipped = 0, estimated = 0, failed = 0;
  const timeoutMs = SDK_TIMEOUT != null ? SDK_TIMEOUT : 20000;
  for (const [key, clip] of entries) {
    const mp3 = path.join(OUT_DIR, key + ".mp3");
    if (!FORCE && fs.existsSync(mp3) && manifest[key]) { skipped++; continue; }
    if (made >= LIMIT) break;
    try {
      const meta = await synthesize(clip.spoken, clip.lang, clip.map, mp3, clip.voiceName, { prevMeta: manifest[key] || null, timeoutMs });
      manifest[key] = { d: meta.d, w: meta.w, l: clip.lang };
      if (meta.estimated) estimated++;
      made++;
      process.stdout.write(`  ✓ ${made}/${entries.length - skipped} ${key} (${clip.lang}, ${meta.d}ms, ${meta.w.length}w)${meta.estimated ? " ~est-timing" : ""}\n`);
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
  console.log(`Done. made=${made} skipped=${skipped} failed=${failed} estTimings=${estimated}`);
  if (failed) console.log(`Note: ${failed} clip(s) failed — their existing audio was left untouched.`);
  if (estimated) console.log(`Note: ${estimated} new clip(s) used estimated word timings (REST gives none); highlighting is approximate on those.`);
  console.log(`Manifest: ${manifestPath} (${Object.keys(manifest).length} clips)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
