"use client";

import React, { useState } from "react";
import { Card, Field, Primary, ErrorNote, inputStyle, C } from "../ui";
import { COUNTRIES } from "../../lib/countries";

// Edit the editable profile fields. Email and PHOTO/avatar are locked — they
// are shown read-only here and never sent.
export default function UpdateProfileModal({ profile, email, onClose, onSaved }) {
  const [childName, setChildName] = useState(profile?.childName || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [gender, setGender] = useState(profile?.gender || "boy");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, dob, country, gender }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not save changes.");
      onSaved?.(d.profile);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 400, maxHeight: "92dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <img
              src={profile?.avatarUrl || profile?.photoUrl || "/hamza.webp"}
              alt=""
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.gold}` }}
            />
            <div>
              <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, margin: 0, fontSize: 19 }}>Update profile</h3>
              <div style={{ color: C.dim, fontSize: 12.5 }}>Photo &amp; email can't be changed.</div>
            </div>
          </div>
          <ErrorNote>{err}</ErrorNote>

          <Field label="Child's name">
            <input style={inputStyle} value={childName} maxLength={40} onChange={(e) => setChildName(e.target.value)} />
          </Field>
          <Field label="Email" hint="Locked to your account.">
            <input style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} value={email} disabled readOnly />
          </Field>
          <Field label="Date of birth">
            <input style={inputStyle} type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} />
          </Field>
          <Field label="Country">
            <select style={inputStyle} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="" disabled>Choose a country…</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Gender">
            <div style={{ display: "flex", gap: 10 }}>
              {[["boy", "Boy", "👦"], ["girl", "Girl", "👧"]].map(([v, label, emoji]) => (
                <button key={v} type="button" onClick={() => setGender(v)}
                  style={{
                    flex: 1, padding: "11px", borderRadius: 12, cursor: "pointer",
                    fontFamily: "Fredoka, sans-serif", fontSize: 15, color: C.ink,
                    border: `1px solid ${gender === v ? C.gold : C.line}`,
                    background: gender === v ? "rgba(245,196,81,.16)" : "rgba(0,0,0,.2)",
                  }}>
                  {emoji} {label}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ marginTop: 6 }}>
            <Primary onClick={save} disabled={busy || !childName.trim() || !dob || !country}>
              {busy ? "Saving…" : "Save changes"}
            </Primary>
          </div>
          <button onClick={onClose} style={cancel}>Cancel</button>
        </Card>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, zIndex: 120, background: "rgba(5,3,15,.74)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
  backdropFilter: "blur(3px)",
};
const cancel = {
  width: "100%", marginTop: 10, background: "none", border: "none", color: C.dim,
  fontFamily: "Nunito, sans-serif", fontSize: 14, cursor: "pointer",
};
