"use client";

import React from "react";
import { PROPHET_DATA } from "../data/prophets-data";
import { PROPHET_UR } from "../data/prophets-ur";
import { PROPHET_UR_SCRIPT } from "../data/prophets-ur-script";
import { PROPHET_AYAH } from "../data/prophets-ayah";
import {
  tokenize as _tokenize,
  speakForm as _speakForm,
  storytellerWrap as _wrap,
  narrationForBeat,
  lineNarration,
  arriveText,
  rewardText,
} from "../lib/narration";
import { STREAK_WEIGHT } from "../lib/leaderboard";

const E = React.createElement;

// Prefix static asset URLs with the deploy base path (e.g. "/kids-app" on
// GitHub Pages) so audio + photos resolve correctly under a sub-path.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
const asset = (p) => (p && p.charAt(0) === "/" ? BASE + p : p);

// Noor → level ladder. Each level lifts the lantern a little higher.
const LEVELS = [
  { min: 0, name: "New Traveller", nameUr: "Naya Musafir", icon: "🕯️" },
  { min: 40, name: "Star Gazer", nameUr: "Sitara Bereen", icon: "✨" },
  { min: 90, name: "Lantern Bearer", nameUr: "Lantern Bardar", icon: "🏮" },
  { min: 160, name: "Light Keeper", nameUr: "Roshni ka Nigehban", icon: "🌟" },
  { min: 250, name: "Guide of Hearts", nameUr: "Dilon ka Rahbar", icon: "🌙" },
];
function levelFor(noor) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (noor >= LEVELS[i].min) idx = i;
  return { idx, ...LEVELS[idx], next: LEVELS[idx + 1] || null };
}

// ---------------------------------------------------------------------------
// Inline-style helper: parse a CSS declaration string into a React style object.
// Lets us keep the prototype's exact inline `style="..."` strings verbatim.
// ---------------------------------------------------------------------------
function s(str) {
  const o = {};
  if (!str) return o;
  str.split(";").forEach((decl) => {
    const i = decl.indexOf(":");
    if (i < 0) return;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || !val) return;
    const key = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    o[key] = val;
  });
  return o;
}

const PROFILES = {
  hamza:   { name: "Hamza",   sub: "Age 8",  initial: "H", pic: "/hamza.webp",   grad: "linear-gradient(135deg,#ffd56b,#f59442)" },
  huzaifa: { name: "Huzaifa", sub: "Age 6½", initial: "H", pic: "/huzaifa.webp", grad: "linear-gradient(135deg,#7fe0c0,#34a3a3)" },
};
// Where the floating traveller medallion sits on the stage — it hops to a new
// spot (and size) on each beat so the child "travels along" through the scene.
const AVATAR_SPOTS = [
  { t: "13%", l: "7%",  size: 124 }, { t: "17%", l: "70%", size: 110 },
  { t: "29%", l: "9%",  size: 146 }, { t: "13%", l: "66%", size: 132 },
  { t: "26%", l: "73%", size: 104 }, { t: "11%", l: "20%", size: 120 },
];
// The narration card travels too (offset in vw / vh from its bottom-centre
// anchor), so the "content" drifts around the screen beat by beat.
const CARD_OFFSETS = [
  { x: 0, y: 0 }, { x: 0, y: -11 }, { x: -4, y: -5 }, { x: 4, y: -14 }, { x: -3, y: -8 }, { x: 3, y: -3 },
];
const HL = "color:#ffe6a3;text-shadow:0 0 14px rgba(245,196,81,.85);";
const NORMAL = "color:rgba(244,238,222,.96);transition:color .12s,text-shadow .12s;";

export default class ProphetsJourney extends React.Component {
  constructor(props) {
    super(props);
    const rnd = (a, b) => a + Math.random() * (b - a);
    this.stars = Array.from({ length: 52 }, () => ({ x: rnd(0, 100), y: rnd(0, 72), s: rnd(1, 3), d: rnd(2, 5).toFixed(2), delay: rnd(0, 3).toFixed(2) }));
    this.motes = Array.from({ length: 14 }, () => ({ x: rnd(8, 92), y: rnd(45, 92), size: rnd(2, 5), dur: rnd(5, 10).toFixed(2), delay: rnd(0, 6).toFixed(2) }));
    this.rain  = Array.from({ length: 26 }, () => ({ x: rnd(0, 100), len: rnd(10, 22), dur: rnd(0.7, 1.4).toFixed(2), delay: rnd(0, 1.5).toFixed(2) }));
    const cc = ["#ffd56b", "#7fe0c0", "#9ec5ff", "#ffb86b", "#f5c451", "#ff9ec4", "#bff0a0"];
    this.confettiPieces = Array.from({ length: 46 }, () => ({ x: rnd(0, 100), c: cc[Math.floor(Math.random() * cc.length)], w: rnd(6, 11), h: rnd(8, 16), dur: rnd(1.8, 3.2).toFixed(2), delay: rnd(0, 0.8).toFixed(2), rot: rnd(0, 360) }));
    this.synth = (typeof window !== "undefined" && window.speechSynthesis) ? window.speechSynthesis : null;
    this._spkMap = []; this._spokeKey = null;
    this.manifest = null;          // pre-generated Azure audio index (loaded on mount)
    this.audioEl = null; this._raf = 0; this._ac = null;
    let lang0 = "ur"; try { const sv = localStorage.getItem("ipj_lang_v2"); if (sv) lang0 = sv; } catch (e) {}
    // Urdu narration voice: "male" (ur-PK-Asad) or "female" (ur-PK-Uzma).
    let voice0 = "male"; try { const sv = localStorage.getItem("ipj_voice"); if (sv === "female" || sv === "male") voice0 = sv; } catch (e) {}
    // Sound always starts at maximum (2× gain). The slider can still lower it
    // during a session, but every load defaults to full volume.
    const vol0 = 2;

    // When a logged-in child profile is supplied, the traveller IS that child:
    // inject a synthetic "me" profile (their Ghibli avatar as the medallion) and
    // skip the old welcome + traveller picker, going straight to the map.
    const cp = props.childProfile || null;
    if (cp) {
      PROFILES.me = {
        name: cp.childName || "Traveller",
        sub: "",
        initial: (cp.childName || "?").trim().charAt(0).toUpperCase() || "?",
        pic: cp.avatarUrl || cp.photoUrl || "/hamza.webp",
        grad: cp.gender === "girl" ? "linear-gradient(135deg,#ffb3d1,#f56fa1)" : "linear-gradient(135deg,#ffd56b,#f59442)",
        gender: cp.gender === "girl" ? "girl" : "boy",
      };
    }

    this.state = {
      screen: cp ? "map" : "welcome", profile: cp ? "me" : null, sub: "arrive", curId: null, panel: 0,
      pickedDec: null, pickedMod: null, goodCount: 0, earned: 0,
      muted: false, volume: vol0, activeWord: -1, lang: lang0, voice: voice0,
      quiz: null, quizPick: null, quizIdx: 0,   // mini-quiz recap state
      ayahIdx: 0,                                // which Qur'anic verse is showing
      starsEarned: 0, leveledTo: null,   // reward-screen celebration
      celebrate: 0,                       // bump to fire confetti
      langPrompt: null,                   // prophet id awaiting a language choice
      progress: { completed: [], noor: 0, stars: {}, earned: {}, streak: 0, lastDay: null },
      lbOpen: false, lbBusy: false, lbData: null, lbSelected: null, lbInfo: false, // leaderboard
    };
  }

  get isGuest() { return !!this.props.guest; }

  componentDidMount() {
    this._lastScreen = this.state.screen;
    if (this.props.onScreenChange) this.props.onScreenChange(this.state.screen);
    if (this.synth && this.synth.onvoiceschanged !== undefined) { this.synth.onvoiceschanged = () => {}; }
    // Load the pre-generated audio manifest; narration falls back to the
    // browser voice for any clip not present.
    if (typeof fetch !== "undefined") {
      fetch(asset("/audio/manifest.json")).then((r) => (r.ok ? r.json() : null)).then((m) => { this.manifest = m || {}; }).catch(() => { this.manifest = {}; });
    }
    // For a logged-in child, progress lives server-side (per account). Guests
    // get a clean local-only run that is never persisted.
    if (this.props.childProfile && !this.isGuest) this.loadServerProgress();

    // Phones suspend the audio context when a notification plays or the user
    // leaves the browser, which silently stops narration. On returning, resume
    // the context and re-arm the current clip so sound continues without a refresh.
    this._onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try { if (this._ac && this._ac.state === "suspended") this._ac.resume(); } catch (e) {}
      if (this.audioEl && this.audioEl.paused && !this.state.muted && this.state.screen === "stage") {
        this.audioEl.play().catch(() => {});
      }
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", this._onVisible);
    if (typeof window !== "undefined") window.addEventListener("focus", this._onVisible);
  }

  // Pull this account's saved progress from the server, apply the day-streak,
  // and persist it back. Falls back silently to the in-memory default.
  loadServerProgress() {
    fetch("/api/progress").then((r) => (r.ok ? r.json() : null)).then((d) => {
      const base = { completed: [], noor: 0, stars: {}, earned: {}, streak: 0, lastDay: null };
      const prog = this.applyStreak({ ...base, ...((d && d.ok && d.progress) || {}) });
      if (!prog.stars) prog.stars = {};
      if (!prog.earned) prog.earned = {};
      this.setState({ progress: prog }, () => this.saveProgress());
    }).catch(() => {});
  }
  componentWillUnmount() {
    this.stopAudio(); if (this.synth) this.synth.cancel();
    if (typeof document !== "undefined" && this._onVisible) document.removeEventListener("visibilitychange", this._onVisible);
    if (typeof window !== "undefined" && this._onVisible) window.removeEventListener("focus", this._onVisible);
  }
  componentDidUpdate(prevProps) {
    const st = this.state;
    // The host (AuthGate) opens the leaderboard from the hamburger menu by
    // bumping lbOpenSignal — there's no ref into this dynamic-imported class.
    if (prevProps && prevProps.lbOpenSignal !== this.props.lbOpenSignal && this.props.lbOpenSignal) {
      this.openLeaderboard();
    }
    // Tell the host (AuthGate) which screen we're on so it can hide app chrome
    // (e.g. the menu button) during a story to avoid overlapping the card.
    if (st.screen !== this._lastScreen) {
      this._lastScreen = st.screen;
      if (this.props.onScreenChange) this.props.onScreenChange(st.screen);
    }
    const key = st.screen + "|" + st.curId + "|" + st.sub + "|" + st.panel + "|" + st.ayahIdx + "|" + st.quizIdx;
    if (key === this._spokeKey) return;
    this._spokeKey = key;
    if (st.screen !== "stage") { this.stopAudio(); return; }
    if (this.props.narration === false || st.muted) return;
    setTimeout(() => { if (this._spokeKey === key) this.narrateCurrent(); }, 140);
  }

  // ---------- DATA ----------
  data() { return PROPHET_DATA || []; }
  curData() { return this.data().find((d) => d.id === this.state.curId); }
  isUnlocked(i) {
    // Guests may only preview the first story; everything else prompts login.
    if (this.isGuest) return i === 0;
    const DATA = this.data();
    return i === 0 || this.state.progress.completed.includes(DATA[i - 1].id);
  }

  // ---------- PROGRESS ----------
  pkey(p) { return "ipj_" + p; }
  loadProgress(p) {
    let r = { completed: [], noor: 0, stars: {}, earned: {}, streak: 0, lastDay: null };
    try { const raw = localStorage.getItem(this.pkey(p)); if (raw) r = { ...r, ...JSON.parse(raw) }; } catch (e) {}
    if (!r.stars) r.stars = {};
    if (!r.earned) r.earned = {};
    return r;
  }
  saveProgress() {
    if (this.isGuest) return; // guest runs are never persisted
    try { localStorage.setItem(this.pkey(this.state.profile), JSON.stringify(this.state.progress)); } catch (e) {}
    // Mirror to the server for logged-in children so progress follows the account.
    if (this.props.childProfile) {
      try {
        fetch("/api/progress", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress: this.state.progress }) });
      } catch (e) {}
    }
  }
  // Reset everything for the current traveller (re-locks all but the first land).
  resetAll() {
    if (typeof window !== "undefined" && !window.confirm(this.state.lang === "ur" ? "Saara safar reset karein? Tamam manzilein dobara band ho jayengi." : "Reset the whole journey? All lands will lock again.")) return;
    this.sfx("page");
    this.setState((st) => ({ progress: { ...st.progress, completed: [], noor: 0, stars: {}, earned: {} } }), () => this.saveProgress());
  }
  // Reset a single prophet — clears its stars + Noor and re-locks the next land.
  resetProphet(id) {
    if (typeof window !== "undefined" && !window.confirm(this.state.lang === "ur" ? "Is nabi ka safar reset karein?" : "Reset this prophet's progress?")) return;
    this.sfx("page");
    this.setState((st) => {
      const p = { ...st.progress, completed: st.progress.completed.filter((x) => x !== id), stars: { ...st.progress.stars }, earned: { ...(st.progress.earned || {}) } };
      p.noor = Math.max(0, p.noor - (p.earned[id] || 0));
      delete p.stars[id]; delete p.earned[id];
      return { progress: p };
    }, () => this.saveProgress());
  }
  // Day-streak: bump if returning the next day, reset if a day was skipped.
  applyStreak(prog) {
    const today = new Date(); const dayNum = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000) + today.getFullYear() * 366;
    if (prog.lastDay == null) prog.streak = 1;
    else if (prog.lastDay === dayNum) { /* same day, keep */ }
    else if (prog.lastDay === dayNum - 1) prog.streak = (prog.streak || 0) + 1;
    else prog.streak = 1;
    prog.lastDay = dayNum;
    return prog;
  }

  // ---------- NAV ----------
  primeSpeech() { if (this.synth) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; this.synth.speak(u); } catch (e) {} } }
  pickProfile(p) {
    this.primeSpeech();
    const prog = this.applyStreak(this.loadProgress(p));
    this.setState({ profile: p, progress: prog, screen: "map" }, () => this.saveProgress());
  }
  goProfile() {
    // Logged-in children are bound to their account — never show the old
    // built-in traveller picker. (Account actions live in the hamburger menu.)
    if (this.props.childProfile) return;
    if (this.synth) this.synth.cancel();
    this.setState({ screen: "profile", profile: null });
  }
  startApp() { this.primeSpeech(); this.sfx("open"); this.setState({ screen: "profile" }); }
  // Tapping a prophet first asks which language to travel in; the choice then
  // opens the stage in that language.
  promptLang(id) {
    const i = this.data().findIndex((d) => d.id === id);
    if (!this.isUnlocked(i)) { if (this.isGuest) this.requestLogin(); return; }
    this.sfx("open"); this.setState({ langPrompt: id });
  }
  requestLogin() { if (this.props.onRequestLogin) this.props.onRequestLogin(); }

  // ---------- LEADERBOARD ----------
  openLeaderboard() {
    this.sfx("open");
    this.setState({ lbOpen: true, lbBusy: true, lbData: null, lbSelected: null });
    fetch(asset("/api/leaderboard"), { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => this.setState({ lbData: d || { entries: [], me: null }, lbBusy: false }))
      .catch(() => this.setState({ lbBusy: false, lbData: { entries: [], me: null } }));
  }
  closeLeaderboard() { this.setState({ lbOpen: false, lbSelected: null }); }
  chooseLang(lang, voice) {
    const id = this.state.langPrompt;
    const next = { lang, langPrompt: null };
    if (voice === "male" || voice === "female") next.voice = voice;
    this.setState(next, () => {
      try {
        localStorage.setItem("ipj_lang_v2", lang);
        if (next.voice) localStorage.setItem("ipj_voice", next.voice);
      } catch (e) {}
      if (id != null) this.openProphet(id);
    });
  }
  openProphet(id) { const i = this.data().findIndex((d) => d.id === id); if (!this.isUnlocked(i)) return; this.primeSpeech(); this.sfx("open"); this.setState({ screen: "stage", curId: id, sub: "arrive", panel: 0, pickedDec: null, pickedMod: null, goodCount: 0, earned: 0, activeWord: -1, quiz: null, quizPick: null, quizIdx: 0, ayahIdx: 0, starsEarned: 0, leveledTo: null }); }
  backToMap() { this.stopAudio(); if (this.synth) this.synth.cancel(); this.setState({ screen: "map" }); }
  beginStory() { this.sfx("page"); this.setState({ sub: "story", panel: 0, activeWord: -1 }); }
  nextPanel() { this.sfx("page"); const d = this.curData(); if (this.state.panel < d.panels.length - 1) this.setState({ panel: this.state.panel + 1, activeWord: -1 }); else this.setState({ sub: "decision", activeWord: -1 }); }
  pickDecision(w) { const d = this.curData(); const good = w === d.decision.good; this.sfx(good ? "good" : "soft"); this.setState((st) => ({ sub: "dres", pickedDec: w, goodCount: st.goodCount + (good ? 1 : 0), activeWord: -1 })); }
  toModern() { this.sfx("page"); this.setState({ sub: "modern", activeWord: -1 }); }
  pickModern(w) { const d = this.curData(); const good = w === d.modern.good; this.sfx(good ? "good" : "soft"); this.setState((st) => ({ sub: "mres", pickedMod: w, goodCount: st.goodCount + (good ? 1 : 0), activeWord: -1 })); }
  // Qur'anic ayah beat: 3-4 verses with recitation + meaning, before the quiz.
  toAyah() { this.sfx("page"); this.setState({ sub: "ayah", ayahIdx: 0, activeWord: -1 }); }
  ayahList() { return PROPHET_AYAH[this.state.curId] || []; }
  nextAyah() {
    this.sfx("page");
    if (this.state.ayahIdx < this.ayahList().length - 1) this.setState({ ayahIdx: this.state.ayahIdx + 1, activeWord: -1 });
    else this.toQuiz();
  }
  prevAyah() { if (this.state.ayahIdx > 0) { this.sfx("page"); this.setState({ ayahIdx: this.state.ayahIdx - 1, activeWord: -1 }); } }

  // Mini-quiz recap: a few quick "remember this?" questions before the reward.
  toQuiz() {
    const d = this.curData(); const L = this.state.lang === "ur";
    const C = (L && PROPHET_UR[d.id]) || d;
    const others = this.data().filter((x) => x.id !== d.id);
    const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const mix = (a, b) => (Math.random() < 0.5 ? [a, b] : [b, a]);
    const od1 = rnd(others), od2 = rnd(others.filter((x) => x.id !== od1.id));
    const oC1 = (L && PROPHET_UR[od1.id]) || od1;
    const lesson = C.lesson || d.lesson, wrongLesson = oC1.lesson || od1.lesson;
    const items = [
      { q: L ? `${d.name} ${d.honor} ke safar ne humein kya sikhaya?` : `What did journeying with ${d.name} ${d.honor} teach us?`,
        opts: mix({ t: lesson, ok: true }, { t: wrongLesson, ok: false }) },
      { q: L ? "Yeh kis nabi ka safar tha?" : "Whose journey was this?",
        opts: mix({ t: `${d.name} ${d.honor}`, ok: true }, { t: `${od2.name} ${od2.honor}`, ok: false }) },
    ];
    this.setState({ sub: "quiz", quiz: { items }, quizIdx: 0, quizPick: null, activeWord: -1 });
  }
  pickQuiz(i) {
    if (this.state.quizPick != null) return;       // ignore double-taps
    const item = this.state.quiz.items[this.state.quizIdx];
    const ok = item.opts[i].ok; this.sfx(ok ? "good" : "soft");
    this.setState((st) => ({ quizPick: i, goodCount: st.goodCount + (ok ? 1 : 0) }), () => {
      setTimeout(() => {
        if (this.state.sub !== "quiz") return;
        if (this.state.quizIdx < this.state.quiz.items.length - 1) this.setState({ quizIdx: this.state.quizIdx + 1, quizPick: null, activeWord: -1 });
        else this.toReward();
      }, 1150);
    });
  }
  toReward() {
    const d = this.curData();
    const stars = Math.max(1, Math.min(3, this.state.goodCount));   // 1–3 lanterns
    const earned = 10 + this.state.goodCount * 5;
    this.setState((st) => {
      const prog = { ...st.progress, completed: [...st.progress.completed], stars: { ...(st.progress.stars || {}) }, earned: { ...(st.progress.earned || {}) } };
      const before = levelFor(prog.noor).idx;
      if (!prog.completed.includes(d.id)) { prog.completed.push(d.id); prog.noor += earned; prog.earned[d.id] = earned; }
      prog.stars[d.id] = Math.max(prog.stars[d.id] || 0, stars);
      const after = levelFor(prog.noor).idx;
      return { sub: "reward", earned, starsEarned: stars, leveledTo: after > before ? levelFor(prog.noor) : null, progress: prog, celebrate: st.celebrate + 1, activeWord: -1 };
    }, () => { this.saveProgress(); this.sfx("reward"); if (this.props.onStageComplete) this.props.onStageComplete(d.id, stars); });
  }

  // ---------- SOUND FX (WebAudio, no assets needed) ----------
  audioCtx() { if (this._ac) return this._ac; try { this._ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this._ac = null; } return this._ac; }
  // Shared gain node for narration playback. Its gain can exceed 1.0, so the
  // volume slider can boost narration up to 2x — louder than the source file.
  mediaGain() {
    const ac = this.audioCtx(); if (!ac) return null;
    if (!this._mediaGain) { this._mediaGain = ac.createGain(); this._mediaGain.gain.value = this.state.volume; this._mediaGain.connect(ac.destination); }
    return this._mediaGain;
  }
  // Route an <audio> element through the gain node. An element can only be
  // sourced once; we always create fresh elements, so this is safe.
  routeThroughGain(audio) {
    try {
      const ac = this.audioCtx(); const g = this.mediaGain();
      if (!ac || !g) return;
      if (ac.state === "suspended") ac.resume();
      ac.createMediaElementSource(audio).connect(g);
    } catch (e) {}
  }
  setVolume(v) {
    const vol = Math.min(2, Math.max(0, Number(v) || 0));
    this.setState({ volume: vol });
    if (this._mediaGain) { try { this._mediaGain.gain.value = vol; } catch (e) {} }
    try { localStorage.setItem("ipj_volume", String(vol)); } catch (e) {}
  }
  tone(freq, t0, dur, type = "sine", gain = 0.12) {
    const ac = this.audioCtx(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime + t0);
    g.gain.setValueAtTime(0.0001, ac.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.02);
  }
  sfx(kind) {
    if (this.state.muted) return;
    const ac = this.audioCtx(); if (!ac) return; if (ac.state === "suspended") ac.resume();
    if (kind === "good") { this.tone(660, 0, 0.18, "sine", 0.1); this.tone(880, 0.09, 0.22, "sine", 0.1); }
    else if (kind === "reward") { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.1, 0.35, "triangle", 0.11)); }
    else if (kind === "soft") { this.tone(330, 0, 0.16, "sine", 0.07); }
    else if (kind === "page") { this.tone(520, 0, 0.08, "sine", 0.05); }
    else if (kind === "open") { this.tone(440, 0, 0.12, "triangle", 0.08); this.tone(660, 0.08, 0.16, "triangle", 0.08); }
  }

  // ---------- NARRATION ----------
  // tokenize/speakForm/storytellerWrap live in ../lib/narration so the audio
  // generator produces byte-identical spoken strings. These thin wrappers keep
  // the existing call sites intact.
  tokenize(t) { return _tokenize(t); }
  speakForm(tok) { return _speakForm(tok); }
  pickVoice() {
    if (!this.synth) return null; const vs = this.synth.getVoices() || []; if (!vs.length) return null;
    if (this.state.lang === "ur") {
      return vs.find((v) => /^ur/i.test(v.lang)) || vs.find((v) => /urdu/i.test(v.name)) || vs.find((v) => /^hi/i.test(v.lang)) || vs.find((v) => /hindi/i.test(v.name)) || vs.find((v) => /^en-(IN|GB)/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs[0];
    }
    const en = vs.filter((v) => /^en/i.test(v.lang));
    return en.find((v) => /natural|google|samantha|aria|jenny|libby|sonia|karen|moira/i.test(v.name)) || en.find((v) => /female|woman/i.test(v.name)) || en[0] || vs[0];
  }
  wordAt(ci) { let found = -1; for (const m of this._spkMap) { if (ci >= m.s) found = m.di; if (ci >= m.s && ci < m.e) { found = m.di; break; } } return found; }
  myName() { return this.state.profile && PROFILES[this.state.profile] ? PROFILES[this.state.profile].name : "friend"; }
  // Narration is gendered (beta/beti), never name-personalised — so the audio
  // is fully static (two variants). Falls back to "boy" wording if unknown.
  myGender() {
    const p = this.state.profile && PROFILES[this.state.profile];
    return p && p.gender === "girl" ? "girl" : "boy";
  }
  storytellerWrap() {
    const d = this.curData(); if (!d) return { prefix: "", suffix: "" };
    const L = this.state.lang === "ur";
    const C = (L && PROPHET_UR && PROPHET_UR[d.id]) || d;
    return _wrap({
      sub: this.state.sub, gender: this.myGender(), lang: this.state.lang,
      panelsLen: (C.panels || d.panels).length, panel: this.state.panel,
      decGood: this.state.pickedDec === d.decision.good,
      modGood: this.state.pickedMod === d.modern.good,
    });
  }

  // Stop any narration that is currently playing (static audio or browser voice).
  stopAudio() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
    if (this.audioEl) { try { this.audioEl.pause(); } catch (e) {} this.audioEl.onended = null; this.audioEl = null; }
    if (this.synth) this.synth.cancel();
  }

  // Describe the current beat for the shared narration builder.
  currentBeat() {
    const st = this.state;
    if (st.sub === "story") return { sub: "story", panel: st.panel };
    if (st.sub === "dres") return { sub: "dres", picked: st.pickedDec };
    if (st.sub === "mres") return { sub: "mres", picked: st.pickedMod };
    return { sub: st.sub };
  }

  // Play a pre-generated Azure clip and drive word highlighting from its
  // stored word-boundary timings. Returns false if no clip is available.
  playStatic(key, even = 0) {
    const meta = this.manifest && this.manifest[key];
    if (!meta) return false;
    this.stopAudio();
    const audio = new Audio(asset("/audio/" + key + ".mp3"));
    this.audioEl = audio;
    this.routeThroughGain(audio);
    // For Urdu the on-screen Roman words don't match the Urdu-script audio
    // tokens, so sweep the highlight evenly across the clip instead.
    let w = meta.w || [];
    if (even > 0) { const d = meta.d || 1; w = []; for (let i = 0; i < even; i++) w.push([i, Math.round((i / even) * d)]); }
    const tick = () => {
      if (this.audioEl !== audio) return;
      const ms = audio.currentTime * 1000;
      let di = -1;
      for (let i = 0; i < w.length; i++) { if (w[i][1] <= ms) di = w[i][0]; else break; }
      if (di !== this.state.activeWord) this.setState({ activeWord: di });
      this._raf = requestAnimationFrame(tick);
    };
    audio.onended = () => { if (this.audioEl === audio) this.setState({ activeWord: -1 }); };
    audio.play().then(() => { this._raf = requestAnimationFrame(tick); }).catch(() => {
      // Autoplay blocked — fall back to the browser voice.
      if (this.audioEl === audio) { this.audioEl = null; this.speakWeb(this._lastSpoken, this._lastMap); }
    });
    return true;
  }

  // Browser-voice fallback: speak `spoken` and highlight via onboundary.
  speakWeb(spoken, map) {
    if (!this.synth || !spoken) return;
    this.synth.cancel();
    this._spkMap = map || [];
    const u = new SpeechSynthesisUtterance(spoken);
    const v = this.pickVoice(); if (v) u.voice = v;
    u.rate = this.props.voiceRate || 0.88; u.pitch = 1.06; u.volume = Math.min(1, this.state.volume); u.lang = v ? v.lang : (this.state.lang === "ur" ? "hi-IN" : "en-US");
    u.onboundary = (e) => { if (e.charIndex == null) return; const wi = this.wordAt(e.charIndex); if (wi !== this.state.activeWord) this.setState({ activeWord: wi }); };
    u.onend = () => { this.setState({ activeWord: -1 }); };
    try { this.synth.speak(u); } catch (e) {}
  }

  // Ayah beat: play the qari recitation, then narrate the meaning.
  playAyah() {
    const a = this.ayahList()[this.state.ayahIdx]; if (!a) return;
    this.stopAudio();
    const rec = new Audio(asset(a.audio)); this.audioEl = rec; this.routeThroughGain(rec);
    rec.onended = () => { if (this.audioEl === rec) { this.audioEl = null; this.narrateAyahMeaning(); } };
    rec.play().catch(() => { if (this.audioEl === rec) this.audioEl = null; this.narrateAyahMeaning(); });
  }
  narrateAyahMeaning() {
    const a = this.ayahList()[this.state.ayahIdx]; if (!a) return;
    const text = this.state.lang === "ur" ? a.ur : a.en;
    const r = lineNarration({ lang: this.state.lang, text, voice: this.state.voice });
    this._lastSpoken = r.spoken; this._lastMap = r.map;
    if (!this.playStatic(r.key)) this.speakWeb(r.spoken, r.map);
  }
  repeatRecitation() { const a = this.ayahList()[this.state.ayahIdx]; if (!a) return; this.stopAudio(); const rec = new Audio(asset(a.audio)); this.audioEl = rec; this.routeThroughGain(rec); rec.play().catch(() => {}); }
  playArabicVoice() { const a = this.ayahList()[this.state.ayahIdx]; if (!a) return; const r = lineNarration({ lang: "ar", text: a.ar }); this.playStatic(r.key); }

  narrateCurrent() {
    if (this.state.screen !== "stage" || this.state.muted || this.props.narration === false) return;
    const d = this.curData(); if (!d) return;
    if (this.state.sub === "ayah") { this.playAyah(); return; }
    // The quiz question is generated at random (no pre-made clip). Speak the
    // English one with the browser voice; skip for Urdu (browser can't read it).
    if (this.state.sub === "quiz") {
      if (this.state.lang === "en" && this.state.quiz) { const item = this.state.quiz.items[this.state.quizIdx]; const { spoken, map } = this._assemble(item.q, "", ""); this.speakWeb(spoken, map); }
      return;
    }
    const beat = this.currentBeat();
    const r = narrationForBeat({ d, u: PROPHET_UR[d.id] || null, us: PROPHET_UR_SCRIPT[d.id] || null, lang: this.state.lang, gender: this.myGender(), sub: beat.sub, panel: beat.panel || 0, picked: beat.picked || null, voice: this.state.voice });
    this._lastSpoken = r.spoken; this._lastMap = r.map;
    const even = this.state.lang === "ur" ? _tokenize(this.buildView().body).length : 0;
    if (!this.playStatic(r.key, even)) this.speakWeb(r.spoken, r.map);
  }

  // Tokenize+normalize an arbitrary line for the browser-voice fallback.
  _assemble(body, prefix, suffix) {
    const seq = [];
    this.tokenize(prefix).forEach((tk) => seq.push({ tok: tk, di: -1 }));
    this.tokenize(body).forEach((tk, i) => seq.push({ tok: tk, di: i }));
    this.tokenize(suffix).forEach((tk) => seq.push({ tok: tk, di: -1 }));
    let spoken = ""; const map = [];
    seq.forEach((seg) => { const sp = this.speakForm(seg.tok); if (sp) { if (spoken) spoken += " "; const s0 = spoken.length; spoken += sp; map.push({ di: seg.di, s: s0, e: spoken.length }); } });
    return { spoken, map };
  }

  toggleMute() { this.setState((st) => ({ muted: !st.muted }), () => { if (this.state.muted) { this.stopAudio(); this.setState({ activeWord: -1 }); } else { this.narrateCurrent(); } }); }
  replay() { if (this.state.muted) return; this.stopAudio(); this.setState({ activeWord: -1 }, () => this.narrateCurrent()); }
  // Cycle the three narration options: English → Urdu (male) → Urdu (female) → …
  toggleLang() {
    this.setState((st) => {
      if (st.lang === "en") return { lang: "ur", voice: "male", activeWord: -1 };
      if (st.lang === "ur" && st.voice !== "female") return { lang: "ur", voice: "female", activeWord: -1 };
      return { lang: "en", activeWord: -1 };
    }, () => {
      try { localStorage.setItem("ipj_lang_v2", this.state.lang); localStorage.setItem("ipj_voice", this.state.voice); } catch (e) {}
      this.stopAudio(); this._spokeKey = null; this.narrateCurrent();
    });
  }

  // ---------- SCENE PIECES ----------
  moonEl(p) {
    // Moon drifts to a different spot/size per prophet so no two skies match.
    const id = (p && p.id) || 1; const top = 8 + ((id * 7) % 14); const left = 10 + ((id * 17) % 70); const size = 44 + ((id * 11) % 30);
    return E("div", { key: "moon", style: { position: "absolute", top: top + "%", left: left + "%", width: size + "px", height: size + "px", borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #fff, #e9e2c8 70%)", boxShadow: "0 0 50px 12px rgba(255,255,230,.32)" } });
  }
  // A large coloured nebula wash, placed per prophet — gives each story its own
  // distinct sky even when two prophets share a terrain type.
  auroraEl(p) {
    const id = p.id; const x = 12 + ((id * 29) % 76); const y = 6 + ((id * 23) % 40); const size = 60 + ((id * 13) % 50);
    return E("div", { key: "aurora", style: { position: "absolute", left: x + "%", top: y + "%", width: size + "%", height: size + "%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${p.accent}3a 0%, ${p.accent}14 38%, transparent 70%)`, filter: "blur(8px)", pointerEvents: "none" } });
  }
  starField(maxY) { const reduce = this.props.reduceMotion; return this.stars.filter((st) => st.y < (maxY || 72)).map((st, i) => E("div", { key: "st" + i, style: { position: "absolute", left: st.x + "%", top: st.y + "%", width: st.s + "px", height: st.s + "px", borderRadius: "50%", background: "#fff", boxShadow: "0 0 4px #fff", animation: reduce ? "none" : `ipjTwinkle ${st.d}s ease-in-out ${st.delay}s infinite` } })); }
  cloudEls(p) { const reduce = this.props.reduceMotion; const a = p.accent; const cs = p.terrain === "sky" ? [{ l: "8%", b: "58%", w: 130 }, { l: "58%", b: "48%", w: 160 }, { l: "34%", b: "66%", w: 100 }] : [{ l: "12%", b: "62%", w: 120 }, { l: "66%", b: "56%", w: 140 }];
    return cs.map((c, i) => E("div", { key: "cl" + i, style: { position: "absolute", left: c.l, bottom: c.b, width: c.w + "px", height: (c.w * 0.3) + "px", background: a + "2e", borderRadius: "50%", filter: "blur(4px)", animation: reduce ? "none" : `ipjDrift ${16 + i * 5}s ease-in-out ${i}s infinite alternate` } })); }
  particles(p) { const reduce = this.props.reduceMotion; const garden = p.terrain === "garden"; const col = garden ? "#bff0a0" : "#ffe2a0";
    return this.motes.map((m, i) => E("div", { key: "mo" + i, style: { position: "absolute", left: m.x + "%", top: m.y + "%", width: m.size + "px", height: m.size + "px", borderRadius: "50%", background: col, boxShadow: "0 0 8px " + col, opacity: 0, animation: reduce ? "none" : `ipjMote ${m.dur}s ease-in-out ${m.delay}s infinite` } })); }
  rainEls(p) { if (p.terrain !== "water" && p.terrain !== "sea") return []; if (this.props.reduceMotion) return []; return this.rain.map((r, i) => E("div", { key: "rn" + i, style: { position: "absolute", left: r.x + "%", top: "8%", width: "1.5px", height: r.len + "px", background: "linear-gradient(180deg,rgba(180,220,255,.5),transparent)", animation: `ipjRain ${r.dur}s linear ${r.delay}s infinite` } })); }
  birdEls(p) { if (!["garden", "sky", "mountain"].includes(p.terrain)) return []; if (this.props.reduceMotion) return []; const mk = (top, dur, delay) => E("div", { key: "bd" + top, style: { position: "absolute", top: top, left: 0, animation: `ipjFly ${dur}s linear ${delay}s infinite` } }, E("div", { style: { width: "14px", height: "7px", borderTop: "2px solid rgba(20,12,40,.7)", borderRadius: "50%", transform: "rotate(-8deg)" } })); return [mk("20%", 24, 0), mk("28%", 30, 8)]; }
  lantern() { const reduce = this.props.reduceMotion; return E("div", { key: "lant", style: { position: "absolute", bottom: "80px", left: "19%", zIndex: 6, animation: reduce ? "none" : "ipjFloat 3s ease-in-out infinite" } },
    E("div", { style: { width: "3px", height: "16px", background: "#caa24a", margin: "0 auto" } }),
    E("div", { style: { width: "16px", height: "8px", border: "2px solid #caa24a", borderBottom: "none", borderRadius: "8px 8px 0 0", margin: "0 auto" } }),
    E("div", { style: { position: "relative", width: "34px", height: "44px", borderRadius: "10px 10px 14px 14px", background: "radial-gradient(circle at 50% 40%, #fff6d8, #ffcf5e 55%, #f0a93a)", boxShadow: "0 0 30px 8px rgba(245,196,81,.7)", border: "2px solid #caa24a", animation: reduce ? "none" : "ipjGlow 3s ease-in-out infinite" } },
      E("div", { style: { position: "absolute", inset: "6px", borderRadius: "8px", background: "radial-gradient(circle at 50% 60%, #fff, #ffb74d)", animation: reduce ? "none" : "ipjFlicker 1.1s ease-in-out infinite" } }))
  ); }

  silhouette(p, t) {
    const a = p.accent, dark = "#0d0922", dark2 = "#160f33", reduce = this.props.reduceMotion;
    const L = [];
    const hill = (b, h, w, left, c) => E("div", { key: "h" + left + b, style: { position: "absolute", bottom: b + "px", left: left, width: w, height: h + "px", background: c, borderRadius: "50% 50% 0 0/100% 100% 0 0" } });
    const tri = (left, w, h, c, b) => E("div", { key: "t" + left + w, style: { position: "absolute", bottom: (b || 0) + "px", left: left, width: 0, height: 0, borderLeft: w / 2 + "px solid transparent", borderRight: w / 2 + "px solid transparent", borderBottom: h + "px solid " + c } });
    L.push(E("div", { key: "glow", style: { position: "absolute", left: "50%", bottom: "6%", transform: "translateX(-50%)", width: "120%", height: "46%", background: `radial-gradient(60% 100% at 50% 100%, ${a}88 0%, ${a}22 45%, transparent 72%)`, filter: "blur(6px)" } }));
    const terr = p.terrain;
    if (terr === "desert") {
      L.push(hill(0, 150, "70%", "-6%", dark)); L.push(hill(0, 120, "70%", "40%", dark2));
      L.push(E("div", { key: "palmt", style: { position: "absolute", bottom: "80px", left: "14%", width: "8px", height: "90px", background: dark, borderRadius: "4px" } }));
      [...Array(5)].forEach((_, i) => L.push(E("div", { key: "fr" + i, style: { position: "absolute", bottom: "168px", left: "14%", width: "52px", height: "14px", background: dark, borderRadius: "0 50% 50% 0", transformOrigin: "left center", transform: `rotate(${-60 + i * 30}deg)`, animation: reduce ? "none" : `ipjSway ${4 + i * 0.3}s ease-in-out infinite` } })));
      if (p.id === 6 || p.id === 25) { L.push(E("div", { key: "kaaba", style: { position: "absolute", bottom: "70px", left: "62%", width: "66px", height: "66px", background: "#0a0718", border: "2px solid " + a, boxShadow: "0 0 22px " + a } })); L.push(E("div", { key: "kt", style: { position: "absolute", bottom: "126px", left: "62%", width: "66px", height: "8px", background: a, boxShadow: "0 0 10px " + a } })); }
      if (p.id === 6 && this.state.sub === "story" && this.state.panel >= 4) {
        [...Array(6)].forEach((_, i) => L.push(E("div", { key: "fl" + i, style: { position: "absolute", bottom: "70px", left: `calc(40% + ${i * 9}px)`, width: "14px", height: (30 + Math.random() * 24) + "px", background: `linear-gradient(0deg,#ff7a18,#ffd24a)`, borderRadius: "50% 50% 40% 40%/70% 70% 30% 30%", filter: "blur(.5px)", transformOrigin: "bottom", animation: reduce ? "none" : `ipjFlame ${0.7 + i * 0.1}s ease-in-out infinite` } })));
      }
    } else if (terr === "mountain") {
      L.push(tri("6%", 360, 260, dark)); L.push(tri("40%", 420, 320, dark2)); L.push(tri("-4%", 300, 200, dark)); L.push(hill(0, 70, "120%", "-10%", dark));
    } else if (terr === "water") {
      L.push(E("div", { key: "sea", style: { position: "absolute", bottom: 0, left: 0, right: 0, height: "34%", background: `linear-gradient(180deg, ${a}55, ${dark} 90%)` } }));
      [0, 1, 2].forEach((i) => L.push(E("div", { key: "w" + i, style: { position: "absolute", left: "-12%", right: "-12%", bottom: (10 + i * 40) + "px", height: "3px", background: a + "66", borderRadius: "50%", animation: reduce ? "none" : `ipjWave ${3 + i}s linear infinite` } })));
      if (p.id === 3) { L.push(E("div", { key: "ark", style: { position: "absolute", bottom: "88px", left: "48%", width: "150px", height: "46px", background: dark, borderRadius: "0 0 60px 60px", border: "2px solid " + a, boxShadow: "0 0 20px " + a + "66", animation: reduce ? "none" : "ipjSwim 5s ease-in-out infinite" } }));
        L.push(E("div", { key: "mast", style: { position: "absolute", bottom: "130px", left: "53%", width: "4px", height: "56px", background: a, animation: reduce ? "none" : "ipjSwim 5s ease-in-out infinite" } }));
        L.push(E("div", { key: "sail", style: { position: "absolute", bottom: "148px", left: "54%", width: "46px", height: "40px", background: a + "cc", clipPath: "polygon(0 0,100% 50%,0 100%)", animation: reduce ? "none" : "ipjSwim 5s ease-in-out infinite" } })); }
    } else if (terr === "sea") {
      L.push(E("div", { key: "sea", style: { position: "absolute", bottom: 0, left: 0, right: 0, height: "42%", background: `linear-gradient(180deg, ${a}66, ${dark} 92%)` } }));
      [0, 1, 2, 3].forEach((i) => L.push(E("div", { key: "w" + i, style: { position: "absolute", left: "-12%", right: "-12%", bottom: (14 + i * 44) + "px", height: "4px", background: a + "55", borderRadius: "50%", animation: reduce ? "none" : `ipjWave ${2.5 + i}s linear infinite` } })));
      if (p.id === 21) { L.push(E("div", { key: "whale", style: { position: "absolute", bottom: "54px", left: "46%", width: "190px", height: "80px", background: dark, borderRadius: "50% 50% 46% 46%/60% 60% 40% 40%", border: "2px solid " + a + "aa", boxShadow: "0 0 26px " + a + "55", animation: reduce ? "none" : "ipjSwim 7s ease-in-out infinite" } }));
        L.push(E("div", { key: "spout", style: { position: "absolute", bottom: "126px", left: "60%", width: "5px", height: "42px", background: `linear-gradient(0deg,${a},transparent)`, borderRadius: "3px", animation: reduce ? "none" : "ipjFloat 2.4s ease-in-out infinite" } })); }
    } else if (terr === "garden") {
      L.push(hill(0, 110, "80%", "-10%", dark2)); L.push(hill(0, 80, "80%", "35%", dark));
      [{ l: "18%", h: 70 }, { l: "70%", h: 90 }, { l: "48%", h: 60 }].forEach((tr, i) => { L.push(E("div", { key: "tt" + i, style: { position: "absolute", bottom: "60px", left: tr.l, width: "7px", height: tr.h + "px", background: dark, transformOrigin: "bottom" } })); L.push(E("div", { key: "tc" + i, style: { position: "absolute", bottom: (50 + tr.h) + "px", left: `calc(${tr.l} - 22px)`, width: "52px", height: "52px", background: dark, borderRadius: "50%", border: "2px solid " + a + "55", transformOrigin: "bottom", animation: reduce ? "none" : `ipjSway ${4.5 + i * 0.6}s ease-in-out infinite` } })); });
    } else if (terr === "city") {
      L.push(hill(0, 50, "130%", "-15%", dark2));
      const bs = [{ l: "8%", w: 46, h: 140 }, { l: "24%", w: 60, h: 200 }, { l: "45%", w: 50, h: 160 }, { l: "62%", w: 70, h: 230 }, { l: "82%", w: 48, h: 150 }];
      bs.forEach((b, i) => { L.push(E("div", { key: "b" + i, style: { position: "absolute", bottom: "40px", left: b.l, width: b.w + "px", height: b.h + "px", background: dark, borderTop: "2px solid " + a + "66" } }));
        [...Array(3)].forEach((_, w) => L.push(E("div", { key: "win" + i + w, style: { position: "absolute", bottom: (70 + w * 40) + "px", left: `calc(${b.l} + ${b.w / 2 - 4}px)`, width: "7px", height: "9px", background: a, boxShadow: "0 0 6px " + a, opacity: .8, animation: reduce ? "none" : `ipjTwinkle ${3 + i + w}s ease-in-out infinite` } }))); });
    } else if (terr === "sky") {
      L.push(tri("20%", 300, 120, dark2)); L.push(tri("60%", 260, 90, dark));
    }
    return L;
  }

  foreground(p) { const dark = "#090614"; return [E("div", { key: "fg", style: { position: "absolute", bottom: 0, left: "-10%", width: "120%", height: "70px", background: dark, borderRadius: "50% 50% 0 0/60px 60px 0 0" } })]; }

  prophetLight(p, t) { const a = p.special ? "#7CFFB0" : "#ffe08a"; const reduce = this.props.reduceMotion;
    const left = (78 - t * 15); const top = (16 + t * 16); const scale = (0.7 + t * 0.8);
    return E("div", { key: "plight", style: { position: "absolute", left: left + "%", top: top + "%", transform: `translate(-50%,-50%) scale(${scale})`, transition: reduce ? "none" : "left 1.1s ease, top 1.1s ease, transform 1.1s ease", pointerEvents: "none" } },
      E("div", { style: { position: "absolute", left: "50%", top: "-40px", transform: "translateX(-50%)", width: "150px", height: "320px", background: `radial-gradient(50% 60% at 50% 30%, ${a}66 0%, ${a}22 40%, transparent 70%)`, filter: "blur(4px)", animation: reduce ? "none" : "ipjPulse 4s ease-in-out infinite" } }),
      E("div", { style: { width: "26px", height: "26px", borderRadius: "50%", background: "#fff", boxShadow: `0 0 40px 14px ${a}, 0 0 90px 30px ${a}88`, animation: reduce ? "none" : "ipjPulse 3s ease-in-out infinite" } })
    );
  }

  hudhudEl() { const reduce = this.props.reduceMotion; const b = "#d98a3c", d = "#7a4a1e", cream = "#fff2d8";
    return E("div", { style: { position: "relative", width: "66px", height: "66px", animation: reduce ? "none" : "ipjBob 2.4s ease-in-out infinite" } },
      ...[0, 1, 2, 3].map((i) => E("div", { key: "cr" + i, style: { position: "absolute", top: "-2px", left: (14 + i * 7) + "px", width: "5px", height: "16px", background: b, borderRadius: "3px", transformOrigin: "bottom", transform: `rotate(${-22 + i * 14}deg)`, boxShadow: "inset 0 -4px 0 " + d } })),
      E("div", { style: { position: "absolute", top: "12px", left: "14px", width: "26px", height: "24px", borderRadius: "50%", background: b } }),
      E("div", { style: { position: "absolute", top: "18px", left: "20px", width: "5px", height: "5px", borderRadius: "50%", background: "#2a1a0a" } }),
      E("div", { style: { position: "absolute", top: "22px", left: "2px", width: "16px", height: "4px", background: d, borderRadius: "2px", transform: "rotate(6deg)" } }),
      E("div", { style: { position: "absolute", top: "28px", left: "24px", width: "34px", height: "24px", borderRadius: "50% 60% 50% 40%", background: cream, border: "2px solid " + b } }),
      E("div", { style: { position: "absolute", top: "30px", left: "34px", width: "22px", height: "18px", borderRadius: "0 50% 50% 0", background: `repeating-linear-gradient(90deg, ${d} 0 4px, ${cream} 4px 8px)` } }),
      E("div", { style: { position: "absolute", top: "40px", left: "52px", width: "16px", height: "8px", background: `repeating-linear-gradient(90deg, ${d} 0 3px, ${cream} 3px 6px)`, borderRadius: "0 3px 3px 0" } })
    );
  }

  camProgress() { const d = this.curData(); if (!d) return 0; const N = d.panels.length, st = this.state.sub; const beat = st === "arrive" ? 0 : st === "story" ? this.state.panel + 1 : N + 1; return Math.min(1, beat / (N + 1)); }
  buildScene(p) {
    const t = this.camProgress();
    // Per-prophet sky: varied angle + a mid tint blended from the accent, so
    // even same-terrain prophets get a distinct palette.
    const ang = 150 + ((p.id * 9) % 60);
    const sky = `linear-gradient(${ang}deg, #100a26 0%, #241a52 46%, ${p.accent}55 80%, ${p.accent}aa 120%)`;
    return E("div", { style: { position: "absolute", inset: 0, overflow: "hidden", background: sky } },
      this.auroraEl(p),
      this.moonEl(p), ...this.starField(p.terrain === "sky" ? 82 : 64), ...this.cloudEls(p),
      ...this.silhouette(p, t),
      this.prophetLight(p, t),
      ...this.foreground(p), ...this.particles(p), ...this.rainEls(p), ...this.birdEls(p),
      E("div", { key: "vig", style: { position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 122%, transparent 38%, rgba(8,5,20,.6) 100%)", pointerEvents: "none" } })
    );
  }

  // ---------- VIEW ----------
  words(text) { const aw = this.state.activeWord; return this.tokenize(text).map((w, i) => ({ t: w + " ", style: (i === aw ? HL : NORMAL) })); }

  buildView() {
    const d = this.curData(); if (!d) return {};
    const st = this.state.sub;
    const showAr = this.props.showArabic !== false;
    const L = this.state.lang === "ur";
    const U = (L && PROPHET_UR && PROPHET_UR[d.id]) ? PROPHET_UR[d.id] : null;
    const C = U || d; const dec = (U && U.decision) || d.decision; const mod = (U && U.modern) || d.modern;
    const gen = this.myGender();
    let v;
    if (st === "arrive") {
      const greet = arriveText({ gender: gen, lang: this.state.lang, prophetName: d.name, honor: d.honor, arrive: C.arrive });
      v = { key: "arrive", tag: L ? "Pahunche" : "Arrive", icon: "✨", tagColor: "#f5c451", body: greet, primary: { label: L ? "Safar shuru karein ›" : "Begin the journey ›", on: () => this.beginStory() } };
    }
    else if (st === "story") { const last = this.state.panel >= C.panels.length - 1; v = { key: "story" + this.state.panel, tag: (L ? "Kahani · " : "The Story · ") + (this.state.panel + 1) + "/" + C.panels.length, icon: "📖", tagColor: "#9ec5ff", body: C.panels[this.state.panel], primary: { label: last ? (L ? "Aap kya karte? ›" : "What would you do? ›") : (L ? "Aage chalein ›" : "Continue ›"), on: () => this.nextPanel() } }; }
    else if (st === "decision") v = { key: "dec", tag: L ? "Aap ka faisla" : "Your Choice", icon: "🤔", tagColor: "#ffb86b", body: dec.q, choices: [{ letter: "A", t: dec.a.t, onPick: () => this.pickDecision("a") }, { letter: "B", t: dec.b.t, onPick: () => this.pickDecision("b") }] };
    else if (st === "dres") { const ch = dec[this.state.pickedDec]; v = { key: "dres", tag: L ? "Kahani mein" : "In the Story", icon: "🌟", tagColor: "#f5c451", body: ch.r, primary: { label: L ? "Aaj ki zindagi mein ›" : "Bring it to today ›", on: () => this.toModern() } }; }
    else if (st === "modern") v = { key: "mod", tag: L ? "Aaj" : "Today", icon: "🏠", tagColor: "#7fe0c0", body: mod.q, choices: [{ letter: "A", t: mod.a.t, onPick: () => this.pickModern("a") }, { letter: "B", t: mod.b.t, onPick: () => this.pickModern("b") }] };
    else if (st === "mres") { const ch = mod[this.state.pickedMod]; v = { key: "mres", tag: L ? "Sochiye" : "Reflection", icon: "💡", tagColor: "#7fe0c0", body: ch.r, primary: { label: L ? "Quran ki aayaat ›" : "Verses from the Qur’an ›", on: () => this.toAyah() } }; if (d.dua && showAr) { v.ar = d.dua.ar; v.arEn = "Du’a: " + d.dua.en; } }
    else if (st === "ayah") {
      const list = this.ayahList(); const a = list[this.state.ayahIdx] || {}; const last = this.state.ayahIdx >= list.length - 1;
      const meaning = (L ? a.ur : a.en) || "";
      v = { key: "ayah" + this.state.ayahIdx, tag: (L ? "قرآن · " : "Qur’an · ") + (this.state.ayahIdx + 1) + "/" + (list.length || 1), icon: "☪", tagColor: "#7fe0c0",
        body: meaning, rtl: L,
        ayahAr: a.ar, ayahRef: a.ref,
        ayahControls: { repeat: () => this.repeatRecitation(), prev: this.state.ayahIdx > 0 ? () => this.prevAyah() : null,
          repeatLabel: L ? "تلاوت" : "Recite" },
        primary: { label: last ? (L ? "Chhota sawaal ›" : "Quick recap ›") : (L ? "Agli aayat ›" : "Next verse ›"), on: () => this.nextAyah() } };
    }
    else if (st === "quiz") { const items = (this.state.quiz && this.state.quiz.items) || []; const q = items[this.state.quizIdx] || { q: "", opts: [] }; const picked = this.state.quizPick;
      v = { key: "quiz" + this.state.quizIdx, tag: (L ? "Yaad hai? · " : "Remember? · ") + (this.state.quizIdx + 1) + "/" + (items.length || 1), icon: "🧠", tagColor: "#ffb86b", body: q.q,
        quizOpts: q.opts.map((o, i) => ({ letter: String.fromCharCode(65 + i), t: o.t, ok: o.ok, picked: picked === i, revealed: picked != null, onPick: () => this.pickQuiz(i) })) }; }
    else if (st === "reward") { const lesson = (C.lesson || d.lesson), badge = (C.badge || d.badge);
      const body = rewardText({ gender: gen, lang: this.state.lang, prophetName: d.name, honor: d.honor, lesson });
      const rewardPrimary = this.isGuest
        ? { label: L ? "Login karke jari rakhein ›" : "Log in to continue ›", on: () => this.requestLogin() }
        : { label: L ? "Safar jari rakhein ›" : "Continue your journey ›", on: () => this.backToMap() };
      v = { key: "reward", tag: L ? "Manzil roshan!" : "Land Lit!", icon: "🎉", tagColor: "#f5c451", body, isReward: true, noorEarned: this.state.earned, stars: this.state.starsEarned, leveledTo: this.state.leveledTo, badge, badgeIcon: d.badgeIcon, primary: rewardPrimary }; }
    else v = {};
    if (v.body) v.words = this.words(v.body);
    return v;
  }

  renderVals() {
    const st = this.state;
    const prof = st.profile ? PROFILES[st.profile] : null;
    const profiles = Object.keys(PROFILES).map((k) => ({ ...PROFILES[k], onPick: () => this.pickProfile(k) }));
    const completed = st.progress.completed;
    const DATA = this.data();
    const starsMap = st.progress.stars || {};
    // Every prophet sits on a single winding rope: the button is centred on the
    // rope, the label sits to one side, alternating, so the 25 read as one path.
    const STEP = 112; // px per node
    const nodes = DATA.map((d, i) => {
      const done = completed.includes(d.id), unlocked = this.isUnlocked(i), current = unlocked && !done, side = i % 2 === 0 ? "left" : "right";
      const cx = 50 + (side === "left" ? -14 : 14); // button drifts left/right of centre
      const a = d.accent; let btnBg, ring, medalText, medalColor, dim = "";
      if (done) { btnBg = `linear-gradient(135deg, ${a}, ${a}aa)`; ring = "0 0 0 3px rgba(245,196,81,.4)"; medalText = "✓"; medalColor = "#fff"; }
      else if (current) { btnBg = "linear-gradient(180deg,#ffd56b,#f5b836)"; ring = "0 0 26px 4px rgba(245,196,81,.6)"; medalText = String(d.id); medalColor = "#1a1140"; }
      else { btnBg = "rgba(255,255,255,.05)"; ring = "inset 0 0 0 2px rgba(255,255,255,.12)"; medalText = "🔒"; medalColor = "rgba(255,255,255,.5)"; dim = "opacity:.45;"; }
      const btnStyle = `position:absolute;top:${i * STEP + STEP / 2}px;left:${cx}%;transform:translate(-50%,-50%);width:70px;height:70px;border-radius:50%;border:none;cursor:${unlocked ? "pointer" : "default"};background:${btnBg};box-shadow:${ring};display:flex;align-items:center;justify-content:center;z-index:2;${current ? "animation:ipjFloat 3s ease-in-out infinite;" : ""}`;
      // Label sits on the OUTER side of the button, clear of the centre rope.
      const labelStyle = `position:absolute;top:${i * STEP + STEP / 2}px;transform:translateY(-50%);${side === "left" ? `right:calc(${100 - cx}% + 44px);text-align:right;` : `left:calc(${cx}% + 44px);text-align:left;`}max-width:40%;z-index:2;`;
      const medalStyle = `font-family:'Fredoka';font-weight:600;font-size:${medalText.length > 1 ? "24px" : "26px"};color:${medalColor};`;
      const stars = done ? (starsMap[d.id] || 1) : 0;
      // On the "Your Journey" map, Muhammad ﷺ is honoured as رسول الله
      // (Messenger of Allah) in Arabic rather than the bare name.
      const nodeAr = d.special ? "رسول الله" : d.ar;
      return { name: d.name, ar: nodeAr, epithet: d.epithet, btnStyle, medalStyle, medalText, labelStyle, dim, unlocked, done, stars, side, onClick: () => this.promptLang(d.id), onReset: done ? () => this.resetProphet(d.id) : null };
    });
    const ropeHeight = DATA.length * STEP + 40;
    // Badge gallery: earned badges fill the shelf, locked ones stay dim.
    const L = st.lang === "ur";
    const badges = DATA.map((d) => {
      const done = completed.includes(d.id);
      const C = (L && PROPHET_UR[d.id]) || d;
      return { icon: done ? d.badgeIcon : "🔒", label: done ? (C.badge || d.badge) : "", name: d.name, done };
    });
    const level = levelFor(st.progress.noor);
    const cur = this.curData(); let curVM = {}, scene = null, view = {}, sceneKey = "";
    if (cur) {
      const stepNames = { arrive: "Arrive", story: "Story", decision: "Choose", dres: "Choose", modern: "Today", mres: "Today", ayah: "Qur’an", quiz: "Recap", reward: "Reward" };
      curVM = { name: cur.name, ar: cur.ar, honor: cur.honor, stepLabel: stepNames[st.sub] || "" };
      const sk = cur.id + "|" + st.sub + "|" + st.panel;
      if (this._sk !== sk) { this._scene = this.buildScene(cur); this._sk = sk; }
      scene = this._scene; sceneKey = sk; view = this.buildView();
    }
    const ct = this.camProgress();
    const cameraStyle = `transform:translateX(${(-ct * 15).toFixed(2)}%) scale(${(1 + ct * 0.13).toFixed(3)});transform-origin:62% 90%;transition:${this.props.reduceMotion ? "none" : "transform 1.2s cubic-bezier(.4,.1,.2,1)"};`;
    const showHud = cur && ["arrive", "story", "dres", "mres", "reward"].includes(st.sub);
    return {
      isWelcome: st.screen === "welcome", isProfile: st.screen === "profile", isMap: st.screen === "map", isStage: st.screen === "stage",
      startApp: () => this.startApp(), resetAll: () => this.resetAll(),
      skyStars: E("div", null, ...this.starField(100)),
      profiles, profileName: prof ? prof.name : "", profileInitial: prof ? prof.initial : "", profileGrad: prof ? prof.grad : "#fff", profilePic: prof ? prof.pic : "",
      noor: st.progress.noor, badgeCount: completed.length, doneCount: completed.length, nodes, ropeHeight,
      badges, level, streak: st.progress.streak || 0, celebrate: st.celebrate, sceneKey,
      floatingAvatar: cur ? this.floatingAvatar() : null,
      mapMedallion: prof ? this.picMedallion(prof.pic, 64, prof.grad) : null,
      cardOffset: cur ? CARD_OFFSETS[this.beatIndex() % CARD_OFFSETS.length] : { x: 0, y: 0 },
      goProfile: () => this.goProfile(), cur: curVM, scene, view,
      hudhud: cur ? this.hudhudEl() : null, hudhudPos: showHud ? "top:84px;right:18px;" : "top:84px;right:18px;opacity:0;pointer-events:none;",
      backToMap: () => this.backToMap(),
      cameraStyle, lantern: cur ? this.lantern() : null,
      muteIcon: st.muted ? "🔇" : "🔊", toggleMute: () => this.toggleMute(), replay: () => this.replay(),
      volume: st.volume, setVolume: (v) => this.setVolume(v),
      langPrompt: st.langPrompt, chooseLang: (l, v) => this.chooseLang(l, v), cancelLang: () => this.setState({ langPrompt: null }),
      guest: this.isGuest, requestLogin: () => this.requestLogin(),
      openLeaderboard: () => this.openLeaderboard(), closeLeaderboard: () => this.closeLeaderboard(),
      selectLbEntry: (e) => this.setState({ lbSelected: e }),
      toggleLbInfo: () => this.setState({ lbInfo: !this.state.lbInfo }),
      lbOpen: st.lbOpen, lbBusy: st.lbBusy, lbData: st.lbData, lbSelected: st.lbSelected, lbInfo: st.lbInfo,
      streakWeight: STREAK_WEIGHT,
      saveAchievement: () => this.saveAchievement(),
      langLabel: (st.lang === "ur" ? "EN" : "اردو"), toggleLang: () => this.toggleLang(),
      t: {
        profileSub: (st.lang === "ur" ? "Apni lantern ki roshni mein tamam 25 ambiya ke raaste ka safar karein." : "Travel the path of all 25 prophets — by the light of your lantern."),
        chooseTraveler: (st.lang === "ur" ? "Apna musafir chuno" : "Choose your traveler"),
        soundNote: (st.lang === "ur" ? "🔊 Aawaz ke saath sunaya jaata hai · sound on rakhein" : "🔊 Narrated aloud · best with sound on"),
        langToggleLabel: (st.lang === "en" ? "🌐 English" : (st.voice === "female" ? "🌐 Urdu — Uzma (female)" : "🌐 Urdu — Asad (male)")),
        yourJourney: (st.lang === "ur" ? "Aap ka Safar" : "Your Journey"),
        playLabel: (st.lang === "ur" ? "▶  Shuru karein" : "▶  Play"),
        welcomeSub: (st.lang === "ur" ? "Tamam 25 ambiya ke saath ek roshan safar" : "A journey of light with all 25 prophets"),
        resetAllLabel: (st.lang === "ur" ? "↺ Saara safar reset karein" : "↺ Reset all progress"),
        badgesTitle: (st.lang === "ur" ? "Aap ke Tamghe" : "Your Badges"),
        streakLabel: (st.lang === "ur" ? "din ka silsila" : "day streak"),
        levelWord: (st.lang === "ur" ? "Darja" : "Level"),
      },
      journeySub: (st.lang === "ur" ? `25 mein se ${completed.length} manzilein roshan · shabash, ${prof ? prof.name : ""}!` : `${completed.length} of 25 lands lit · keep going, ${prof ? prof.name : ""}!`),
    };
  }

  // Circular photo medallion (gradient ring + soft glow) for a traveller.
  picMedallion(pic, size, grad) {
    // Cap by viewport width so big medallions shrink gracefully on small phones.
    const dim = `min(${size}px, ${Math.round(size / 4.6)}vw)`;
    return E("div", { style: { width: dim, height: dim, borderRadius: "50%", padding: "3px", background: grad, boxShadow: "0 0 22px rgba(245,196,81,.45), 0 6px 18px rgba(0,0,0,.5)" } },
      E("div", { style: { width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,.7)" } },
        E("img", { src: asset(pic), alt: "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })
      )
    );
  }
  // Which beat we're on — drives where the floating avatar hops to next.
  beatIndex() {
    const st = this.state; const order = { arrive: 0, story: 1, decision: 2, dres: 3, modern: 4, mres: 5, ayah: 6, quiz: 7, reward: 8 };
    return (order[st.sub] || 0) + (st.sub === "story" ? st.panel : 0);
  }
  // The selected traveller, floating through the scene — a new spot/size each beat.
  floatingAvatar() {
    const prof = this.state.profile && PROFILES[this.state.profile];
    if (!prof) return null;
    const spot = AVATAR_SPOTS[this.beatIndex() % AVATAR_SPOTS.length];
    const reduce = this.props.reduceMotion;
    return E("div", { key: "ava", style: { position: "absolute", top: spot.t, left: spot.l, zIndex: 7, pointerEvents: "none", transition: reduce ? "none" : "top 1.1s ease, left 1.1s ease, width 1.1s ease", animation: reduce ? "none" : "ipjFloat 4.2s ease-in-out infinite", filter: "drop-shadow(0 0 10px rgba(245,196,81,.3))" } },
      this.picMedallion(prof.pic, spot.size, prof.grad)
    );
  }

  // A burst of falling confetti, keyed by `celebrate` so it replays each reward.
  confetti(celebrate) {
    if (this.props.reduceMotion) return null;
    return E("div", { key: "cf" + celebrate, style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 20 } },
      ...this.confettiPieces.map((p, i) => E("div", { key: i, style: { position: "absolute", top: "-16px", left: p.x + "%", width: p.w + "px", height: p.h + "px", background: p.c, borderRadius: "2px", transform: `rotate(${p.rot}deg)`, animation: `ipjConfetti ${p.dur}s ${p.delay}s cubic-bezier(.3,.6,.5,1) forwards` } }))
    );
  }

  // Render the current reward as a shareable PNG card (prophet, stars, badge,
  // Noor, the child's avatar, and Safar-e-Anbiya branding), then Web-Share or
  // download it.
  async saveAchievement() {
    const d = this.curData(); if (!d || typeof document === "undefined") return;
    const prof = this.state.profile && PROFILES[this.state.profile];
    const stars = this.state.starsEarned || 0, noor = this.state.earned || 0;
    const L = this.state.lang === "ur";
    const W = 1080, H = 1080;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b1340"); g.addColorStop(1, "#0b0720");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const load = (src) => new Promise((res) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const emblem = await load(asset("/brand/png/emblem-512.png"));
    if (emblem) ctx.drawImage(emblem, W / 2 - 95, 60, 190, 190);
    const avatar = prof ? await load(asset(prof.pic)) : null;
    ctx.save(); ctx.beginPath(); ctx.arc(W / 2, 430, 150, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatar) ctx.drawImage(avatar, W / 2 - 150, 280, 300, 300); else { ctx.fillStyle = "rgba(245,196,81,.15)"; ctx.fillRect(W / 2 - 150, 280, 300, 300); }
    ctx.restore();
    ctx.lineWidth = 8; ctx.strokeStyle = "#f5c451"; ctx.beginPath(); ctx.arc(W / 2, 430, 150, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#f4eede"; ctx.font = "600 54px Fredoka, sans-serif"; ctx.fillText(prof ? prof.name : "", W / 2, 650);
    ctx.fillStyle = "#f5c451"; ctx.font = "700 42px Amiri, serif"; ctx.fillText(d.ar || "", W / 2, 720);
    ctx.fillStyle = "#f4eede"; ctx.font = "600 40px Fredoka, sans-serif"; ctx.fillText(`${d.name} ${d.honor}`, W / 2, 786);
    ctx.font = "60px serif"; for (let i = 0; i < 3; i++) { ctx.fillStyle = i < stars ? "#f5c451" : "rgba(255,255,255,.2)"; ctx.fillText("★", W / 2 - 80 + i * 80, 880); }
    ctx.fillStyle = "#bff5e2"; ctx.font = "600 36px Fredoka, sans-serif"; ctx.fillText(`${d.badgeIcon} ${d.badge}   ·   +${noor} Noor`, W / 2, 958);
    ctx.fillStyle = "rgba(244,238,222,.6)"; ctx.font = "500 30px Fredoka, sans-serif"; ctx.fillText("Safar-e-Anbiya · safar-anbiya.gennoor.com", W / 2, 1030);
    cv.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `safar-anbiya-${d.id}.png`, { type: "image/png" });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Safar-e-Anbiya", text: L ? `${prof ? prof.name : ""} ne ${d.badge} tamgha hasil kiya!` : `${prof ? prof.name : ""} earned the ${d.badge} badge!` });
          return;
        }
      } catch (e) {}
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  render() {
    const V = this.renderVals();
    return (
      <div style={s("position:relative;width:100%;min-height:100dvh;height:100dvh;overflow:hidden;font-family:'Nunito',system-ui,sans-serif;background:radial-gradient(120% 100% at 50% 0%,#1a1140 0%,#0c0820 70%);color:#f4eede;")}>

        {/* ============ WELCOME ============ */}
        {V.isWelcome && (
          <div style={s("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;")}>
            <div style={s("position:absolute;inset:0;overflow:hidden;pointer-events:none;")}>{V.skyStars}</div>
            <div style={s("position:relative;animation:ipjRise .8s ease both;display:flex;flex-direction:column;align-items:center;")}>
              <div style={s("font-family:'Amiri',serif;font-size:clamp(22px,6vw,34px);color:#f5c451;letter-spacing:1px;")}>بِسْمِ اللَّهِ</div>
              <div style={s("font-size:clamp(40px,12vw,84px);line-height:1;margin-top:14px;animation:ipjFloat 4s ease-in-out infinite;")}>🏮</div>
              <div className="ipj-title-glow" style={s("font-family:'Fredoka';font-weight:700;font-size:clamp(34px,9vw,64px);line-height:1.04;margin-top:14px;")}>The Prophets&apos; Journey</div>
              <div style={s("font-family:'Amiri',serif;font-size:clamp(26px,7.5vw,46px);color:#ffe6a3;margin-top:8px;direction:rtl;")}>نبیوں کا سفر</div>
              <div style={s("opacity:.7;font-size:clamp(13px,3.6vw,18px);margin-top:14px;max-width:460px;")}>{V.t.welcomeSub}</div>
              <button onClick={V.startApp} className="ipj-play" style={s("cursor:pointer;margin-top:38px;border:none;border-radius:50px;padding:16px 46px;font-family:'Fredoka';font-weight:700;font-size:clamp(18px,5vw,22px);color:#1a1140;background:linear-gradient(180deg,#ffd56b,#f5b836);")}>{V.t.playLabel}</button>
            </div>
          </div>
        )}

        {/* ============ PROFILE SELECT ============ */}
        {V.isProfile && (
          <div style={s("position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;")}>
            <div style={s("position:absolute;inset:0;overflow:hidden;pointer-events:none;")}>{V.skyStars}</div>
            <div style={s("position:relative;animation:ipjRise .6s ease both;")}>
              <div style={s("font-family:'Amiri',serif;font-size:clamp(20px,5vw,30px);color:#f5c451;letter-spacing:1px;")}>بِسْمِ اللَّهِ</div>
              <div style={s("font-family:'Fredoka';font-weight:600;font-size:clamp(30px,7vw,54px);line-height:1.05;margin-top:6px;text-shadow:0 2px 30px rgba(245,196,81,.25);")}>The Prophets&apos; Journey</div>
              <div style={s("opacity:.72;font-size:clamp(14px,3.6vw,19px);margin-top:10px;max-width:520px;")}>{V.t.profileSub}</div>
            </div>
            <div style={s("margin-top:46px;opacity:.85;font-size:14px;letter-spacing:3px;text-transform:uppercase;")}>{V.t.chooseTraveler}</div>
            <div style={s("display:flex;gap:22px;margin-top:22px;flex-wrap:wrap;justify-content:center;animation:ipjRise .7s .1s ease both;")}>
              {V.profiles.map((p, i) => (
                <button key={i} className="ipj-traveler" onClick={p.onPick} style={s("cursor:pointer;background:rgba(255,255,255,.05);border:1px solid rgba(245,196,81,.25);border-radius:26px;padding:clamp(18px,5vw,26px) clamp(20px,7vw,30px) clamp(16px,4vw,22px);width:clamp(140px,42vw,170px);display:flex;flex-direction:column;align-items:center;gap:14px;color:#f4eede;backdrop-filter:blur(4px);")}>
                  <div style={s(`width:96px;height:96px;border-radius:50%;padding:3px;background:${p.grad};animation:ipjGlow 3.5s ease-in-out infinite;`)}>
                    <div style={s("width:100%;height:100%;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.7);")}>
                      <img src={asset(p.pic)} alt={p.name} style={s("width:100%;height:100%;object-fit:cover;display:block;")} />
                    </div>
                  </div>
                  <div style={s("font-family:'Fredoka';font-size:22px;font-weight:600;")}>{p.name}</div>
                  <div style={s("font-size:13px;opacity:.7;")}>{p.sub}</div>
                </button>
              ))}
            </div>
            <div style={s("margin-top:28px;opacity:.5;font-size:12px;display:flex;align-items:center;gap:7px;")}>{V.t.soundNote}</div>
            <button onClick={V.toggleLang} className="ipj-primary" style={s("cursor:pointer;margin-top:16px;border:1px solid rgba(245,196,81,.3);background:rgba(245,196,81,.08);color:#f4eede;border-radius:40px;padding:9px 18px;font-family:'Fredoka';font-weight:500;font-size:14px;")}>{V.t.langToggleLabel}</button>
          </div>
        )}

        {/* ============ JOURNEY MAP ============ */}
        {V.isMap && (
          <div style={s("position:absolute;inset:0;display:flex;flex-direction:column;")}>
            <div style={s("position:absolute;bottom:18px;right:16px;z-index:6;pointer-events:none;animation:ipjFloat 5s ease-in-out infinite;")}>{V.mapMedallion}</div>
            <div style={s("flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:14px 16px;background:linear-gradient(180deg,rgba(12,8,32,.95),rgba(12,8,32,0));z-index:5;")}>
              <button onClick={V.goProfile} style={s("cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid rgba(245,196,81,.25);background:rgba(255,255,255,.05);border-radius:40px;padding:6px 14px 6px 6px;color:#f4eede;")}>
                <span style={s(`width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid rgba(245,196,81,.6);background:${V.profileGrad};display:block;`)}>
                  <img src={asset(V.profilePic)} alt={V.profileName} style={s("width:100%;height:100%;object-fit:cover;display:block;")} />
                </span>
                <span style={s("font-family:'Fredoka';font-weight:600;font-size:16px;")}>{V.profileName}</span>
              </button>
              <div style={s("margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;")}>
                {V.streak > 0 && (
                  <div title={`${V.streak} ${V.t.streakLabel}`} style={s("display:flex;align-items:center;gap:5px;background:rgba(255,140,60,.14);border:1px solid rgba(255,140,60,.35);border-radius:40px;padding:7px 12px;")}>
                    <span style={s("font-size:16px;")}>🔥</span>
                    <span style={s("font-family:'Fredoka';font-weight:600;font-size:16px;color:#ffb86b;")}>{V.streak}</span>
                  </div>
                )}
                <div style={s("display:flex;align-items:center;gap:6px;background:rgba(245,196,81,.12);border:1px solid rgba(245,196,81,.3);border-radius:40px;padding:7px 14px;")}>
                  <span style={s("color:#f5c451;font-size:18px;")}>✦</span>
                  <span style={s("font-family:'Fredoka';font-weight:600;font-size:17px;color:#f5c451;")}>{V.noor}</span>
                  <span style={s("opacity:.6;font-size:12px;")}>Noor</span>
                </div>
                <div style={s("display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:40px;padding:7px 14px;")}>
                  <span style={s("font-size:16px;")}>🏅</span>
                  <span style={s("font-family:'Fredoka';font-weight:600;font-size:17px;")}>{V.badgeCount}</span>
                </div>
                {V.guest ? (
                  <button onClick={V.requestLogin} title="Log in" style={s("cursor:pointer;display:flex;align-items:center;gap:6px;background:rgba(245,196,81,.16);border:1px solid rgba(245,196,81,.4);border-radius:40px;padding:7px 14px;color:#f5c451;font-family:'Fredoka';font-weight:600;font-size:14px;")}>Log in</button>
                ) : (
                  <button onClick={V.openLeaderboard} title="Leaderboard" style={s("cursor:pointer;display:flex;align-items:center;gap:6px;background:rgba(127,224,192,.12);border:1px solid rgba(127,224,192,.32);border-radius:40px;padding:7px 12px;color:#bff5e2;font-family:'Fredoka';font-weight:600;font-size:15px;")}><span style={s("font-size:16px;")}>🏆</span></button>
                )}
              </div>
            </div>
            {V.guest && (
              <div style={s("margin:0 16px 6px;display:flex;align-items:center;gap:8px;justify-content:center;background:rgba(245,196,81,.08);border:1px solid rgba(245,196,81,.25);border-radius:14px;padding:8px 12px;font-size:13px;color:#ffe6a3;")}>
                <span>👀</span><span>Guest preview — only Prophet 1 is open. Log in to unlock all 25 &amp; earn Noor.</span>
              </div>
            )}
            <div style={s("display:flex;align-items:center;justify-content:center;gap:8px;padding:0 16px 6px;")}>
              <span style={s("font-size:18px;")}>{V.level.icon}</span>
              <span style={s("font-family:'Fredoka';font-weight:600;font-size:14px;color:#ffe6a3;")}>{V.t.levelWord} {V.level.idx + 1} · {V.level.name}</span>
              {V.level.next && (
                <span style={s("font-size:11px;opacity:.55;")}>({V.level.next.min - V.noor} → {V.level.next.name})</span>
              )}
            </div>
            <div style={s("text-align:center;padding:2px 16px 14px;")}>
              <img src="/brand/svg/emblem-glow.svg" alt="" width="38" height="38" style={s("display:block;margin:0 auto 2px;")} />
              <div style={s("font-family:'Fredoka';font-weight:600;font-size:clamp(22px,5vw,30px);")}>{V.t.yourJourney}</div>
              <div style={s("opacity:.6;font-size:13px;")}>{V.journeySub}</div>
            </div>
            <div className="ipj-scroll" style={s("flex:1 1 auto;min-height:0;overflow-y:auto;position:relative;padding:10px 0 30px;")}>
              <div style={s(`position:relative;width:100%;max-width:560px;margin:0 auto;height:${V.ropeHeight}px;`)}>
                {/* the flowing rope */}
                <div className="ipj-rope" style={s("position:absolute;left:50%;top:6px;bottom:6px;width:6px;border-radius:6px;transform:translateX(-50%);box-shadow:0 0 14px rgba(245,196,81,.5);")}></div>
                {V.nodes.map((n, i) => (
                  <React.Fragment key={i}>
                    <button onClick={n.onClick} style={s(n.btnStyle)}>
                      <span style={s(n.medalStyle)}>{n.medalText}</span>
                    </button>
                    <div style={s(n.labelStyle)}>
                      <div style={s("font-family:'Fredoka';font-weight:600;font-size:15px;line-height:1.05;" + n.dim)}>{n.name}</div>
                      <div style={s("font-family:'Amiri',serif;font-size:14px;color:#f5c451;" + n.dim)}>{n.ar}</div>
                      <div style={s("font-size:12px;opacity:.82;line-height:1.25;text-shadow:0 1px 4px rgba(0,0,0,.5);" + n.dim)}>{n.epithet}</div>
                      {n.done && (
                        <div style={s("display:flex;align-items:center;gap:8px;margin-top:2px;" + (n.side === "right" ? "justify-content:flex-end;" : ""))}>
                          <span style={s("font-size:12px;letter-spacing:1px;")}>
                            {[0, 1, 2].map((k) => <span key={k} style={s(k < n.stars ? "color:#f5c451;" : "color:rgba(255,255,255,.18);")}>★</span>)}
                          </span>
                          <button onClick={n.onReset} title="Reset this prophet" style={s("cursor:pointer;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:rgba(244,238,222,.7);border-radius:20px;width:22px;height:22px;font-size:12px;line-height:1;display:flex;align-items:center;justify-content:center;")}>↺</button>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* ---- Badge gallery ---- */}
              <div style={s("width:88%;max-width:560px;margin:18px auto 0;padding:16px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(245,196,81,.18);")}>
                <div style={s("font-family:'Fredoka';font-weight:600;font-size:16px;margin-bottom:12px;display:flex;align-items:center;gap:8px;")}><span>🏅</span>{V.t.badgesTitle} <span style={s("opacity:.5;font-size:13px;font-weight:400;")}>{V.badgeCount}/25</span></div>
                <div style={s("display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:10px;")}>
                  {V.badges.map((b, i) => (
                    <div key={i} title={b.done ? b.label + " · " + b.name : "Locked"} style={s(`display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border-radius:14px;background:${b.done ? "rgba(245,196,81,.1)" : "rgba(255,255,255,.03)"};border:1px solid ${b.done ? "rgba(245,196,81,.3)" : "rgba(255,255,255,.06)"};${b.done ? "" : "opacity:.5;"}`)}>
                      <div style={s("font-size:26px;" + (b.done ? "animation:ipjBadgeWobble 3.5s ease-in-out infinite;" : ""))}>{b.icon}</div>
                      <div style={s("font-size:10.5px;text-align:center;line-height:1.2;opacity:.92;height:26px;overflow:hidden;")}>{b.done ? b.label : ""}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ---- Reset all ---- */}
              <div style={s("text-align:center;margin:18px auto 6px;")}>
                <button onClick={V.resetAll} style={s("cursor:pointer;border:1px solid rgba(255,120,120,.3);background:rgba(255,120,120,.08);color:#ffb3b3;border-radius:30px;padding:9px 18px;font-family:'Fredoka';font-weight:600;font-size:13px;")}>{V.t.resetAllLabel}</button>
              </div>
            </div>
          </div>
        )}

        {/* ============ STAGE ============ */}
        {V.isStage && (
          <div style={s("position:absolute;inset:0;overflow:hidden;")}>
            <img src="/brand/svg/emblem-glow.svg" alt="" width="28" height="28" style={s("position:absolute;top:5px;left:50%;transform:translateX(-50%);z-index:11;pointer-events:none;")} />
            <div style={s("position:absolute;left:-25%;top:0;width:150%;height:100%;" + V.cameraStyle)}>
              <div className={this.props.reduceMotion ? "" : "ipj-scene-wrap"} style={s("position:absolute;inset:0;")}>
                <div key={V.sceneKey} className={this.props.reduceMotion ? "" : "ipj-scene-layer"} style={s("position:absolute;inset:0;")}>{V.scene}</div>
              </div>
            </div>
            <div style={s("position:absolute;inset:0;z-index:6;pointer-events:none;")}>{V.lantern}</div>
            {V.floatingAvatar}
            {V.view.isReward && this.confetti(V.celebrate)}

            <div className="ipj-stage-top" style={s("position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:10px;padding:34px 16px 12px;z-index:10;background:linear-gradient(180deg,rgba(10,7,26,.72),transparent);")}>
              <button onClick={V.backToMap} style={s("cursor:pointer;flex:0 0 auto;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;border-radius:40px;padding:8px 14px;font-weight:700;backdrop-filter:blur(6px);")}>‹ Map</button>
              <div style={s("flex:1;text-align:center;min-width:0;")}>
                <div style={s("font-family:'Fredoka';font-weight:600;font-size:clamp(16px,4.4vw,26px);line-height:1.1;text-shadow:0 2px 14px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{V.cur.name} <span style={s("opacity:.8;font-size:.8em;")}>{V.cur.honor}</span></div>
                <div style={s("font-family:'Amiri',serif;color:#f5c451;font-size:clamp(14px,3.6vw,20px);text-shadow:0 2px 10px rgba(0,0,0,.7);")}>{V.cur.ar}</div>
              </div>
              <button onClick={V.toggleMute} className="ipj-round" title="Sound" style={s("cursor:pointer;flex:0 0 auto;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;font-size:18px;backdrop-filter:blur(6px);")}>{V.muteIcon}</button>
              <div title={`Volume ${V.volume.toFixed(1)}×`} style={s("flex:0 0 auto;display:flex;align-items:center;gap:6px;height:42px;padding:0 12px;border-radius:21px;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);backdrop-filter:blur(6px);")}>
                <input type="range" min="0" max="2" step="0.05" value={V.volume} onChange={(e) => V.setVolume(e.target.value)} aria-label="Volume" style={{ width: 72, accentColor: "#f5c451", cursor: "pointer" }} />
                <span style={s("font-family:'Fredoka';font-size:12px;color:#f5c451;min-width:30px;text-align:right;")}>{V.volume.toFixed(1)}×</span>
              </div>
              <button onClick={V.replay} className="ipj-round" title="Replay narration" style={s("cursor:pointer;flex:0 0 auto;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;font-size:18px;backdrop-filter:blur(6px);")}>↻</button>
            </div>

            <div style={s("position:absolute;z-index:9;" + V.hudhudPos)}>{V.hudhud}</div>

            <div style={s("position:absolute;left:0;right:0;bottom:0;z-index:12;display:flex;justify-content:center;padding:0 14px clamp(20px,5vh,46px);")}>
             <div style={s(`width:100%;max-width:640px;transition:${this.props.reduceMotion ? "none" : "transform 1.2s cubic-bezier(.4,.1,.2,1)"};transform:translate(${V.cardOffset.x}vw,${V.cardOffset.y}vh);`)}>
              <div>
              <div key={V.view.key} className="ipj-scroll" style={s("width:100%;max-height:calc(100dvh - 132px);overflow-y:auto;background:linear-gradient(180deg,rgba(31,22,58,.86),rgba(18,12,40,.94));border:1px solid rgba(245,196,81,.28);border-radius:24px;padding:clamp(14px,3.5vw,20px) clamp(15px,4vw,22px);backdrop-filter:blur(10px);box-shadow:0 16px 50px rgba(0,0,0,.5);animation:ipjRise .4s ease both;")}>

                <div style={s("display:flex;align-items:center;gap:9px;margin-bottom:8px;")}>
                  <span style={s("font-size:20px;")}>{V.view.icon}</span>
                  <span style={s(`font-family:'Fredoka';font-weight:600;font-size:15px;letter-spacing:.5px;color:${V.view.tagColor};text-transform:uppercase;`)}>{V.view.tag}</span>
                </div>

                {V.view.ayahAr && (
                  <div style={s("margin-bottom:12px;")}>
                    <div style={s("padding:16px 16px 12px;border-radius:16px;background:rgba(127,224,192,.07);border:1px solid rgba(127,224,192,.22);")}>
                      <div style={s("font-family:'Amiri',serif;font-size:clamp(22px,6vw,32px);color:#bff5e2;text-align:right;direction:rtl;line-height:2;text-shadow:0 1px 10px rgba(0,0,0,.5);")}>{V.view.ayahAr}</div>
                      <div style={s("display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px;flex-wrap:wrap;")}>
                        <span style={s("font-size:12px;opacity:.7;color:#7fe0c0;font-weight:700;")}>{V.view.ayahRef}</span>
                        <div style={s("display:flex;gap:8px;")}>
                          <button onClick={V.view.ayahControls.repeat} className="ipj-choice" style={s("cursor:pointer;border:1px solid rgba(127,224,192,.4);background:rgba(127,224,192,.12);color:#eafff7;border-radius:30px;padding:6px 13px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;")}>▶ {V.view.ayahControls.repeatLabel}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={s(`font-size:clamp(17px,4.2vw,21px);line-height:1.62;font-weight:600;text-wrap:pretty;text-shadow:0 1px 6px rgba(0,0,0,.55);${V.view.rtl ? "direction:rtl;text-align:right;font-family:'Amiri',serif;line-height:2;" : ""}`)}>
                  {(V.view.words || []).map((w, i) => <span key={i} style={s(w.style)}>{w.t}</span>)}
                </div>

                {V.view.ayahControls && V.view.ayahControls.prev && (
                  <button onClick={V.view.ayahControls.prev} className="ipj-choice" style={s("cursor:pointer;margin-top:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#f4eede;border-radius:30px;padding:7px 14px;font-size:13px;font-weight:700;")}>‹ {this.state.lang === "ur" ? "Pichhli aayat" : "Previous verse"}</button>
                )}

                {V.view.ar && (
                  <div style={s("margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(245,196,81,.08);border:1px solid rgba(245,196,81,.18);")}>
                    <div style={s("font-family:'Amiri',serif;font-size:clamp(18px,4.6vw,24px);color:#f5c451;text-align:right;line-height:1.7;")}>{V.view.ar}</div>
                    <div style={s("font-size:13px;opacity:.7;font-style:italic;margin-top:6px;")}>{V.view.arEn}</div>
                  </div>
                )}

                {V.view.choices && (
                  <div style={s("display:flex;flex-direction:column;gap:10px;margin-top:16px;")}>
                    {V.view.choices.map((c, i) => (
                      <button key={i} className="ipj-choice" onClick={c.onPick} style={s("cursor:pointer;text-align:left;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f4eede;border-radius:16px;padding:14px 16px;font-size:16px;font-weight:700;font-family:'Nunito';display:flex;align-items:center;gap:12px;")}>
                        <span style={s("flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:rgba(245,196,81,.18);display:flex;align-items:center;justify-content:center;font-family:'Fredoka';color:#f5c451;")}>{c.letter}</span>
                        <span>{c.t}</span>
                      </button>
                    ))}
                  </div>
                )}

                {V.view.quizOpts && (
                  <div style={s("display:flex;flex-direction:column;gap:10px;margin-top:16px;")}>
                    {V.view.quizOpts.map((c, i) => {
                      const bg = c.revealed ? (c.ok ? "rgba(127,224,192,.18)" : (c.picked ? "rgba(255,120,120,.16)" : "rgba(255,255,255,.06)")) : "rgba(255,255,255,.06)";
                      const bd = c.revealed && c.ok ? "rgba(127,224,192,.6)" : (c.revealed && c.picked ? "rgba(255,120,120,.5)" : "rgba(255,255,255,.18)");
                      return (
                        <button key={i} className="ipj-choice" disabled={c.revealed} onClick={c.onPick} style={s(`cursor:${c.revealed ? "default" : "pointer"};text-align:left;border:1px solid ${bd};background:${bg};color:#f4eede;border-radius:16px;padding:14px 16px;font-size:16px;font-weight:700;font-family:'Nunito';display:flex;align-items:center;gap:12px;`)}>
                          <span style={s("flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:rgba(245,196,81,.18);display:flex;align-items:center;justify-content:center;font-family:'Fredoka';color:#f5c451;")}>{c.revealed && c.ok ? "✓" : c.letter}</span>
                          <span>{c.t}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {V.view.isReward && (
                  <div>
                    <div style={s("display:flex;justify-content:center;gap:10px;margin:6px 0 12px;")}>
                      {[0, 1, 2].map((k) => (
                        <span key={k} style={s(`font-size:38px;${k < V.view.stars ? "color:#f5c451;" : "color:rgba(255,255,255,.16);"}${k < V.view.stars && !this.props.reduceMotion ? `animation:ipjStarPop .5s ${k * 0.18}s ease both;` : ""}`)}>★</span>
                      ))}
                    </div>
                    <div style={s("display:flex;align-items:center;gap:16px;padding:14px;border-radius:16px;background:rgba(245,196,81,.1);border:1px solid rgba(245,196,81,.25);")}>
                      <div style={s("font-size:40px;animation:ipjFloat 2.6s ease-in-out infinite;")}>{V.view.badgeIcon}</div>
                      <div>
                        <div style={s("font-family:'Fredoka';font-weight:600;font-size:18px;color:#f5c451;")}>+{V.view.noorEarned} Noor</div>
                        <div style={s("font-size:14px;opacity:.85;")}>Badge earned · <b>{V.view.badge}</b></div>
                      </div>
                    </div>
                    {V.view.leveledTo && (
                      <div style={s("margin-top:10px;padding:11px 14px;border-radius:14px;background:rgba(127,224,192,.12);border:1px solid rgba(127,224,192,.35);display:flex;align-items:center;gap:10px;animation:ipjPop .5s ease both;")}>
                        <span style={s("font-size:24px;")}>{V.view.leveledTo.icon}</span>
                        <span style={s("font-family:'Fredoka';font-weight:600;font-size:15px;color:#bff5e2;")}>Level up! {V.view.leveledTo.name}</span>
                      </div>
                    )}
                    <button onClick={V.saveAchievement} className="ipj-choice" style={s("cursor:pointer;width:100%;margin-top:12px;border:1px solid rgba(127,224,192,.45);background:rgba(127,224,192,.12);color:#eafff7;border-radius:14px;padding:12px;font-family:'Fredoka';font-weight:600;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;")}>🏅 {this.state.lang === "ur" ? "Tamgha save / share karein" : "Save / share this badge"}</button>
                  </div>
                )}

                {V.view.primary && (
                  <button onClick={V.view.primary.on} className="ipj-primary" style={s("cursor:pointer;width:100%;margin-top:16px;border:none;border-radius:16px;padding:15px;font-family:'Fredoka';font-weight:600;font-size:17px;color:#1a1140;background:linear-gradient(180deg,#ffd56b,#f5b836);box-shadow:0 8px 24px rgba(245,184,54,.35);")}>{V.view.primary.label}</button>
                )}

              </div>
              </div>
             </div>
            </div>
          </div>
        )}

        {/* ============ LANGUAGE PICKER (before a stage starts) ============ */}
        {V.langPrompt != null && (
          <div onClick={V.cancelLang} style={s("position:fixed;inset:0;z-index:50;background:rgba(5,3,15,.74);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(3px);")}>
            <div onClick={(e) => e.stopPropagation()} style={s("width:100%;max-width:360px;background:rgba(20,14,46,.96);border:1px solid rgba(245,196,81,.28);border-radius:22px;padding:24px 22px;text-align:center;box-shadow:0 18px 60px rgba(0,0,0,.5);")}>
              <img src={asset("/brand/svg/emblem-glow.svg")} alt="" width="48" height="48" style={s("display:block;margin:0 auto 10px;")} />
              <div style={s("font-family:'Fredoka';font-weight:600;font-size:20px;color:#f4eede;margin-bottom:4px;")}>Choose your language</div>
              <div style={s("font-family:'Amiri',serif;font-size:18px;color:#f5c451;margin-bottom:18px;")}>اپنی زبان منتخب کریں</div>
              <div style={s("display:flex;flex-direction:column;gap:10px;")}>
                <button onClick={() => V.chooseLang("en")} className="ipj-primary" style={s("cursor:pointer;border:none;border-radius:14px;padding:14px;font-family:'Fredoka';font-weight:600;font-size:17px;color:#1a1140;background:linear-gradient(180deg,#ffd56b,#f5b836);")}>English · Hamza 👦🏻</button>
                <button onClick={() => V.chooseLang("ur", "male")} className="ipj-choice" style={s("cursor:pointer;border:1px solid rgba(245,196,81,.4);background:rgba(245,196,81,.1);color:#f4eede;border-radius:14px;padding:13px 14px;display:flex;align-items:center;justify-content:center;gap:8px;")}>
                  <span style={s("font-family:'Amiri',serif;font-weight:700;font-size:19px;")}>اردو</span>
                  <span style={s("font-family:'Fredoka';font-size:14px;opacity:.85;")}>Urdu · Huzaifa (male) 👳🏻‍♂️</span>
                </button>
                <button onClick={() => V.chooseLang("ur", "female")} className="ipj-choice" style={s("cursor:pointer;border:1px solid rgba(245,196,81,.4);background:rgba(245,196,81,.1);color:#f4eede;border-radius:14px;padding:13px 14px;display:flex;align-items:center;justify-content:center;gap:8px;")}>
                  <span style={s("font-family:'Amiri',serif;font-weight:700;font-size:19px;")}>اردو</span>
                  <span style={s("font-family:'Fredoka';font-size:14px;opacity:.85;")}>Urdu · Hana (female) 🧕🏻</span>
                </button>
              </div>
              <button onClick={V.cancelLang} style={s("margin-top:14px;background:none;border:none;color:rgba(244,238,222,.6);font-family:'Nunito';font-size:14px;cursor:pointer;")}>Cancel</button>
            </div>
          </div>
        )}

        {/* ============ LEADERBOARD ============ */}
        {V.lbOpen && (
          <div onClick={V.closeLeaderboard} style={s("position:fixed;inset:0;z-index:55;background:rgba(5,3,15,.78);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px);")}>
            <div onClick={(e) => e.stopPropagation()} style={s("position:relative;width:100%;max-width:420px;max-height:86vh;display:flex;flex-direction:column;background:rgba(20,14,46,.97);border:1px solid rgba(127,224,192,.28);border-radius:22px;padding:18px 16px;box-shadow:0 18px 60px rgba(0,0,0,.55);")}>
              <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:4px;")}>
                <span style={s("font-size:22px;")}>🏆</span>
                <div style={s("font-family:'Fredoka';font-weight:600;font-size:20px;color:#f4eede;flex:1;")}>Leaderboard</div>
                <button onClick={V.toggleLbInfo} aria-label="How the score is calculated" title="How the score is calculated" style={s(`cursor:pointer;border:1px solid ${V.lbInfo ? "rgba(127,224,192,.6)" : "rgba(255,255,255,.18)"};background:${V.lbInfo ? "rgba(127,224,192,.16)" : "rgba(255,255,255,.06)"};color:#bff5e2;border-radius:50%;width:30px;height:30px;font-size:15px;font-family:'Fredoka';font-weight:700;font-style:italic;`)}>i</button>
                <button onClick={V.closeLeaderboard} style={s("cursor:pointer;border:none;background:rgba(255,255,255,.08);color:#f4eede;border-radius:50%;width:30px;height:30px;font-size:15px;")}>✕</button>
              </div>
              <div style={s("font-size:12.5px;opacity:.6;margin-bottom:12px;")}>Ranked by score · younger travellers rank first on a tie</div>

              {/* How the total is calculated */}
              {V.lbInfo && (
                <div style={s("margin-bottom:12px;border:1px solid rgba(127,224,192,.3);background:rgba(127,224,192,.08);border-radius:14px;padding:12px 13px;font-size:12.5px;line-height:1.55;color:#dff7ec;")}>
                  <div style={s("font-family:'Fredoka';font-weight:700;font-size:14px;color:#bff5e2;margin-bottom:5px;")}>How the score works</div>
                  <div>Each traveller&apos;s score blends their light with their daily habit:</div>
                  <div style={s("margin:7px 0;text-align:center;font-family:'Fredoka';font-weight:600;color:#f5c451;")}>Score = ✦ Noor + ( 🔥 streak × {V.streakWeight} )</div>
                  <div style={s("opacity:.85;")}>So every day you keep your streak going adds {V.streakWeight} points — coming back daily climbs the board even faster than Noor alone. On a tie, the younger traveller ranks first.</div>
                </div>
              )}

              {V.lbBusy && (<div style={s("padding:40px;text-align:center;")}><span className="ipj-spin" style={s("display:inline-block;width:34px;height:34px;border-radius:50%;border:4px solid rgba(127,224,192,.25);border-top-color:#7fe0c0;")}></span></div>)}

              {!V.lbBusy && V.lbData && V.lbData.entries.length === 0 && (
                <div style={s("padding:34px 10px;text-align:center;opacity:.7;font-size:14px;")}>No travellers ranked yet — be the first to light up a land! ✨</div>
              )}

              {!V.lbBusy && V.lbData && V.lbData.entries.length > 0 && (
                <div className="ipj-scroll" style={s("overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:2px;")}>
                  {V.lbData.entries.map((e, i) => (
                    <button key={i} onClick={() => V.selectLbEntry(e)} className="ipj-choice" style={s(`cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;border:1px solid ${e.isMe ? "rgba(245,196,81,.55)" : "rgba(255,255,255,.12)"};background:${e.isMe ? "rgba(245,196,81,.12)" : "rgba(255,255,255,.04)"};border-radius:14px;padding:10px 12px;color:#f4eede;`)}>
                      <span style={s(`flex:0 0 auto;width:30px;text-align:center;font-family:'Fredoka';font-weight:700;font-size:16px;color:${e.rank <= 3 ? "#f5c451" : "rgba(244,238,222,.7)"};`)}>{e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : ("#" + e.rank)}</span>
                      <span style={s(`flex:0 0 auto;width:40px;height:40px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;border:2px solid ${e.gender === "girl" ? "rgba(245,111,161,.7)" : "rgba(245,196,81,.7)"};background:${e.gender === "girl" ? "rgba(245,111,161,.12)" : "rgba(245,196,81,.12)"};`)}>{e.avatar ? <img src={asset(e.avatar)} alt="" style={s("width:100%;height:100%;object-fit:cover;")} /> : e.icon}</span>
                      <span style={s("flex:1;min-width:0;")}>
                        <span style={s("display:block;font-family:'Fredoka';font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{e.name || e.handle}{e.age != null ? <span style={s("opacity:.6;font-weight:500;")}>{" · "}{e.age}</span> : null}{e.isMe ? " (You)" : ""}</span>
                        <span style={s("display:block;font-size:12px;opacity:.6;")}>{e.completed}/25 lands{e.streak > 0 ? `  ·  🔥 ${e.streak}` : ""}</span>
                      </span>
                      <span style={s("flex:0 0 auto;display:flex;align-items:center;gap:4px;color:#f5c451;font-family:'Fredoka';font-weight:700;font-size:15px;")}>✦ {e.total}</span>
                    </button>
                  ))}
                </div>
              )}

              {!V.lbBusy && V.lbData && V.lbData.me && !V.lbData.entries.some((e) => e.isMe) && (
                <div style={s("margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);")}>
                  <div style={s("display:flex;align-items:center;gap:12px;border:1px solid rgba(245,196,81,.5);background:rgba(245,196,81,.12);border-radius:14px;padding:10px 12px;")}>
                    <span style={s("width:30px;text-align:center;font-family:'Fredoka';font-weight:700;font-size:16px;color:#f5c451;")}>#{V.lbData.me.rank}</span>
                    <span style={s("flex:0 0 auto;width:30px;height:30px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;")}>{V.lbData.me.avatar ? <img src={asset(V.lbData.me.avatar)} alt="" style={s("width:100%;height:100%;object-fit:cover;")} /> : V.lbData.me.icon}</span>
                    <span style={s("flex:1;font-family:'Fredoka';font-weight:600;font-size:15px;")}>{V.lbData.me.name || V.lbData.me.handle}{V.lbData.me.age != null ? <span style={s("opacity:.6;font-weight:500;")}>{" · "}{V.lbData.me.age}</span> : null} (You)</span>
                    <span style={s("color:#f5c451;font-family:'Fredoka';font-weight:700;")}>✦ {V.lbData.me.total}</span>
                  </div>
                </div>
              )}

              {/* Tap-through profile card — pseudonymous only */}
              {V.lbSelected && (
                <div onClick={() => V.selectLbEntry(null)} style={s("position:absolute;inset:0;z-index:2;background:rgba(8,5,20,.88);border-radius:22px;display:flex;align-items:center;justify-content:center;padding:20px;")}>
                  <div onClick={(e) => e.stopPropagation()} style={s("width:100%;max-width:300px;text-align:center;background:rgba(24,17,52,.99);border:1px solid rgba(245,196,81,.3);border-radius:18px;padding:22px 18px;")}>
                    <div style={s(`width:84px;height:84px;margin:0 auto 10px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:44px;border:3px solid ${V.lbSelected.gender === "girl" ? "rgba(245,111,161,.8)" : "rgba(245,196,81,.8)"};background:${V.lbSelected.gender === "girl" ? "rgba(245,111,161,.14)" : "rgba(245,196,81,.14)"};`)}>{V.lbSelected.avatar ? <img src={asset(V.lbSelected.avatar)} alt="" style={s("width:100%;height:100%;object-fit:cover;")} /> : V.lbSelected.icon}</div>
                    <div style={s("font-family:'Fredoka';font-weight:700;font-size:20px;color:#f4eede;")}>{V.lbSelected.name || V.lbSelected.handle}{V.lbSelected.age != null ? <span style={s("opacity:.6;font-weight:500;font-size:16px;")}>{",  "}{V.lbSelected.age}</span> : null}</div>
                    <div style={s("font-size:13px;opacity:.6;margin-top:2px;")}>Rank #{V.lbSelected.rank}</div>
                    <div style={s("display:flex;justify-content:center;gap:18px;margin:16px 0;flex-wrap:wrap;")}>
                      <div><div style={s("font-family:'Fredoka';font-weight:700;font-size:22px;color:#f5c451;")}>✦ {V.lbSelected.total}</div><div style={s("font-size:11px;opacity:.6;")}>Score</div></div>
                      <div><div style={s("font-family:'Fredoka';font-weight:700;font-size:22px;color:#bff5e2;")}>{V.lbSelected.completed}/25</div><div style={s("font-size:11px;opacity:.6;")}>Lands</div></div>
                      <div><div style={s("font-family:'Fredoka';font-weight:700;font-size:22px;color:#ffb86b;")}>🔥 {V.lbSelected.streak}</div><div style={s("font-size:11px;opacity:.6;")}>Streak</div></div>
                    </div>
                    <div style={s("font-size:11.5px;opacity:.55;margin:-6px 0 12px;")}>✦ {V.lbSelected.score} Noor + 🔥 {V.lbSelected.streak} × {V.streakWeight} = {V.lbSelected.total}</div>
                    <div style={s("display:flex;align-items:center;justify-content:center;gap:7px;font-size:12px;opacity:.7;background:rgba(255,255,255,.05);border-radius:10px;padding:9px;")}>🔒 Photo kept private</div>
                    <button onClick={() => V.selectLbEntry(null)} style={s("cursor:pointer;margin-top:14px;width:100%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#f4eede;border-radius:12px;padding:10px;font-family:'Fredoka';font-weight:600;")}>Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }
}

ProphetsJourney.defaultProps = {
  narration: true,
  voiceRate: 0.88,
  reduceMotion: false,
  showArabic: true,
};
