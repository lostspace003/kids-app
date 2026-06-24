"use client";

import React from "react";
import { PROPHET_DATA } from "../data/prophets-data";
import { PROPHET_UR } from "../data/prophets-ur";

const E = React.createElement;

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
  hamza:   { name: "Hamza",   sub: "Age 8",  initial: "H", grad: "linear-gradient(135deg,#ffd56b,#f59442)" },
  huzaifa: { name: "Huzaifa", sub: "Age 6½", initial: "H", grad: "linear-gradient(135deg,#7fe0c0,#34a3a3)" },
};
const HL = "color:#ffe6a3;text-shadow:0 0 14px rgba(245,196,81,.85);";
const NORMAL = "color:rgba(244,238,222,.84);transition:color .12s,text-shadow .12s;";
const PRON = {
  "allah": "Al-laah", "bismillah": "Bis-mil-laah", "alhamdulillah": "Al-ham-doo-lil-laah",
  "mashaallah": "Maa-shaa Al-laah", "subhanallah": "Sub-haan Al-laah", "inshaallah": "In-shaa Al-laah",
  "du'a": "doo-aah", "dua": "doo-aah", "akhlaq": "akh-laaq", "kaaba": "Kaa-bah",
  "barakah": "ba-ra-kah", "quran": "Qur-aan", "qur'an": "Qur-aan", "noor": "noor",
  "jameel": "ja-meel", "sabr": "saber", "tawheed": "taw-heed", "huzaifa": "Hu-zay-fah",
  "ismail": "Is-maa-eel", "ishaq": "Is-haaq", "yaqub": "Ya-qoob", "ayyub": "Ay-yoob",
  "yusuf": "Yoo-suf", "musa": "Moo-saa", "nuh": "Nooh", "yunus": "Yoo-nus", "zakariya": "Za-ka-ree-yah",
  "sulayman": "Su-lay-maan", "dawud": "Daa-wood", "harun": "Haa-roon", "yahya": "Yah-yaa", "isa": "Ee-saa",
};

export default class ProphetsJourney extends React.Component {
  constructor(props) {
    super(props);
    const rnd = (a, b) => a + Math.random() * (b - a);
    this.stars = Array.from({ length: 52 }, () => ({ x: rnd(0, 100), y: rnd(0, 72), s: rnd(1, 3), d: rnd(2, 5).toFixed(2), delay: rnd(0, 3).toFixed(2) }));
    this.motes = Array.from({ length: 14 }, () => ({ x: rnd(8, 92), y: rnd(45, 92), size: rnd(2, 5), dur: rnd(5, 10).toFixed(2), delay: rnd(0, 6).toFixed(2) }));
    this.rain  = Array.from({ length: 26 }, () => ({ x: rnd(0, 100), len: rnd(10, 22), dur: rnd(0.7, 1.4).toFixed(2), delay: rnd(0, 1.5).toFixed(2) }));
    this.synth = (typeof window !== "undefined" && window.speechSynthesis) ? window.speechSynthesis : null;
    this._spkMap = []; this._spokeKey = null;
    let lang0 = "ur"; try { const sv = localStorage.getItem("ipj_lang_v2"); if (sv) lang0 = sv; } catch (e) {}
    this.state = {
      screen: "profile", profile: null, sub: "arrive", curId: null, panel: 0,
      pickedDec: null, pickedMod: null, goodCount: 0, earned: 0,
      muted: false, activeWord: -1, lang: lang0,
      progress: { completed: [], noor: 0 },
    };
  }

  componentDidMount() {
    if (this.synth && this.synth.onvoiceschanged !== undefined) { this.synth.onvoiceschanged = () => {}; }
  }
  componentWillUnmount() { if (this.synth) this.synth.cancel(); }
  componentDidUpdate() {
    const st = this.state;
    const key = st.screen + "|" + st.curId + "|" + st.sub + "|" + st.panel;
    if (key === this._spokeKey) return;
    this._spokeKey = key;
    if (st.screen !== "stage") { if (this.synth) this.synth.cancel(); return; }
    if (this.props.narration === false || st.muted) return;
    setTimeout(() => { if (this._spokeKey === key) this.narrateCurrent(); }, 140);
  }

  // ---------- DATA ----------
  data() { return PROPHET_DATA || []; }
  curData() { return this.data().find((d) => d.id === this.state.curId); }
  isUnlocked(i) { return i <= this.state.progress.completed.length; }

  // ---------- PROGRESS ----------
  pkey(p) { return "ipj_" + p; }
  loadProgress(p) { try { const r = localStorage.getItem(this.pkey(p)); if (r) return JSON.parse(r); } catch (e) {} return { completed: [], noor: 0 }; }
  saveProgress() { try { localStorage.setItem(this.pkey(this.state.profile), JSON.stringify(this.state.progress)); } catch (e) {} }

  // ---------- NAV ----------
  primeSpeech() { if (this.synth) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; this.synth.speak(u); } catch (e) {} } }
  pickProfile(p) { this.primeSpeech(); this.setState({ profile: p, progress: this.loadProgress(p), screen: "map" }); }
  goProfile() { if (this.synth) this.synth.cancel(); this.setState({ screen: "profile", profile: null }); }
  openProphet(id) { const i = this.data().findIndex((d) => d.id === id); if (!this.isUnlocked(i)) return; this.primeSpeech(); this.setState({ screen: "stage", curId: id, sub: "arrive", panel: 0, pickedDec: null, pickedMod: null, goodCount: 0, earned: 0, activeWord: -1 }); }
  backToMap() { if (this.synth) this.synth.cancel(); this.setState({ screen: "map" }); }
  beginStory() { this.setState({ sub: "story", panel: 0, activeWord: -1 }); }
  nextPanel() { const d = this.curData(); if (this.state.panel < d.panels.length - 1) this.setState({ panel: this.state.panel + 1, activeWord: -1 }); else this.setState({ sub: "decision", activeWord: -1 }); }
  pickDecision(w) { const d = this.curData(); this.setState((st) => ({ sub: "dres", pickedDec: w, goodCount: st.goodCount + (w === d.decision.good ? 1 : 0), activeWord: -1 })); }
  toModern() { this.setState({ sub: "modern", activeWord: -1 }); }
  pickModern(w) { const d = this.curData(); this.setState((st) => ({ sub: "mres", pickedMod: w, goodCount: st.goodCount + (w === d.modern.good ? 1 : 0), activeWord: -1 })); }
  toReward() {
    const d = this.curData(); const earned = 10 + this.state.goodCount * 5;
    this.setState((st) => {
      const prog = { completed: [...st.progress.completed], noor: st.progress.noor };
      if (!prog.completed.includes(d.id)) { prog.completed.push(d.id); prog.noor += earned; }
      return { sub: "reward", earned, progress: prog, activeWord: -1 };
    }, () => this.saveProgress());
  }

  // ---------- NARRATION ----------
  tokenize(t) { return (t || "").split(/\s+/).filter(Boolean); }
  speakForm(tok) {
    const m = tok.match(/^(\(AS\)|ﷺ)([.,;:!?'")]*)$/u); if (m) return m[2] || "";
    const lead = (tok.match(/^[^A-Za-z]*/) || [""])[0];
    const trail = (tok.match(/[^A-Za-z]*$/) || [""])[0];
    let core = tok.slice(lead.length, tok.length - trail.length);
    let poss = ""; if (/['’]s$/i.test(core)) { poss = "'s"; core = core.replace(/['’]s$/i, ""); }
    const key = core.toLowerCase().replace(/[’']/g, "'");
    if (PRON[key] !== undefined) return lead + PRON[key] + poss + trail;
    return tok;
  }
  pickVoice() {
    if (!this.synth) return null; const vs = this.synth.getVoices() || []; if (!vs.length) return null;
    if (this.state.lang === "ur") {
      return vs.find((v) => /^ur/i.test(v.lang)) || vs.find((v) => /urdu/i.test(v.name)) || vs.find((v) => /^hi/i.test(v.lang)) || vs.find((v) => /hindi/i.test(v.name)) || vs.find((v) => /^en-(IN|GB)/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || vs[0];
    }
    const en = vs.filter((v) => /^en/i.test(v.lang));
    return en.find((v) => /natural|google|samantha|aria|jenny|libby|sonia|karen|moira/i.test(v.name)) || en.find((v) => /female|woman/i.test(v.name)) || en[0] || vs[0];
  }
  wordAt(ci) { let found = -1; for (const m of this._spkMap) { if (ci >= m.s) found = m.di; if (ci >= m.s && ci < m.e) { found = m.di; break; } } return found; }
  myName() { return this.state.profile ? PROFILES[this.state.profile].name : "friend"; }
  storytellerWrap() {
    const name = this.myName(), st = this.state.sub, d = this.curData(), L = this.state.lang === "ur"; let prefix = "", suffix = "";
    if (!d) return { prefix, suffix };
    if (st === "story") {
      const C = (L && PROPHET_UR && PROPHET_UR[d.id]) || d; const N = (C.panels || d.panels).length, p = this.state.panel;
      if (p === 0) prefix = L ? `Paas aao, ${name} beta, aur dhyan se suno. ` : `Come closer, ${name}, and listen with your heart. `;
      else if (p === Math.floor(N / 2)) prefix = L ? `Ab ${name}, zara aankhein band karke ye manzar socho. ` : `Now ${name}, close your eyes for a moment and picture this. `;
      else if (p === N - 1) suffix = L ? ` Ise apne dil mein basa lena, ${name}.` : ` Hold that in your heart, ${name}.`;
    } else if (st === "decision") { prefix = L ? `Ab ${name}, kahani aap ki taraf mudti hai. ` : `Now, ${name}, the story turns to you. `; }
    else if (st === "dres") { const good = this.state.pickedDec === d.decision.good; prefix = good ? (L ? `Wah, MashaAllah, ${name}! ` : `Oh, MashaAllah, ${name}! `) : (L ? `Hmm, aao mil kar sochte hain, ${name}. ` : `Mmm, let us think about this together, ${name}. `); }
    else if (st === "modern") { prefix = L ? `Aur ${name}, yehi sabaq aaj aap ki duniya mein. ` : `And here, ${name}, is that same lesson, alive in your world today. `; }
    else if (st === "mres") { const good = this.state.pickedMod === d.modern.good; prefix = good ? (L ? `Bohat khoob, ${name}, shabash! ` : `Beautiful, ${name}, beautiful! `) : (L ? `Aao zara ghaur karein, ${name}. ` : `Let us gently reflect, ${name}. `); }
    return { prefix, suffix };
  }
  startNarration(text, prefix, suffix) {
    if (!this.synth) return;
    this.synth.cancel();
    const seq = [];
    (prefix ? this.tokenize(prefix) : []).forEach((tk) => seq.push({ tok: tk, di: -1 }));
    this.tokenize(text).forEach((tk, i) => seq.push({ tok: tk, di: i }));
    (suffix ? this.tokenize(suffix) : []).forEach((tk) => seq.push({ tok: tk, di: -1 }));
    let spoken = ""; const map = [];
    seq.forEach((seg) => { const sp = this.speakForm(seg.tok); if (sp) { if (spoken) spoken += " "; const start = spoken.length; spoken += sp; map.push({ di: seg.di, s: start, e: spoken.length }); } });
    this._spkMap = map;
    const u = new SpeechSynthesisUtterance(spoken);
    const v = this.pickVoice(); if (v) u.voice = v;
    u.rate = this.props.voiceRate || 0.88; u.pitch = 1.06; u.lang = v ? v.lang : (this.state.lang === "ur" ? "hi-IN" : "en-US");
    u.onboundary = (e) => { if (e.charIndex == null) return; const wi = this.wordAt(e.charIndex); if (wi !== this.state.activeWord) this.setState({ activeWord: wi }); };
    u.onend = () => { this.setState({ activeWord: -1 }); };
    try { this.synth.speak(u); } catch (e) {}
  }
  narrateCurrent() { if (this.state.screen !== "stage") return; const v = this.buildView(); if (v && v.body) { const { prefix, suffix } = this.storytellerWrap(); this.startNarration(v.body, prefix, suffix); } }
  toggleMute() { this.setState((st) => ({ muted: !st.muted }), () => { if (this.state.muted) { if (this.synth) this.synth.cancel(); this.setState({ activeWord: -1 }); } else { this.narrateCurrent(); } }); }
  replay() { if (this.state.muted) return; this.setState({ activeWord: -1 }, () => this.narrateCurrent()); }
  toggleLang() { this.setState((st) => ({ lang: st.lang === "ur" ? "en" : "ur", activeWord: -1 }), () => { try { localStorage.setItem("ipj_lang_v2", this.state.lang); } catch (e) {} this._spokeKey = null; this.narrateCurrent(); }); }

  // ---------- SCENE PIECES ----------
  moonEl() { return E("div", { key: "moon", style: { position: "absolute", top: "12%", left: "14%", width: "56px", height: "56px", borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #fff, #e9e2c8 70%)", boxShadow: "0 0 50px 12px rgba(255,255,230,.32)" } }); }
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
    const sky = `linear-gradient(180deg, #120c2c 0%, #241a52 52%, ${p.accent}aa 118%)`;
    return E("div", { style: { position: "absolute", inset: 0, overflow: "hidden", background: sky } },
      this.moonEl(), ...this.starField(p.terrain === "sky" ? 82 : 64), ...this.cloudEls(p),
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
    const nm = this.myName();
    let v;
    if (st === "arrive") {
      const greet = L ? `Bismillah, ${nm} beta. Apni lantern thaam lo — aaj hum dono mil kar ${d.name} ${d.honor} ke zamane ka safar karte hain. ${C.arrive}`
                      : `Bismillah, ${nm}. Take your lantern in hand — tonight, you and I travel together to the time of ${d.name} ${d.honor}. ${C.arrive}`;
      v = { key: "arrive", tag: L ? "Pahunche" : "Arrive", icon: "✨", tagColor: "#f5c451", body: greet, primary: { label: L ? "Safar shuru karein ›" : "Begin the journey ›", on: () => this.beginStory() } };
    }
    else if (st === "story") { const last = this.state.panel >= C.panels.length - 1; v = { key: "story" + this.state.panel, tag: (L ? "Kahani · " : "The Story · ") + (this.state.panel + 1) + "/" + C.panels.length, icon: "📖", tagColor: "#9ec5ff", body: C.panels[this.state.panel], primary: { label: last ? (L ? "Aap kya karte? ›" : "What would you do? ›") : (L ? "Aage chalein ›" : "Continue ›"), on: () => this.nextPanel() } }; }
    else if (st === "decision") v = { key: "dec", tag: L ? "Aap ka faisla" : "Your Choice", icon: "🤔", tagColor: "#ffb86b", body: dec.q, choices: [{ letter: "A", t: dec.a.t, onPick: () => this.pickDecision("a") }, { letter: "B", t: dec.b.t, onPick: () => this.pickDecision("b") }] };
    else if (st === "dres") { const ch = dec[this.state.pickedDec]; v = { key: "dres", tag: L ? "Kahani mein" : "In the Story", icon: "🌟", tagColor: "#f5c451", body: ch.r, primary: { label: L ? "Aaj ki zindagi mein ›" : "Bring it to today ›", on: () => this.toModern() } }; }
    else if (st === "modern") v = { key: "mod", tag: L ? "Aaj" : "Today", icon: "🏠", tagColor: "#7fe0c0", body: mod.q, choices: [{ letter: "A", t: mod.a.t, onPick: () => this.pickModern("a") }, { letter: "B", t: mod.b.t, onPick: () => this.pickModern("b") }] };
    else if (st === "mres") { const ch = mod[this.state.pickedMod]; v = { key: "mres", tag: L ? "Sochiye" : "Reflection", icon: "💡", tagColor: "#7fe0c0", body: ch.r, primary: { label: L ? "Apna inaam dekhein ›" : "See your reward ›", on: () => this.toReward() } }; if (d.dua && showAr) { v.ar = d.dua.ar; v.arEn = "Du’a: " + d.dua.en; } }
    else if (st === "reward") { const lesson = (C.lesson || d.lesson), badge = (C.badge || d.badge);
      const body = L ? `MashaAllah! Aap ne ${d.name} ${d.honor} ke saath safar kiya aur ${lesson} seekha. Agli manzil ab khul gayi hai.`
                     : `MashaAllah! You journeyed with ${d.name} ${d.honor} and learned about ${lesson}. The next land is now open.`;
      v = { key: "reward", tag: L ? "Manzil roshan!" : "Land Lit!", icon: "🎉", tagColor: "#f5c451", body, isReward: true, noorEarned: this.state.earned, badge, badgeIcon: d.badgeIcon, primary: { label: L ? "Safar jari rakhein ›" : "Continue your journey ›", on: () => this.backToMap() } }; }
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
    const nodes = DATA.map((d, i) => {
      const done = completed.includes(d.id), unlocked = this.isUnlocked(i), current = unlocked && !done, side = i % 2 === 0 ? "left" : "right";
      const rowStyle = `position:relative;display:flex;align-items:center;gap:14px;width:84%;max-width:540px;margin:0 auto 6px;padding:14px 0;${side === "left" ? "flex-direction:row;" : "flex-direction:row-reverse;text-align:right;"}`;
      const a = d.accent; let btnBg, ring, medalText, medalColor, dim = "";
      if (done) { btnBg = `linear-gradient(135deg, ${a}, ${a}aa)`; ring = "0 0 0 3px rgba(245,196,81,.4)"; medalText = "✓"; medalColor = "#fff"; }
      else if (current) { btnBg = "linear-gradient(180deg,#ffd56b,#f5b836)"; ring = "0 0 26px 4px rgba(245,196,81,.6)"; medalText = String(d.id); medalColor = "#1a1140"; }
      else { btnBg = "rgba(255,255,255,.05)"; ring = "inset 0 0 0 2px rgba(255,255,255,.12)"; medalText = "🔒"; medalColor = "rgba(255,255,255,.5)"; dim = "opacity:.45;"; }
      const btnStyle = `position:relative;flex:0 0 auto;width:72px;height:72px;border-radius:50%;border:none;cursor:${unlocked ? "pointer" : "default"};background:${btnBg};box-shadow:${ring};display:flex;align-items:center;justify-content:center;transition:transform .15s;${current ? "animation:ipjFloat 3s ease-in-out infinite;" : ""}`;
      const medalStyle = `font-family:'Fredoka';font-weight:600;font-size:${medalText.length > 1 ? "24px" : "26px"};color:${medalColor};`;
      return { name: d.name, ar: d.ar, epithet: d.epithet, rowStyle, btnStyle, medalStyle, medalText, labelStyle: "flex:1;min-width:0;", dim, unlocked, onClick: () => this.openProphet(d.id) };
    });
    const cur = this.curData(); let curVM = {}, scene = null, view = {};
    if (cur) {
      const stepNames = { arrive: "Arrive", story: "Story", decision: "Choose", dres: "Choose", modern: "Today", mres: "Today", reward: "Reward" };
      curVM = { name: cur.name, ar: cur.ar, honor: cur.honor, stepLabel: stepNames[st.sub] || "" };
      const sk = cur.id + "|" + st.sub + "|" + st.panel;
      if (this._sk !== sk) { this._scene = this.buildScene(cur); this._sk = sk; }
      scene = this._scene; view = this.buildView();
    }
    const ct = this.camProgress();
    const cameraStyle = `transform:translateX(${(-ct * 15).toFixed(2)}%) scale(${(1 + ct * 0.13).toFixed(3)});transform-origin:62% 90%;transition:${this.props.reduceMotion ? "none" : "transform 1.2s cubic-bezier(.4,.1,.2,1)"};`;
    const showHud = cur && ["arrive", "story", "dres", "mres", "reward"].includes(st.sub);
    return {
      isProfile: st.screen === "profile", isMap: st.screen === "map", isStage: st.screen === "stage",
      skyStars: E("div", null, ...this.starField(100)),
      profiles, profileName: prof ? prof.name : "", profileInitial: prof ? prof.initial : "", profileGrad: prof ? prof.grad : "#fff",
      noor: st.progress.noor, badgeCount: completed.length, doneCount: completed.length, nodes,
      goProfile: () => this.goProfile(), cur: curVM, scene, view,
      hudhud: cur ? this.hudhudEl() : null, hudhudPos: showHud ? "top:84px;right:18px;" : "top:84px;right:18px;opacity:0;pointer-events:none;",
      backToMap: () => this.backToMap(),
      cameraStyle, lantern: cur ? this.lantern() : null,
      muteIcon: st.muted ? "🔇" : "🔊", toggleMute: () => this.toggleMute(), replay: () => this.replay(),
      langLabel: (st.lang === "ur" ? "EN" : "اردو"), toggleLang: () => this.toggleLang(),
      t: {
        profileSub: (st.lang === "ur" ? "Apni lantern ki roshni mein tamam 25 ambiya ke raaste ka safar karein." : "Travel the path of all 25 prophets — by the light of your lantern."),
        chooseTraveler: (st.lang === "ur" ? "Apna musafir chuno" : "Choose your traveler"),
        soundNote: (st.lang === "ur" ? "🔊 Aawaz ke saath sunaya jaata hai · sound on rakhein" : "🔊 Narrated aloud · best with sound on"),
        langToggleLabel: (st.lang === "ur" ? "🌐 English" : "🌐 Roman Urdu"),
        yourJourney: (st.lang === "ur" ? "Aap ka Safar" : "Your Journey"),
      },
      journeySub: (st.lang === "ur" ? `25 mein se ${completed.length} manzilein roshan · shabash, ${prof ? prof.name : ""}!` : `${completed.length} of 25 lands lit · keep going, ${prof ? prof.name : ""}!`),
    };
  }

  render() {
    const V = this.renderVals();
    return (
      <div style={s("position:relative;width:100%;min-height:100vh;height:100vh;overflow:hidden;font-family:'Nunito',system-ui,sans-serif;background:radial-gradient(120% 100% at 50% 0%,#1a1140 0%,#0c0820 70%);color:#f4eede;")}>

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
                <button key={i} className="ipj-traveler" onClick={p.onPick} style={s("cursor:pointer;background:rgba(255,255,255,.05);border:1px solid rgba(245,196,81,.25);border-radius:26px;padding:26px 30px 22px;width:170px;display:flex;flex-direction:column;align-items:center;gap:14px;color:#f4eede;backdrop-filter:blur(4px);")}>
                  <div style={s(`width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fredoka';font-weight:600;font-size:38px;color:#1a1140;background:${p.grad};animation:ipjGlow 3.5s ease-in-out infinite;`)}>{p.initial}</div>
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
            <div style={s("flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:14px 16px;background:linear-gradient(180deg,rgba(12,8,32,.95),rgba(12,8,32,0));z-index:5;")}>
              <button onClick={V.goProfile} style={s("cursor:pointer;display:flex;align-items:center;gap:10px;border:1px solid rgba(245,196,81,.25);background:rgba(255,255,255,.05);border-radius:40px;padding:6px 14px 6px 6px;color:#f4eede;")}>
                <span style={s(`width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fredoka';font-weight:600;font-size:18px;color:#1a1140;background:${V.profileGrad};`)}>{V.profileInitial}</span>
                <span style={s("font-family:'Fredoka';font-weight:600;font-size:16px;")}>{V.profileName}</span>
              </button>
              <div style={s("flex:1;")}></div>
              <div style={s("display:flex;align-items:center;gap:6px;background:rgba(245,196,81,.12);border:1px solid rgba(245,196,81,.3);border-radius:40px;padding:7px 14px;")}>
                <span style={s("color:#f5c451;font-size:18px;")}>✦</span>
                <span style={s("font-family:'Fredoka';font-weight:600;font-size:17px;color:#f5c451;")}>{V.noor}</span>
                <span style={s("opacity:.6;font-size:12px;")}>Noor</span>
              </div>
              <div style={s("display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:40px;padding:7px 14px;")}>
                <span style={s("font-size:16px;")}>🏅</span>
                <span style={s("font-family:'Fredoka';font-weight:600;font-size:17px;")}>{V.badgeCount}</span>
              </div>
            </div>
            <div style={s("text-align:center;padding:2px 16px 14px;")}>
              <div style={s("font-family:'Fredoka';font-weight:600;font-size:clamp(22px,5vw,30px);")}>{V.t.yourJourney}</div>
              <div style={s("opacity:.6;font-size:13px;")}>{V.journeySub}</div>
            </div>
            <div className="ipj-scroll" style={s("flex:1;overflow-y:auto;position:relative;padding:10px 0 80px;")}>
              <div style={s("position:absolute;left:50%;top:0;bottom:0;width:0;border-left:3px dashed rgba(245,196,81,.22);transform:translateX(-50%);")}></div>
              {V.nodes.map((n, i) => (
                <div key={i} style={s(n.rowStyle)}>
                  <button onClick={n.onClick} style={s(n.btnStyle)}>
                    <span style={s(n.medalStyle)}>{n.medalText}</span>
                  </button>
                  <div style={s(n.labelStyle)}>
                    <div style={s("font-family:'Fredoka';font-weight:600;font-size:16px;line-height:1.05;" + n.dim)}>{n.name}</div>
                    <div style={s("font-family:'Amiri',serif;font-size:15px;color:#f5c451;" + n.dim)}>{n.ar}</div>
                    <div style={s("font-size:11px;opacity:.6;" + n.dim)}>{n.epithet}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ STAGE ============ */}
        {V.isStage && (
          <div style={s("position:absolute;inset:0;overflow:hidden;")}>
            <div style={s("position:absolute;left:-25%;top:0;width:150%;height:100%;" + V.cameraStyle)}>{V.scene}</div>
            <div style={s("position:absolute;inset:0;z-index:6;pointer-events:none;")}>{V.lantern}</div>

            <div style={s("position:absolute;top:0;left:0;right:0;display:flex;align-items:center;gap:10px;padding:14px 16px;z-index:10;background:linear-gradient(180deg,rgba(10,7,26,.72),transparent);")}>
              <button onClick={V.backToMap} style={s("cursor:pointer;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;border-radius:40px;padding:8px 16px;font-weight:700;backdrop-filter:blur(6px);")}>‹ Map</button>
              <div style={s("flex:1;text-align:center;min-width:0;")}>
                <div style={s("font-family:'Fredoka';font-weight:600;font-size:clamp(18px,4.4vw,26px);text-shadow:0 2px 14px rgba(0,0,0,.6);")}>{V.cur.name} <span style={s("opacity:.8;font-size:.8em;")}>{V.cur.honor}</span></div>
                <div style={s("font-family:'Amiri',serif;color:#f5c451;font-size:clamp(15px,3.6vw,20px);text-shadow:0 2px 10px rgba(0,0,0,.7);")}>{V.cur.ar}</div>
              </div>
              <button onClick={V.toggleMute} title="Sound" style={s("cursor:pointer;flex:0 0 auto;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;font-size:18px;backdrop-filter:blur(6px);")}>{V.muteIcon}</button>
              <button onClick={V.toggleLang} title="Language" style={s("cursor:pointer;flex:0 0 auto;height:42px;padding:0 14px;border-radius:21px;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;font-family:'Fredoka';font-weight:600;font-size:14px;backdrop-filter:blur(6px);")}>{V.langLabel}</button>
              <button onClick={V.replay} title="Replay narration" style={s("cursor:pointer;flex:0 0 auto;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(10,7,26,.4);color:#f4eede;font-size:18px;backdrop-filter:blur(6px);")}>↻</button>
            </div>

            <div style={s("position:absolute;z-index:9;" + V.hudhudPos)}>{V.hudhud}</div>

            <div style={s("position:absolute;left:0;right:0;bottom:0;z-index:12;display:flex;justify-content:center;padding:0 14px 18px;")}>
              <div key={V.view.key} style={s("width:100%;max-width:640px;background:linear-gradient(180deg,rgba(31,22,58,.86),rgba(18,12,40,.94));border:1px solid rgba(245,196,81,.28);border-radius:24px;padding:20px 22px 18px;backdrop-filter:blur(10px);box-shadow:0 16px 50px rgba(0,0,0,.5);animation:ipjRise .4s ease both;")}>

                <div style={s("display:flex;align-items:center;gap:9px;margin-bottom:8px;")}>
                  <span style={s("font-size:20px;")}>{V.view.icon}</span>
                  <span style={s(`font-family:'Fredoka';font-weight:600;font-size:15px;letter-spacing:.5px;color:${V.view.tagColor};text-transform:uppercase;`)}>{V.view.tag}</span>
                </div>

                <div style={s("font-size:clamp(16px,4vw,20px);line-height:1.62;font-weight:600;text-wrap:pretty;")}>
                  {(V.view.words || []).map((w, i) => <span key={i} style={s(w.style)}>{w.t}</span>)}
                </div>

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

                {V.view.isReward && (
                  <div style={s("display:flex;align-items:center;gap:16px;margin-top:14px;padding:14px;border-radius:16px;background:rgba(245,196,81,.1);border:1px solid rgba(245,196,81,.25);")}>
                    <div style={s("font-size:40px;animation:ipjFloat 2.6s ease-in-out infinite;")}>{V.view.badgeIcon}</div>
                    <div>
                      <div style={s("font-family:'Fredoka';font-weight:600;font-size:18px;color:#f5c451;")}>+{V.view.noorEarned} Noor</div>
                      <div style={s("font-size:14px;opacity:.85;")}>Badge earned · <b>{V.view.badge}</b></div>
                    </div>
                  </div>
                )}

                {V.view.primary && (
                  <button onClick={V.view.primary.on} className="ipj-primary" style={s("cursor:pointer;width:100%;margin-top:16px;border:none;border-radius:16px;padding:15px;font-family:'Fredoka';font-weight:600;font-size:17px;color:#1a1140;background:linear-gradient(180deg,#ffd56b,#f5b836);box-shadow:0 8px 24px rgba(245,184,54,.35);")}>{V.view.primary.label}</button>
                )}

              </div>
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
