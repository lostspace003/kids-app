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

// The storyteller's warm, name-personalised wrapper around each beat.
// Mirrors the on-screen experience exactly (kept here so audio matches).
export function storytellerWrap({ sub, name, lang, panelsLen, panel, decGood, modGood }) {
  const L = lang === "ur";
  let prefix = "", suffix = "";
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = L ? `Paas aao, ${name} beta, aur dhyan se suno. ` : `Come closer, ${name}, and listen with your heart. `;
    else if (p === Math.floor(N / 2)) prefix = L ? `Ab ${name}, zara aankhein band karke ye manzar socho. ` : `Now ${name}, close your eyes for a moment and picture this. `;
    else if (p === N - 1) suffix = L ? ` Ise apne dil mein basa lena, ${name}.` : ` Hold that in your heart, ${name}.`;
  } else if (sub === "decision") {
    prefix = L ? `Ab ${name}, kahani aap ki taraf mudti hai. ` : `Now, ${name}, the story turns to you. `;
  } else if (sub === "dres") {
    prefix = decGood ? (L ? `Wah, MashaAllah, ${name}! ` : `Oh, MashaAllah, ${name}! `) : (L ? `Hmm, aao mil kar sochte hain, ${name}. ` : `Mmm, let us think about this together, ${name}. `);
  } else if (sub === "modern") {
    prefix = L ? `Aur ${name}, yehi sabaq aaj aap ki duniya mein. ` : `And here, ${name}, is that same lesson, alive in your world today. `;
  } else if (sub === "mres") {
    prefix = modGood ? (L ? `Bohat khoob, ${name}, shabash! ` : `Beautiful, ${name}, beautiful! `) : (L ? `Aao zara ghaur karein, ${name}. ` : `Let us gently reflect, ${name}. `);
  }
  return { prefix, suffix };
}

export function arriveText({ name, lang, prophetName, honor, arrive }) {
  return lang === "ur"
    ? `Bismillah, ${name} beta. Apni lantern thaam lo — aaj hum dono mil kar ${prophetName} ${honor} ke zamane ka safar karte hain. ${arrive}`
    : `Bismillah, ${name}. Take your lantern in hand — tonight, you and I travel together to the time of ${prophetName} ${honor}. ${arrive}`;
}

export function rewardText({ name, lang, prophetName, honor, lesson }) {
  return lang === "ur"
    ? `MashaAllah! Aap ne ${prophetName} ${honor} ke saath safar kiya aur ${lesson} seekha. Agli manzil ab khul gayi hai.`
    : `MashaAllah! You journeyed with ${prophetName} ${honor} and learned about ${lesson}. The next land is now open.`;
}

// ---------------------------------------------------------------------------
// Urdu-script narration. The Urdu voice (ur-PK) only sounds right when given
// proper Urdu (Nastaʿlīq) script, so for Urdu audio we synthesise from the
// Urdu-script content (PROPHET_UR_SCRIPT) while the screen keeps Roman text.
// ---------------------------------------------------------------------------
export const NAME_UR = { Hamza: "حمزہ", Huzaifa: "حذیفہ" };
export const HONOR_UR = { "(AS)": "علیہ السلام", "ﷺ": "صلی اللہ علیہ وسلم" };

export function storytellerWrapScript({ sub, nameUr, panelsLen, panel, decGood, modGood }) {
  let prefix = "", suffix = "";
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = `پاس آؤ، ${nameUr} بیٹا، اور دھیان سے سنو۔ `;
    else if (p === Math.floor(N / 2)) prefix = `اب ${nameUr}، ذرا آنکھیں بند کر کے یہ منظر سوچو۔ `;
    else if (p === N - 1) suffix = ` اِسے اپنے دل میں بسا لینا، ${nameUr}۔`;
  } else if (sub === "decision") {
    prefix = `اب ${nameUr}، کہانی آپ کی طرف مڑتی ہے۔ `;
  } else if (sub === "dres") {
    prefix = decGood ? `واہ، ماشاءاللہ، ${nameUr}! ` : `ہمم، آؤ مل کر سوچتے ہیں، ${nameUr}۔ `;
  } else if (sub === "modern") {
    prefix = `اور ${nameUr}، یہی سبق آج آپ کی دنیا میں۔ `;
  } else if (sub === "mres") {
    prefix = modGood ? `بہت خوب، ${nameUr}، شاباش! ` : `آؤ ذرا غور کریں، ${nameUr}۔ `;
  }
  return { prefix, suffix };
}

export function arriveTextScript({ nameUr, prophetNameUr, honorUr, arrive }) {
  return `بسم اللہ، ${nameUr} بیٹا۔ اپنی لالٹین تھام لو۔ آج ہم دونوں مل کر ${prophetNameUr} ${honorUr} کے زمانے کا سفر کرتے ہیں۔ ${arrive}`;
}
export function rewardTextScript({ nameUr, prophetNameUr, honorUr, lesson }) {
  return `ماشاءاللہ! آپ نے ${prophetNameUr} ${honorUr} کے ساتھ سفر کیا اور ${lesson} سیکھا۔ اگلی منزل اب کھل گئی ہے۔`;
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
export function narrationForBeat({ d, u, us, lang, name, sub, panel = 0, picked = null }) {
  if (lang === "ur") {
    // Spoken text comes from the Urdu-script content; the screen still shows Roman.
    const C = us || u || d;
    const dec = (us && us.decision) || (u && u.decision) || d.decision;
    const mod = (us && us.modern) || (u && u.modern) || d.modern;
    const nameUr = NAME_UR[name] || name;
    const honorUr = HONOR_UR[d.honor] || "";
    const prophetNameUr = d.ar || d.name;
    let body = "";
    if (sub === "arrive") body = arriveTextScript({ nameUr, prophetNameUr, honorUr, arrive: C.arrive });
    else if (sub === "story") body = C.panels[panel];
    else if (sub === "decision") body = dec.q;
    else if (sub === "dres") body = dec[picked].r;
    else if (sub === "modern") body = mod.q;
    else if (sub === "mres") body = mod[picked].r;
    else if (sub === "reward") body = rewardTextScript({ nameUr, prophetNameUr, honorUr, lesson: (C.lesson || d.lesson) });
    const { prefix, suffix } = storytellerWrapScript({
      sub, nameUr, panelsLen: (C.panels || d.panels).length, panel,
      decGood: picked === d.decision.good, modGood: picked === d.modern.good,
    });
    const { spoken, map } = assembleSpoken({ prefix, body, suffix });
    return { display: body, spoken, map, key: hashKey("ur|" + spoken) };
  }

  // English.
  const C = d;
  const dec = d.decision, mod = d.modern;
  let body = "";
  if (sub === "arrive") body = arriveText({ name, lang, prophetName: d.name, honor: d.honor, arrive: C.arrive });
  else if (sub === "story") body = C.panels[panel];
  else if (sub === "decision") body = dec.q;
  else if (sub === "dres") body = dec[picked].r;
  else if (sub === "modern") body = mod.q;
  else if (sub === "mres") body = mod[picked].r;
  else if (sub === "reward") body = rewardText({ name, lang, prophetName: d.name, honor: d.honor, lesson: (C.lesson || d.lesson) });

  const { prefix, suffix } = storytellerWrap({
    sub, name, lang,
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

// Traveller display names, shared so the generator personalises identically.
export const TRAVELLER_NAMES = ["Hamza", "Huzaifa"];
