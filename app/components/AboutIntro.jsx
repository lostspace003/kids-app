"use client";

import React from "react";
import { Screen, Card, Primary, C } from "./ui";
import AdSlot from "./ads/AdSlot";

// Shown right after the splash: a short "what is this app" overview in
// Roman-Urdu (transliteration) by default. Language for the journey itself is
// chosen per-prophet, so there's no toggle here.
export default function AboutIntro({ authed, onContinue }) {
  const points = [
    ["📖", "Har nabi ki pyaari, sunai gayi kahani"],
    ["🤔", "Narm faisle jo acha akhlaq sikhayein"],
    ["☪️", "Quran ki aayaat, khoobsurat tilawat ke saath"],
    ["🏮", "Noor aur tamghe kamaayein, lantern roshan hoti jaye"],
  ];
  return (
    <Screen>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img src="/brand/svg/emblem-glow.svg" alt="" width={64} height={64} style={{ display: "block", margin: "0 auto 8px" }} />
          <h1 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 25, margin: 0, fontWeight: 600 }}>
            Safar-e-<span style={{ color: C.gold }}>Anbiya</span>
          </h1>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12.5, letterSpacing: 3, color: "rgba(244,238,222,.6)", marginTop: 4 }}>
            NABIYON KA SAFAR
          </div>
        </div>

        <p style={{ color: C.ink, fontSize: 15.5, lineHeight: 1.6, textAlign: "center", margin: "0 0 16px" }}>
          Bachon ke liye noor se bhara ek narm safar — tamam{" "}
          <strong style={{ color: C.gold }}>25 ambiya</strong> (alaihimussalam) ki zindagiyon ka, aap ke bachay ki apni raftar se.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 20px" }}>
          {points.map(([icon, text], i) => (
            <div key={i} style={row}>
              <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</span>
              <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 14.5, color: C.ink }}>{text}</span>
            </div>
          ))}
        </div>

        <Primary onClick={onContinue}>{authed ? "Aage barhein →" : "Shuru karne ke liye login karein →"}</Primary>
        <p style={{ color: C.dim, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
          Walid ka account aap ke bachay ki progress mehfooz rakhta hai.
        </p>

        {/* Web-only, non-personalised ad slot (renders nothing in the app/TWA
            or until NEXT_PUBLIC_ADSENSE_SLOT_INTRO is configured). */}
        {process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTRO && (
          <AdSlot
            slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTRO}
            style={{ marginTop: 16, minHeight: 90 }}
          />
        )}
      </Card>
    </Screen>
  );
}

const row = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "11px 13px", borderRadius: 12,
  border: `1px solid ${C.line}`, background: "rgba(255,255,255,.03)",
};
