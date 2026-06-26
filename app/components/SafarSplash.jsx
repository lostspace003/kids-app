"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { playWarmChime, primeChime } from "../lib/chime";

// First page — a faithful port of the Safar-e-Anbiya brand splash:
// Bismillah, the guiding-lantern emblem, the Arabic + Latin wordmark, a
// tagline, and a "Let's begin" button. A warm chime plays on launch/tap.
export default function SafarSplash({ onBegin }) {
  const played = useRef(false);
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 1 + Math.random() * 1.6,
        d: (2.5 + Math.random() * 2.5).toFixed(2),
        delay: (Math.random() * 4).toFixed(2),
      })),
    []
  );

  function chime() {
    if (played.current) return;
    played.current = true;
    primeChime();
    playWarmChime();
  }

  useEffect(() => {
    const t = setTimeout(chime, 250);
    const onTap = () => chime();
    window.addEventListener("pointerdown", onTap, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onTap);
    };
  }, []);

  function begin() {
    chime();
    onBegin?.();
  }

  return (
    <div style={wrap}>
      {/* stars */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {stars.map((s, i) => (
          <div key={i} style={{
            position: "absolute", left: s.x + "%", top: s.y + "%", width: s.s + "px", height: s.s + "px",
            borderRadius: "50%", background: "#fff", boxShadow: "0 0 4px #fff",
            animation: `saTwinkle ${s.d}s ease-in-out ${s.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* glow halo */}
      <div style={halo} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: "Amiri, serif", fontWeight: 700, fontSize: "clamp(22px,5.4vw,34px)", color: "#f5c451", direction: "rtl", letterSpacing: ".5px", textShadow: "0 0 26px rgba(245,196,81,.4)", animation: "saRise .7s ease both" }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <div style={{ marginTop: 30, animation: "saFloat 5s ease-in-out infinite" }}>
          <img src="/brand/svg/emblem-glow.svg" alt="Safar-e-Anbiya" width={160} height={160}
            style={{ display: "block", animation: "saGlow 3.6s ease-in-out infinite" }} />
        </div>

        <div style={{ fontFamily: "Amiri, serif", fontWeight: 700, fontSize: "clamp(26px,6vw,40px)", color: "#f5c451", direction: "rtl", marginTop: 26, textShadow: "0 0 24px rgba(245,196,81,.32)", animation: "saRise .8s .1s ease both" }}>
          سَفَرُ الْأَنْبِيَاء
        </div>

        <div style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: "clamp(40px,9vw,62px)", color: "#f4eede", lineHeight: 1, marginTop: 8, letterSpacing: ".5px", animation: "saRise .8s .15s ease both" }}>
          Safar-e-<span style={{ color: "#f5c451" }}>Anbiya</span>
        </div>

        <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: "clamp(12px,3vw,16px)", letterSpacing: 5, color: "rgba(244,238,222,.6)", marginTop: 14, animation: "saRise .8s .2s ease both" }}>
          JOURNEY OF THE PROPHETS
        </div>

        <button onClick={begin} className="sa-begin" style={beginBtn}>
          <span style={playCircle}>
            <span style={{ display: "block", width: 0, height: 0, borderLeft: "15px solid #f5c451", borderTop: "9px solid transparent", borderBottom: "9px solid transparent", marginLeft: 4 }} />
          </span>
          <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 21, color: "#1a1140", paddingRight: 6 }}>
            Let&apos;s begin
          </span>
        </button>

        <div style={{ fontFamily: "Nunito, sans-serif", fontWeight: 600, fontStyle: "italic", fontSize: 13, color: "rgba(244,238,222,.4)", marginTop: 26, animation: "saRise .8s .4s ease both" }}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </div>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed", inset: 0, zIndex: 100,
  width: "100%", minHeight: "100dvh", overflow: "hidden",
  fontFamily: "Nunito, sans-serif",
  background: "radial-gradient(125% 105% at 50% 4%,#241a52 0%,#120c2c 46%,#0b0720 100%)",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  textAlign: "center", padding: 24,
};
const halo = {
  position: "absolute", top: "38%", left: "50%", width: 560, height: 560,
  transform: "translate(-50%,-50%)",
  background: "radial-gradient(circle,rgba(245,196,81,.16) 0%,rgba(245,196,81,.05) 38%,transparent 66%)",
  pointerEvents: "none",
};
const beginBtn = {
  cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginTop: 38,
  border: "none", borderRadius: 50, padding: "15px 30px 15px 16px",
  background: "linear-gradient(180deg,#ffd56b,#f0a93a)", boxShadow: "0 14px 36px rgba(240,169,58,.4)",
  animation: "saRise .8s .3s ease both",
};
const playCircle = {
  width: 44, height: 44, borderRadius: "50%", background: "#1a1140",
  display: "flex", alignItems: "center", justifyContent: "center",
  animation: "saPulse 2.4s ease-out infinite",
};
