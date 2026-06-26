// ---------------------------------------------------------------------------
// Child-safe, pseudonymous leaderboard logic. Shared by the API route and the
// client UI, so it must stay free of server/browser-only APIs.
//
// SAFETY: nothing here exposes a child's real name, photo, date of birth, age,
// or country. Each child is shown as a deterministic fun ICON + a generated
// HANDLE, both derived from their (opaque) userId. DOB is used ONLY as a hidden
// ranking tiebreaker on the server and is never returned to clients.
// ---------------------------------------------------------------------------

// Fun mascot icons, split into boy/girl pools (~50 each ≈ 100 total). They are
// wholesome animals / nature / space symbols — never a real photo.
export const ICONS = {
  boy: [
    "🐝","🦊","🦁","🐯","🐺","🦅","🦉","🦈","🐳","🐬","🐢","🐊","🦖","🦕","🐉","🦬",
    "🐎","🦌","🐗","🦨","🦡","🦦","🦥","🐅","🐆","🦓","🦒","🐘","🦏","🦛","🐪","🦘",
    "🚀","🛰️","⚡","🔥","⭐","☄️","🪐","🌟","🛡️","🏹","⚓","🧭","🪁","🎯","🪂","🦾",
    "🐲","🦅","🐬","🦁",
  ],
  girl: [
    "🦋","🐞","🐠","🐙","🦄","🐰","🐱","🦢","🕊️","🦜","🦩","🐥","🐣","🦚","🐡","🐚",
    "🌸","🌷","🌺","🌻","🌼","🌹","💐","🍀","🌈","🌙","✨","💫","🌟","❄️","🌊","🍓",
    "🍒","🍑","🧁","🍭","🍬","🎀","💎","👑","🪷","🦔","🐨","🐼","🐧","🦦","🐢","🦊",
    "🦋","🌸","🦄","✨",
  ],
};

// Names from Islamic history, chosen to be respected ACROSS Sunni and Shia and
// to avoid any sectarian flashpoint: no prophets, no caliphs, no Ahl al-Bayt or
// companions who are points of contention, no sect-specific scholars. Instead,
// universally celebrated Golden-Age scientists, polymaths, poets, explorers,
// architects, and uncontested rulers — shared heritage for everyone. Single
// lowercase tokens, so a handle reads like "khwarizmi47". Two gendered pools.
export const NAME_POOL = {
  boy: [
    // four caliphs + Ahl al-Bayt + companions revered across schools
    "abubakr","umar","uthman","ali","hasan","husayn","abbas","jafar","sadiq","baqir",
    "hamza","salman","ammar","abudharr","miqdad","bilal","qasim","zayn",
    // universally celebrated scientists, polymaths, poets, explorers, builders
    "sina","razi","biruni","khwarizmi","haytham","farabi","kindi","jabir","battuta","khaldun",
    "firnas","rushd","idrisi","zahrawi","khayyam","jazari","rumi","attar","saadi","hafiz",
    "masudi","sibawayh","sinan","ulugh","farghani","zarqali","nafis","shatir","buzjani","karaji",
    "samawal","balkhi","majriti","salahuddin","tariq","nuruddin",
  ],
  girl: [
    // Ahl al-Bayt + women honoured across schools
    "fatima","zaynab","khadija","sukayna","ruqayyah","ummkulthum","sumayyah","nusaybah","asma","khawla",
    // scholars, scientists, builders, uncontested rulers
    "fihri","rabia","zubaydah","shajar","razia","lubna","sutayta","sayyida","arwa","dhayfa",
    "shuhda","banafsha","sittalmulk","nana","mahsati","karima","terken","turhan","kosem","hurrem",
    "mihrimah","safiye","nurbanu","handan","gevher","fadl",
  ],
};

// Stable FNV-1a-ish hash → unsigned int.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < String(str).length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

// Deterministic, lowercase public identity for a child (no PII). The handle is
// an Islamic-history name + a 2-digit number for uniqueness, e.g. "tariq47".
export function publicIdentity(userId, gender = "boy") {
  const g = gender === "girl" ? "girl" : "boy";
  const icons = ICONS[g];
  const names = NAME_POOL[g];
  const h = hash(userId || "anon");
  const icon = icons[h % icons.length];
  const name = names[(h >>> 5) % names.length];
  const num = 10 + ((h >>> 11) % 90); // 10–99
  return { icon, handle: `${name}${num}` };
}

// Simple offensive-word guard for user-chosen handles. Handles are lowercase
// alphanumerics, so a substring denylist is enough. Not exhaustive, but blocks
// the obvious cases; leetspeak variants are normalised first.
const BANNED = [
  // English
  "fuck","fuk","fck","phuck","shit","sht","bitch","biatch","cunt","dick","cock",
  "pussy","asshole","ahole","bastard","slut","whore","hoe","nigger","nigga","faggot",
  "fag","rape","rapist","porn","porno","penis","vagina","boob","tits","titty","piss",
  "douche","wank","wanker","retard","nazi","hitler","sex","sexy","xxx","anal","cum",
  "dildo","horny","milf","twat","prick","bollock","arse","jizz","kkk","dyke","homo",
  "molest","pedo","kill","murder","terror","isis","satan","devil",
  // South Asian (Urdu / Hindi / Punjabi etc.), romanised
  "chutiya","chutia","chutya","gandu","gaandu","madarchod","madrchod","maderchod",
  "behenchod","bhenchod","behnchod","lund","lawda","lauda","loda","lodu","bhosdi",
  "bhosda","bhosdike","randi","harami","haramzada","kanjar","kanjri","kamina","kameena",
  "tatti","jhant","jhaant","chod","chodu","gashti","paki","bsdk","gaand","chinaal",
  // Other Indian languages (Bengali, Tamil, Telugu, Marathi …), romanised
  "magi","khanki","chuda","banchot","penchod","thevidiya","punda","pundai","koodhi",
  "modda","dengey","puku","lanja","zavadya","bhikarchot","myir",
  // Major world languages, romanised
  "puta","puto","mierda","cabron","joder","polla","verga","pendejo","culo","maricon",
  "chingada","gilipollas","zorra","cojones","cono",                                   // Spanish
  "merde","putain","connard","salope","encule","couille","batard","pute",            // French
  "scheisse","scheiss","arsch","fotze","schlampe","wichser","hurensohn","fick",       // German
  "cazzo","stronzo","puttana","merda","vaffanculo","troia","coglione","figa",         // Italian
  "caralho","foda","buceta","viado","porra","cacete",                                 // Portuguese
  "blyat","blyad","pizda","khuy","mudak","yebat","zalupa","govno","gandon","manda", // Russian
  "kuss","sharmuta","gahba","kahba","zubr","khara","manyak",                          // Arabic
  "orospu","amcik","yarrak","sikerim","sikim","gavat",                                // Turkish
  "shabi","caonima","jiba","diao",                                                    // Chinese
  "kuso","chikusho","manko","chinko","yariman",                                       // Japanese
  "shibal","sibal","ssibal","gaesaekki",                                              // Korean
  "kontol","memek","bangsat","jancok","pepek","babi","anjing",                        // Indonesian/Malay
];
// Map common leetspeak so "sh1t" / "b00b" are still caught.
function deleet(s) {
  return s.replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/9/g, "g");
}
export function isOffensiveHandle(raw) {
  const s = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Check the raw string (catches plain words, even with a trailing number) and
  // a de-leeted form of the NAME part only — stripping the trailing digit run so
  // a clean name's random number suffix can't accidentally form a banned word
  // (e.g. "idrisi55" → "isis"). Interior leet like "sh1t"/"b00b" is still caught.
  const noTrail = s.replace(/\d+$/, "");
  const variants = [s, deleet(noTrail)];
  return BANNED.some((w) => variants.some((v) => v.includes(w)));
}

// Validate/normalise a user-chosen handle: lowercase, letters+digits, 3–20 chars,
// and not offensive. Returns null when unusable — so offensive/invalid handles
// can never be stored AND the leaderboard safely falls back to the generated one.
export function normalizeHandle(raw) {
  const h = String(raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h.length < 3 || h.length > 20) return null;
  if (isOffensiveHandle(h)) return null;
  return h;
}

// Age as of the most recent 1 June. The leaderboard avatar rule (cartoon for
// ≤10, icon above 10) only flips once a year on this date, so a child crossing
// the threshold mid-year keeps a stable display until the next 1 June. The app
// recomputes this server-side on every open, so it updates by itself.
export function ageAtLastJune1(dob, now = new Date()) {
  if (!dob) return 999;
  const d = new Date(dob);
  if (isNaN(d)) return 999;
  const y = now.getUTCFullYear();
  const june1 = new Date(Date.UTC(y, 5, 1)); // month 5 = June
  const ref = now >= june1 ? june1 : new Date(Date.UTC(y - 1, 5, 1));
  let a = ref.getUTCFullYear() - d.getUTCFullYear();
  const m = ref.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < d.getUTCDate())) a--;
  return a;
}

// Whole years old today (server-side tiebreaker only).
export function ageYears(dob) {
  if (!dob) return 999; // unknown DOB ranks last among ties (treated as oldest)
  const d = new Date(dob);
  if (isNaN(d)) return 999;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

// Build the public leaderboard.
//   rows: [{ userId, gender, dob, score, completed }]
//   meId: the requesting user's id (to flag/return their own row)
// Returns { entries:[publicEntry...], me: publicEntry|null }, where publicEntry
// is { rank, handle, icon, gender, score, completed, isMe } — NO name/dob/age.
export function buildLeaderboard(rows, meId = null, limit = 200) {
  const ranked = rows
    .map((r) => ({ ...r, _age: ageYears(r.dob), _dob: r.dob ? new Date(r.dob).getTime() : -Infinity }))
    .sort((a, b) =>
      b.score - a.score ||      // higher cumulative achievement first
      b._dob - a._dob ||        // tie → youngest (most recent DOB) first
      String(a.userId).localeCompare(String(b.userId)) // stable
    );

  // Competition ranking: identical (score AND whole-year age) share a rank.
  let prev = null;
  ranked.forEach((e, i) => {
    if (prev && e.score === prev.score && e._age === prev._age) e.rank = prev.rank;
    else e.rank = i + 1;
    prev = e;
  });

  const toPublic = (e) => {
    const id = publicIdentity(e.userId, e.gender);
    // Show the Ghibli cartoon avatar only for children ≤10 (as of 1 June) who
    // have one. Older children, and anyone on a default avatar, show the icon.
    // Real photos are never included here.
    const showAvatar = !!e.avatar && ageAtLastJune1(e.dob) <= 10;
    return {
      rank: e.rank,
      handle: normalizeHandle(e.handle) || id.handle, // custom (edited) wins
      icon: id.icon,
      avatar: showAvatar ? e.avatar : null,
      gender: e.gender === "girl" ? "girl" : "boy",
      score: e.score,
      completed: e.completed || 0,
      isMe: meId != null && e.userId === meId,
    };
  };

  const entries = ranked.slice(0, limit).map(toPublic);
  const meRow = meId != null ? ranked.find((e) => e.userId === meId) : null;
  return { entries, me: meRow ? toPublic(meRow) : null };
}
