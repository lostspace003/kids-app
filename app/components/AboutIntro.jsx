"use client";

import React from "react";
import { Screen, Card, Primary, LangToggle, useLang, C } from "./ui";

const T = {
  en: {
    tagline: "JOURNEY OF THE PROPHETS",
    intro: (
      <>A gentle journey of light for children through the lives of all{" "}
      <strong style={{ color: C.gold }}>25 prophets</strong> (peace be upon them) — at your child's own pace.</>
    ),
    points: [
      ["📖", "Warm, narrated stories for every prophet"],
      ["🤔", "Gentle choices that nurture good character (akhlaq)"],
      ["☪️", "Verses from the Qur'an, with beautiful recitation"],
      ["🏮", "Earn Noor and badges as the lantern grows brighter"],
    ],
    cont: "Continue →",
    login: "Login to begin →",
    note: "A parent-managed account keeps your child's progress safe.",
  },
  ur: {
    tagline: "نبیوں کا سفر",
    intro: (
      <>Bachon ke liye noor se bhara ek narm safar — tamam{" "}
      <strong style={{ color: C.gold }}>25 ambiya</strong> (alaihimussalam) ki zindagiyon ka, aap ke bachay ki apni raftar se.</>
    ),
    points: [
      ["📖", "Har nabi ki pyaari, sunai gayi kahani"],
      ["🤔", "Narm faisle jo acha akhlaq sikhayein"],
      ["☪️", "Quran ki aayaat, khoobsurat tilawat ke saath"],
      ["🏮", "Noor aur tamghe kamaayein, lantern roshan hoti jaye"],
    ],
    cont: "Aage barhein →",
    login: "Shuru karne ke liye login karein →",
    note: "Walid ka account aap ke bachay ki progress mehfooz rakhta hai.",
  },
};

// Shown right after the splash: a short "what is this app" overview, then a
// button into the app (login, or continue if already signed in).
export default function AboutIntro({ authed, onContinue }) {
  const [lang, toggleLang] = useLang();
  const t = T[lang] || T.en;

  return (
    <Screen>
      <Card style={{ position: "relative" }}>
        <LangToggle lang={lang} onToggle={toggleLang} />

        <div style={{ textAlign: "center", marginBottom: 14, marginTop: 6 }}>
          <img src="/brand/svg/emblem-glow.svg" alt="" width={64} height={64} style={{ display: "block", margin: "0 auto 8px" }} />
          <h1 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 25, margin: 0, fontWeight: 600 }}>
            Safar <span style={{ color: C.gold }}>Anbiya</span>
          </h1>
          <div style={{ fontFamily: lang === "ur" ? "Amiri, serif" : "Nunito, sans-serif", fontSize: lang === "ur" ? 18 : 12.5, letterSpacing: lang === "ur" ? 0 : 3, color: "rgba(244,238,222,.6)", marginTop: 4, direction: lang === "ur" ? "rtl" : "ltr" }}>
            {t.tagline}
          </div>
        </div>

        <p style={{ color: C.ink, fontSize: 15.5, lineHeight: 1.6, textAlign: "center", margin: "0 0 16px" }}>
          {t.intro}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 0 20px" }}>
          {t.points.map(([icon, text], i) => (
            <div key={i} style={row}>
              <span style={{ fontSize: 20, width: 26, textAlign: "center" }}>{icon}</span>
              <span style={{ fontFamily: "Nunito, sans-serif", fontSize: 14.5, color: C.ink }}>{text}</span>
            </div>
          ))}
        </div>

        <Primary onClick={onContinue}>{authed ? t.cont : t.login}</Primary>
        <p style={{ color: C.dim, fontSize: 12, textAlign: "center", margin: "12px 0 0" }}>{t.note}</p>
      </Card>
    </Screen>
  );
}

const row = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "11px 13px", borderRadius: 12,
  border: `1px solid ${C.line}`, background: "rgba(255,255,255,.03)",
};
