"use client";

import React from "react";
import { Screen, Card, Primary, C } from "./ui";

// Shown right after the splash: a short "what is this app" overview (English),
// then a button into the app. Language is chosen per-journey, so there's no
// toggle here.
export default function AboutIntro({ authed, onContinue }) {
  const points = [
    ["📖", "Warm, narrated stories for every prophet"],
    ["🤔", "Gentle choices that nurture good character (akhlaq)"],
    ["☪️", "Verses from the Qur'an, with beautiful recitation"],
    ["🏮", "Earn Noor and badges as the lantern grows brighter"],
  ];
  return (
    <Screen>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img src="/brand/svg/emblem-glow.svg" alt="" width={64} height={64} style={{ display: "block", margin: "0 auto 8px" }} />
          <h1 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 25, margin: 0, fontWeight: 600 }}>
            Safar <span style={{ color: C.gold }}>Anbiya</span>
          </h1>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 12.5, letterSpacing: 3, color: "rgba(244,238,222,.6)", marginTop: 4 }}>
            JOURNEY OF THE PROPHETS
          </div>
        </div>

        <p style={{ color: C.ink, fontSize: 15.5, lineHeight: 1.6, textAlign: "center", margin: "0 0 16px" }}>
          A gentle journey of light for children through the lives of all{" "}
          <strong style={{ color: C.gold }}>25 prophets</strong> (peace be upon them) — at your child's own pace.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 20px" }}>
          {points.map(([icon, text], i) => (
            <div key={i} style={row}>
              <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</span>
              <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 14.5, color: C.ink }}>{text}</span>
            </div>
          ))}
        </div>

        <Primary onClick={onContinue}>{authed ? "Continue →" : "Login to begin →"}</Primary>
        <p style={{ color: C.dim, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>
          A parent-managed account keeps your child's progress safe.
        </p>
      </Card>
    </Screen>
  );
}

const row = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "11px 13px", borderRadius: 12,
  border: `1px solid ${C.line}`, background: "rgba(255,255,255,.03)",
};
