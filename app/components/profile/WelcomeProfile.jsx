"use client";

import React from "react";
import { Screen, Card, Primary, LangToggle, useLang, C } from "../ui";
import { ageInYears } from "../../lib/age";

// Shown right after profile creation: a warm, kid-friendly welcome with the
// child's name, Ghibli avatar, and age (whole completed years). Bilingual
// (English / Roman-Urdu) with a toggle; gender picks the term (beta / beti).
export default function WelcomeProfile({ profile, onContinue }) {
  const [lang, toggleLang] = useLang();
  const name = profile?.childName || (lang === "ur" ? "nanhe musafir" : "little traveller");
  const age = ageInYears(profile?.dob);
  const term = profile?.gender === "girl" ? "beti" : "beta";
  const img = profile?.avatarStatus === "ready" ? profile.avatarUrl : profile?.photoUrl;
  const pending = profile?.avatarStatus === "pending";
  const ur = lang === "ur";

  const yearsWord = age === 1 ? (ur ? "saal" : "year") : (ur ? "saal" : "years");

  return (
    <Screen narrow>
      <Card style={{ position: "relative", textAlign: "center" }}>
        <LangToggle lang={lang} onToggle={toggleLang} />

        <div style={{ fontFamily: "Fredoka, sans-serif", color: C.gold, fontSize: 18, marginBottom: 14, marginTop: 6 }}>
          MashaAllah! 🌙
        </div>

        <div style={avatarRing}>
          {img ? (
            <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            <div style={{ fontSize: 46 }}>🪄</div>
          )}
        </div>
        {pending && (
          <div style={{ color: C.dim, fontSize: 12.5, marginTop: 8 }}>
            {ur ? "✨ Aap ka avatar ban raha hai — bas thori dair mein." : "✨ Your avatar is still being painted — it'll appear soon."}
          </div>
        )}

        <h1 className="ipj-title-glow" style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 28, margin: "18px 0 4px", fontWeight: 600 }}>
          {ur ? `Khush aamdeed, ${name}!` : `Welcome, ${name}!`}
        </h1>

        {age != null && (
          <p style={{ color: C.ink, fontSize: 16, margin: "0 0 4px" }}>
            {ur ? (
              <>To aap <strong style={{ color: C.gold }}>{age}</strong> {yearsWord} ke hain — mashaAllah! 🎉</>
            ) : (
              <>You are <strong style={{ color: C.gold }}>{age}</strong> {yearsWord} old — mashaAllah! 🎉</>
            )}
          </p>
        )}
        <p style={{ color: C.dim, fontSize: 14.5, margin: "8px 0 22px", lineHeight: 1.5 }}>
          {ur
            ? `Apni lantern thaam lo, ${term}. Ambiya ki zindagiyon ka ek roshan safar aap ka muntazir hai. ✨`
            : `Take your lantern in hand, ${term}. A journey of light through the lives of the prophets awaits you. ✨`}
        </p>

        <Primary onClick={onContinue}>{ur ? "Aage chalein →" : "Let's continue →"}</Primary>
      </Card>
    </Screen>
  );
}

const avatarRing = {
  width: 132,
  height: 132,
  margin: "0 auto",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(245,196,81,.1)",
  border: `2px solid ${C.gold}`,
  boxShadow: "0 0 34px rgba(245,196,81,.45)",
  overflow: "hidden",
};
