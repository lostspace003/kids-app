// A short, warm "salam" chime synthesised with the Web Audio API — a soft
// ascending major arpeggio with a gentle bell-like envelope and a low-pass
// filter for warmth. No audio asset needed.
//
// Browsers block audio until a user gesture, so callers should invoke this
// from a click/tap (or call primeChime() on first interaction).

let ctx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

export function primeChime() {
  const ac = getCtx();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

export function playWarmChime() {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const now = ac.currentTime;

  // Soft low-pass + a master gain shared by all notes for cohesion.
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2600;
  const master = ac.createGain();
  master.gain.value = 0.0001;
  filter.connect(master);
  master.connect(ac.destination);

  // Slow swell in, gentle tail out — the "warmth".
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.5, now + 0.25);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

  // A major-seventh-ish arpeggio: F4, A4, C5, F5 — warm and resolved.
  const notes = [349.23, 440.0, 523.25, 698.46];
  notes.forEach((freq, i) => {
    const t = now + i * 0.16;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    // A quiet sine partial an octave up adds shimmer.
    const shimmer = ac.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.value = freq * 2;
    const g = ac.createGain();
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    const sg = ac.createGain();
    sg.gain.value = 0.06;
    osc.connect(g);
    shimmer.connect(sg);
    sg.connect(g);
    g.connect(filter);
    osc.start(t);
    shimmer.start(t);
    osc.stop(t + 2.6);
    shimmer.stop(t + 2.6);
  });
}
