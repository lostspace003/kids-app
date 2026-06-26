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
// Names are spelled the Arabic way (long vowels doubled, stress hyphenated) so
// the English voice says them with proper, respectful pronunciation rather than
// an anglicised reading (e.g. "Aa-dam", not "ADD-uhm").
export const PRON = {
  "allah": "Al-lauh", "bismillah": "Bis-mil-lauh", "alhamdulillah": "Al-ham-doo-lil-lauh",
  "mashaallah": "Maa-shaa Al-lauh", "subhanallah": "Sub-haan Al-lauh", "inshaallah": "In-shaa Al-lauh",
  "du'a": "doo-aah", "dua": "doo-aah", "akhlaq": "akh-laaq", "kaaba": "Kaa-bah",
  "barakah": "ba-ra-kah", "quran": "Qur-aan", "qur'an": "Qur-aan", "noor": "noor",
  "jameel": "ja-meel", "sabr": "saber", "tawheed": "taw-heed", "huzaifa": "Hu-zay-fah",
  // The 25 prophets — every name mapped so none is read flat/anglicised.
  "adam": "Aa-dam", "idris": "Id-rees", "nuh": "Nooh", "hud": "Hood", "salih": "Saa-leh",
  "ibrahim": "Ib-raa-heem", "lut": "Loot", "ismail": "Is-maa-eel", "ishaq": "Is-haaq",
  "yaqub": "Ya-qoob", "yusuf": "Yoo-suf", "ayyub": "Ay-yoob", "shu'ayb": "Shu-ayb",
  "musa": "Moo-saa", "harun": "Haa-roon", "dhul-kifl": "Zul-Kifl", "dawud": "Daa-wood",
  "sulayman": "Su-lay-maan", "ilyas": "Il-yaas", "al-yasa": "Al-Ya-saa", "yunus": "Yoo-nus",
  "zakariya": "Za-ka-ree-yah", "yahya": "Yah-yaa", "isa": "Ee-saa", "muhammad": "Mu-ham-mad",
};

// Spoken form of the honorific glyphs. These stay as glyphs on screen but are
// now voiced with the full, respectful salutation.
export const HONOR_SPOKEN = {
  "(AS)": "alay-his sa-laam",
  "ﷺ": "sal-lal-laahu alay-hi wa sal-lam",
};

export function tokenize(t) {
  return (t || "").split(/\s+/).filter(Boolean);
}

// Map a single display token to the form a voice should pronounce. Honorific
// glyphs ((AS) / ﷺ) stay on screen but are voiced with the full salutation.
export function speakForm(tok) {
  const m = tok.match(/^(\(AS\)|ﷺ)([.,;:!?'")]*)$/u);
  if (m) return (HONOR_SPOKEN[m[1]] || "") + (m[2] || "");
  const lead = (tok.match(/^[^A-Za-z]*/) || [""])[0];
  const trail = (tok.match(/[^A-Za-z]*$/) || [""])[0];
  let core = tok.slice(lead.length, tok.length - trail.length);
  let poss = "";
  if (/['’]s$/i.test(core)) { poss = "'s"; core = core.replace(/['’]s$/i, ""); }
  const key = core.toLowerCase().replace(/[’']/g, "'");
  if (PRON[key] !== undefined) return lead + PRON[key] + poss + trail;
  return tok;
}

// Audio key namespace. Urdu has two voices — male (ur-PK-Asad) and female
// (ur-PK-Uzma) — that speak identical text but need separate clips. Male keeps
// the legacy "ur" namespace so existing audio stays valid; female uses "ur-f".
// English/Arabic are single-voice and ignore `voice`.
export function audioNs(lang, voice = "male") {
  if (lang === "ur") return voice === "female" ? "ur-f" : "ur";
  return lang;
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
  // The term of endearment is used sparingly (only the first story beat and the
  // happy reflection) so it never feels repetitive.
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = L ? `Paas aao, ${t}, aur dil laga kar suno. ` : `Come closer, little one, and listen with your heart. `;
    else if (p === Math.floor(N / 2)) prefix = L ? `Ab zara aankhein band karke ye manzar socho. ` : `Now close your eyes for a moment and picture this. `;
    else if (p === N - 1) suffix = L ? ` Ise apne dil mein narmi se basa lo.` : ` Hold that gently in your heart.`;
  } else if (sub === "decision") {
    prefix = L ? `Ab kahani tumhari taraf mudti hai. ` : `Now the story turns to you. `;
  } else if (sub === "dres") {
    prefix = decGood ? (L ? `MashaAllah, kya khoob! ` : `MashaAllah — beautiful choice! `) : (L ? `Hmm, aao mil kar sochte hain. ` : `Mmm, let us think about this together. `);
  } else if (sub === "modern") {
    prefix = L ? `Aur yehi sabaq aaj tumhari duniya mein. ` : `And here is that same lesson, alive in your world today. `;
  } else if (sub === "mres") {
    prefix = modGood ? (L ? `Bohat khoob, ${t}! ` : `Wonderful, dear! `) : (L ? `Aao zara ghaur karein. ` : `Let us gently reflect. `);
  }
  return { prefix, suffix };
}

export function arriveText({ gender, lang, prophetName, honor, arrive }) {
  const t = termFor(gender);
  return lang === "ur"
    ? `Bismillah, ${t}. Apni lantern thaam lo — aaj hum dono mil kar ${prophetName} ${honor} ke zamane ka safar karte hain. ${arrive}`
    : `Bismillah, dear. Take your lantern in hand — tonight, you and I travel together to the time of ${prophetName} ${honor}. ${arrive}`;
}

export function rewardText({ gender, lang, prophetName, honor, lesson }) {
  const t = termFor(gender);
  return lang === "ur"
    ? `MashaAllah, ${t}! Aap ne ${prophetName} ${honor} ke saath safar kiya aur ${lesson} seekha. Agli manzil ab khul gayi hai.`
    : `MashaAllah, dear! You journeyed with ${prophetName} ${honor} and learned about ${lesson}. The next land is now open.`;
}

// ---------------------------------------------------------------------------
// Urdu-script narration. The Urdu voice (ur-PK) only sounds right when given
// proper Urdu (Nastaʿlīq) script, so for Urdu audio we synthesise from the
// Urdu-script content (PROPHET_UR_SCRIPT) while the screen keeps Roman text.
// ---------------------------------------------------------------------------
export const NAME_UR = { Hamza: "حمزہ", Huzaifa: "حذیفہ" };
export const HONOR_UR = { "(AS)": "علیہ السلام", "ﷺ": "صلی اللہ علیہ وسلم" };

// Prophet names in proper Urdu spelling, keyed by prophet id. Used for the
// spoken Urdu name in arrive/reward so it matches EXACTLY how the name is
// written inside the Urdu story panels (PROPHET_UR_SCRIPT). Previously the
// arrive/reward slot injected the Arabic `d.ar` form (with full harakat, e.g.
// "آدَم" / "مُوسَىٰ"), which the ur-PK voice pronounces differently from the
// plain Urdu form used in the panels ("آدم" / "موسیٰ") — so the same name was
// heard two ways in one journey. These forms keep every mention consistent.
export const NAME_UR_FULL = {
  1: "آدم", 2: "ادریس", 3: "نوح", 4: "ہود", 5: "صالح",
  6: "ابراہیم", 7: "لوط", 8: "اسماعیل", 9: "اسحاق", 10: "یعقوب",
  11: "یوسف", 12: "ایوب", 13: "شعیب", 14: "موسیٰ", 15: "ہارون",
  16: "ذوالکفل", 17: "داؤد", 18: "سلیمان", 19: "الیاس", 20: "الیسع",
  21: "یونس", 22: "زکریا", 23: "یحییٰ", 24: "عیسیٰ", 25: "محمد",
};

// Biblical / English forms of the prophet names, used ONLY in English mode
// (the journey/story, map node, and title). Urdu mode keeps the Arabic names.
// Prophets without a widely-accepted Biblical equivalent (Hud, Salih, Shu'ayb,
// Dhul-Kifl) and those that are the same (Adam, Muhammad) are intentionally
// absent — callers fall back to the prophet's default `name`.
export const EN_NAME = {
  2: "Enoch", 3: "Noah", 6: "Abraham", 7: "Lot", 8: "Ishmael",
  9: "Isaac", 10: "Jacob", 11: "Joseph", 12: "Job", 14: "Moses",
  15: "Aaron", 17: "David", 18: "Solomon", 19: "Elijah", 20: "Elisha",
  21: "Jonah", 22: "Zechariah", 23: "John", 24: "Jesus",
};
// English display/spoken name for a prophet record.
export function enName(d) { return EN_NAME[d.id] || d.name; }

export function storytellerWrapScript({ sub, gender, panelsLen, panel, decGood, modGood }) {
  const t = termFor(gender, true);
  let prefix = "", suffix = "";
  // Term used sparingly (first story beat + happy reflection) so it feels
  // natural, not forced. "suno" only once.
  if (sub === "story") {
    const N = panelsLen, p = panel;
    if (p === 0) prefix = `پاس آؤ، ${t}، اور دل لگا کر سنو۔ `;
    else if (p === Math.floor(N / 2)) prefix = `اب ذرا آنکھیں بند کر کے یہ منظر سوچو۔ `;
    else if (p === N - 1) suffix = ` اِس بات کو اپنے دل میں نرمی سے بسا لو۔`;
  } else if (sub === "decision") {
    prefix = `اب کہانی تمہاری طرف مڑتی ہے۔ `;
  } else if (sub === "dres") {
    prefix = decGood ? `ماشاءاللہ، کیا خوب! ` : `ہمم، آؤ مل کر سوچتے ہیں۔ `;
  } else if (sub === "modern") {
    prefix = `اور یہی سبق آج تمہاری دنیا میں۔ `;
  } else if (sub === "mres") {
    prefix = modGood ? `بہت خوب، ${t}! ` : `آؤ ذرا غور کریں۔ `;
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
export function narrationForBeat({ d, u, us, lang, gender, sub, panel = 0, picked = null, voice = "male" }) {
  if (lang === "ur") {
    // Spoken text comes from the Urdu-script content; the screen still shows Roman.
    const C = us || u || d;
    const dec = (us && us.decision) || (u && u.decision) || d.decision;
    const mod = (us && us.modern) || (u && u.modern) || d.modern;
    const honorUr = HONOR_UR[d.honor] || "";
    const prophetNameUr = NAME_UR_FULL[d.id] || d.ar || d.name;
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
    return { display: body, spoken, map, key: hashKey(audioNs("ur", voice) + "|" + spoken) };
  }

  // English.
  const C = d;
  const dec = d.decision, mod = d.modern;
  let body = "";
  if (sub === "arrive") body = arriveText({ gender, lang, prophetName: enName(d), honor: d.honor, arrive: C.arrive });
  else if (sub === "story") body = C.panels[panel];
  else if (sub === "decision") body = dec.q;
  else if (sub === "dres") body = dec[picked].r;
  else if (sub === "modern") body = mod.q;
  else if (sub === "mres") body = mod[picked].r;
  else if (sub === "reward") body = rewardText({ gender, lang, prophetName: enName(d), honor: d.honor, lesson: (C.lesson || d.lesson) });

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
export function lineNarration({ lang, text, voice = "male" }) {
  const { spoken, map } = assembleSpoken({ prefix: "", body: text, suffix: "" });
  return { spoken, map, key: hashKey(audioNs(lang, voice) + "|" + spoken) };
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
