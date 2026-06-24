// ---------------------------------------------------------------------------
// Shared narration logic for The Prophets' Journey.
//
// IMPORTANT: this module is imported by BOTH the React component (browser) and
// the audio-generation script (Node). It must stay free of browser/Node-only
// APIs so the two sides produce *byte-identical* spoken strings. That identity
// is what lets the pre-generated Azure audio line up with the on-screen
// word-by-word highlighting via a stable content hash.
// ---------------------------------------------------------------------------

// Phonetic spellings so a TTS engine pronounces Islamic terms and names well.
export const PRON = {
  "allah": "Al-laah", "bismillah": "Bis-mil-laah", "alhamdulillah": "Al-ham-doo-lil-laah",
  "mashaallah": "Maa-shaa Al-laah", "subhanallah": "Sub-haan Al-laah", "inshaallah": "In-shaa Al-laah",
  "du'a": "doo-aah", "dua": "doo-aah", "akhlaq": "akh-laaq", "kaaba": "Kaa-bah",
  "barakah": "ba-ra-kah", "quran": "Qur-aan", "qur'an": "Qur-aan", "noor": "noor",
  "jameel": "ja-meel", "sabr": "saber", "tawheed": "taw-heed", "huzaifa": "Hu-zay-fah",
  "ismail": "Is-maa-eel", "ishaq": "Is-haaq", "yaqub": "Ya-qoob", "ayyub": "Ay-yoob",
  "yusuf": "Yoo-suf", "musa": "Moo-saa", "nuh": "Nooh", "yunus": "Yoo-nus", "zakariya": "Za-ka-ree-yah",
  "sulayman": "Su-lay-maan", "dawud": "Daa-wood", "harun": "Haa-roon", "yahya": "Yah-yaa", "isa": "Ee-saa",
};

export function tokenize(t) {
  return (t || "").split(/\s+/).filter(Boolean);
}

// Map a single display token to the form a voice should pronounce. Honorific
// glyphs ((AS) / ﷺ) are silent (kept on screen, dropped from speech).
export function speakForm(tok) {
  const m = tok.match(/^(\(AS\)|ﷺ)([.,;:!?'")]*)$/u);
  if (m) return m[2] || "";
  const lead = (tok.match(/^[^A-Za-z]*/) || [""])[0];
  const trail = (tok.match(/[^A-Za-z]*$/) || [""])[0];
  let core = tok.slice(lead.length, tok.length - trail.length);
  let poss = "";
  if (/['’]s$/i.test(core)) { poss = "'s"; core = core.replace(/['’]s$/i, ""); }
  const key = core.toLowerCase().replace(/[’']/g, "'");
  if (PRON[key] !== undefined) return lead + PRON[key] + poss + trail;
  return tok;
}

// Stable FNV-1a hash (hex). Identical output in Node and the browser, so the
// generator and the runtime agree on each clip's filename.
export function hashKey(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ("0000000" + h.toString(16)).slice(-8);
}

// Affectionate, gender-based term of endearment used INSTEAD of a personal
// name — so narration is fully static (only two variants, boy/girl) and never
// needs per-user audio. Warm "beta/beti" works in both English and Roman Urdu.
export function termFor(gender, script = false) {
  if (script) return gender === "girl" ? "بیٹی" : "بیٹا";
  return gender === "girl" ? "beti" : "beta";
}

// The storyteller's warm wrapper around each beat. Mirrors the on-screen
// experience exactly (kept here so the pre-generated audio matches). Kept
// kid-friendly with words like suno / accha / shabash rather than formal tone.
export function storytellerWrap({ sub, gender, lang, panelsLen, panel, decGood, modGood }) {
  const L = lang === "ur";
  const t = termFor(gender);
  let prefix = "", suffix = "";
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = L ? `Paas aao, ${t}, aur dhyan se suno. ` : `Come closer, ${t}, and listen with your heart. `;
    else if (p === Math.floor(N / 2)) prefix = L ? `Ab suno ${t}, zara aankhein band karke ye manzar socho. ` : `Now ${t}, close your eyes for a moment and picture this. `;
    else if (p === N - 1) suffix = L ? ` Ise apne dil mein basa lena, ${t}.` : ` Hold that in your heart, ${t}.`;
  } else if (sub === "decision") {
    prefix = L ? `Ab ${t}, kahani aap ki taraf mudti hai. ` : `Now, ${t}, the story turns to you. `;
  } else if (sub === "dres") {
    prefix = decGood ? (L ? `Wah, MashaAllah, ${t}! ` : `Oh, MashaAllah, ${t}! `) : (L ? `Accha ${t}, aao mil kar sochte hain. ` : `Mmm, let us think about this together, ${t}. `);
  } else if (sub === "modern") {
    prefix = L ? `Aur suno ${t}, yehi sabaq aaj aap ki duniya mein. ` : `And here, ${t}, is that same lesson, alive in your world today. `;
  } else if (sub === "mres") {
    prefix = modGood ? (L ? `Bohat khoob, ${t}, shabash! ` : `Beautiful, ${t}, beautiful! `) : (L ? `Accha ${t}, aao zara ghaur karein. ` : `Let us gently reflect, ${t}. `);
  }
  return { prefix, suffix };
}

export function arriveText({ gender, lang, prophetName, honor, arrive }) {
  const t = termFor(gender);
  return lang === "ur"
    ? `Bismillah, ${t}. Apni lantern thaam lo — aaj hum dono mil kar ${prophetName} ${honor} ke zamane ka safar karte hain. ${arrive}`
    : `Bismillah, ${t}. Take your lantern in hand — tonight, you and I travel together to the time of ${prophetName} ${honor}. ${arrive}`;
}

export function rewardText({ gender, lang, prophetName, honor, lesson }) {
  const t = termFor(gender);
  return lang === "ur"
    ? `MashaAllah, ${t}! Aap ne ${prophetName} ${honor} ke saath safar kiya aur ${lesson} seekha. Agli manzil ab khul gayi hai.`
    : `MashaAllah, ${t}! You journeyed with ${prophetName} ${honor} and learned about ${lesson}. The next land is now open.`;
}

// ---------------------------------------------------------------------------
// Urdu-script narration. The Urdu voice (ur-PK) only sounds right when given
// proper Urdu (Nastaʿlīq) script, so for Urdu audio we synthesise from the
// Urdu-script content (PROPHET_UR_SCRIPT) while the screen keeps Roman text.
// ---------------------------------------------------------------------------
export const NAME_UR = { Hamza: "حمزہ", Huzaifa: "حذیفہ" };
export const HONOR_UR = { "(AS)": "علیہ السلام", "ﷺ": "صلی اللہ علیہ وسلم" };

export function storytellerWrapScript({ sub, gender, panelsLen, panel, decGood, modGood }) {
  const t = termFor(gender, true);
  let prefix = "", suffix = "";
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = `پاس آؤ، ${t}، اور دھیان سے سنو۔ `;
    else if (p === Math.floor(N / 2)) prefix = `اب سنو ${t}، ذرا آنکھیں بند کر کے یہ منظر سوچو۔ `;
    else if (p === N - 1) suffix = ` اِسے اپنے دل میں بسا لینا، ${t}۔`;
  } else if (sub === "decision") {
    prefix = `اب ${t}، کہانی آپ کی طرف مڑتی ہے۔ `;
  } else if (sub === "dres") {
    prefix = decGood ? `واہ، ماشاءاللہ، ${t}! ` : `اچھا ${t}، آؤ مل کر سوچتے ہیں۔ `;
  } else if (sub === "modern") {
    prefix = `اور سنو ${t}، یہی سبق آج آپ کی دنیا میں۔ `;
  } else if (sub === "mres") {
    prefix = modGood ? `بہت خوب، ${t}، شاباش! ` : `اچھا ${t}، آؤ ذرا غور کریں۔ `;
  }
  return { prefix, suffix };
}

export function arriveTextScript({ gender, prophetNameUr, honorUr, arrive }) {
  const t = termFor(gender, true);
  return `بسم اللہ، ${t}۔ اپنی لالٹین تھام لو۔ آج ہم دونوں مل کر ${prophetNameUr} ${honorUr} کے زمانے کا سفر کرتے ہیں۔ ${arrive}`;
}
export function rewardTextScript({ gender, prophetNameUr, honorUr, lesson }) {
  const t = termFor(gender, true);
  return `ماشاءاللہ، ${t}! آپ نے ${prophetNameUr} ${honorUr} کے ساتھ سفر کیا اور ${lesson} سیکھا۔ اگلی منزل اب کھل گئی ہے۔`;
}

// Assemble the final spoken string for a beat, plus the char-range -> display
// token map used for word highlighting. `prefix`/`suffix` tokens carry di = -1
// (spoken but not shown), body tokens carry their display index.
export function assembleSpoken({ prefix, body, suffix }) {
  const seq = [];
  tokenize(prefix).forEach((tk) => seq.push({ tok: tk, di: -1 }));
  tokenize(body).forEach((tk, i) => seq.push({ tok: tk, di: i }));
  tokenize(suffix).forEach((tk) => seq.push({ tok: tk, di: -1 }));
  let spoken = "";
  const map = [];
  seq.forEach((seg) => {
    const sp = speakForm(seg.tok);
    if (sp) {
      if (spoken) spoken += " ";
      const start = spoken.length;
      spoken += sp;
      map.push({ di: seg.di, s: start, e: spoken.length });
    }
  });
  return { spoken, map };
}

// Resolve the body text + storyteller wrap for a beat, given the prophet's
// English record `d`, optional Urdu record `u`, language and traveller name.
// Returns { display, spoken, map, key } — `key` is the audio filename stem.
export function narrationForBeat({ d, u, us, lang, gender, sub, panel = 0, picked = null }) {
  if (lang === "ur") {
    // Spoken text comes from the Urdu-script content; the screen still shows Roman.
    const C = us || u || d;
    const dec = (us && us.decision) || (u && u.decision) || d.decision;
    const mod = (us && us.modern) || (u && u.modern) || d.modern;
    const honorUr = HONOR_UR[d.honor] || "";
    const prophetNameUr = d.ar || d.name;
    let body = "";
    if (sub === "arrive") body = arriveTextScript({ gender, prophetNameUr, honorUr, arrive: C.arrive });
    else if (sub === "story") body = C.panels[panel];
    else if (sub === "decision") body = dec.q;
    else if (sub === "dres") body = dec[picked].r;
    else if (sub === "modern") body = mod.q;
    else if (sub === "mres") body = mod[picked].r;
    else if (sub === "reward") body = rewardTextScript({ gender, prophetNameUr, honorUr, lesson: (C.lesson || d.lesson) });
    const { prefix, suffix } = storytellerWrapScript({
      sub, gender, panelsLen: (C.panels || d.panels).length, panel,
      decGood: picked === d.decision.good, modGood: picked === d.modern.good,
    });
    const { spoken, map } = assembleSpoken({ prefix, body, suffix });
    return { display: body, spoken, map, key: hashKey("ur|" + spoken) };
  }

  // English.
  const C = d;
  const dec = d.decision, mod = d.modern;
  let body = "";
  if (sub === "arrive") body = arriveText({ gender, lang, prophetName: d.name, honor: d.honor, arrive: C.arrive });
  else if (sub === "story") body = C.panels[panel];
  else if (sub === "decision") body = dec.q;
  else if (sub === "dres") body = dec[picked].r;
  else if (sub === "modern") body = mod.q;
  else if (sub === "mres") body = mod[picked].r;
  else if (sub === "reward") body = rewardText({ gender, lang, prophetName: d.name, honor: d.honor, lesson: (C.lesson || d.lesson) });

  const { prefix, suffix } = storytellerWrap({
    sub, gender, lang,
    panelsLen: (C.panels || d.panels).length, panel,
    decGood: picked === d.decision.good,
    modGood: picked === d.modern.good,
  });
  const { spoken, map } = assembleSpoken({ prefix, body, suffix });
  const key = hashKey(lang + "|" + spoken);
  return { display: body, spoken, map, key };
}

// A standalone narrated line (no storyteller wrap) — used for ayah recitation
// meanings and the spoken Arabic. `lang` is "ar" | "en" | "ur" and picks both
// the hash namespace and (in the generator) the voice.
export function lineNarration({ lang, text }) {
  const { spoken, map } = assembleSpoken({ prefix: "", body: text, suffix: "" });
  return { spoken, map, key: hashKey(lang + "|" + spoken) };
}

// Enumerate every narratable beat for a prophet (used by the generator and to
// pre-warm audio). Decision/result beats expand both choices.
export function enumerateBeats(d, u) {
  const C = u || d;
  const beats = [{ sub: "arrive" }];
  (C.panels || d.panels).forEach((_, i) => beats.push({ sub: "story", panel: i }));
  beats.push({ sub: "decision" });
  beats.push({ sub: "dres", picked: "a" }, { sub: "dres", picked: "b" });
  beats.push({ sub: "modern" });
  beats.push({ sub: "mres", picked: "a" }, { sub: "mres", picked: "b" });
  beats.push({ sub: "reward" });
  return beats;
}

// Narration is now gendered, not name-personalised: there are exactly two
// audio variants. The generator (Phase 6) renders each beat once per gender.
export const GENDERS = ["boy", "girl"];
