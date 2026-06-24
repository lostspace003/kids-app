"use client";

import React, { useEffect, useRef } from "react";
import { playWarmChime, primeChime } from "../lib/chime";

// The very first thing shown when the app launches: a warm full salam with a
// gentle chime. Shown to everyone, once per launch, before the flow proceeds.
export default function SalamSplash({ onBegin }) {
  const played = useRef(false);

  function chime() {
    if (played.current) return;
    played.current = true;
    primeChime();
    playWarmChime();
  }

  useEffect(() => {
    // Try to chime immediately on launch. If the browser blocks autoplay until
    // a gesture, the first tap (Begin, or anywhere) will play it instead.
    const t = setTimeout(chime, 250);
    const onFirstTap = () => chime();
    window.addEventListener("pointerdown", onFirstTap, { once: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("pointerdown", onFirstTap);
    };
  }, []);

  function begin() {
    chime();
    onBegin?.();
  }

  return (
    <div style={wrap}>
      <div style={haze} />
      <div style={{ position: "relative", textAlign: "center", padding: "0 22px" }}>
        <div style={lantern}>🏮</div>
        <div
          className="ipj-title-glow"
          style={{ fontFamily: "Amiri, serif", fontSize: "clamp(30px,8vw,54px)", color: "#ffe6a3", direction: "rtl", lineHeight: 1.5, marginBottom: 18 }}
        >
          السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ
        </div>
        <div style={{ fontFamily: "Fredoka, sans-serif", fontSize: "clamp(17px,4.4vw,24px)", color: "#f4eede", fontWeight: 600, marginBottom: 8 }}>
          Assalamu alaikum wa rahmatullahi wa barakatuhu
        </div>
        <div style={{ fontFamily: "Nunito, sans-serif", fontSize: "clamp(13px,3.4vw,16px)", color: "rgba(244,238,222,.7)", maxWidth: 460, margin: "0 auto 34px" }}>
          Peace be upon you, and the mercy of Allah and His blessings.
        </div>
        <button className="ipj-play" style={beginBtn} onClick={begin}>
          Begin the journey ✨
        </button>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(1200px 700px at 50% 20%, #1b1340 0%, #0c0820 60%, #070512 100%)",
  animation: "ipjRise .8s ease both",
};
const haze = {
  position: "absolute",
  top: "8%",
  left: "50%",
  width: 340,
  height: 340,
  transform: "translateX(-50%)",
  background: "radial-gradient(circle, rgba(245,196,81,.22), transparent 70%)",
  filter: "blur(6px)",
  pointerEvents: "none",
};
const lantern = {
  fontSize: 64,
  marginBottom: 14,
  animation: "ipjFloat 4s ease-in-out infinite",
  filter: "drop-shadow(0 0 24px rgba(245,196,81,.7))",
};
const beginBtn = {
  fontFamily: "Fredoka, sans-serif",
  fontSize: 18,
  fontWeight: 600,
  color: "#3a2606",
  background: "linear-gradient(135deg,#ffd56b,#f5b836)",
  border: "none",
  borderRadius: 999,
  padding: "14px 30px",
  cursor: "pointer",
};
