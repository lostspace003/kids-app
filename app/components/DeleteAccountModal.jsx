"use client";

import React, { useState } from "react";
import { Card, Field, ErrorNote, inputStyle, C } from "./ui";

// Irreversible account deletion (App Store / Play requirement). Confirms with
// the account password AND a typed "DELETE" so it can't happen by accident.
export default function DeleteAccountModal({ childName, onClose, onDeleted }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const ready = password && confirm.trim().toUpperCase() === "DELETE";

  async function remove() {
    setErr("");
    if (!ready) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not delete the account.");
      onDeleted?.();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={busy ? undefined : onClose}>
      <div style={{ width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <h3 style={{ fontFamily: "Fredoka, sans-serif", color: "#ff8d8d", margin: "0 0 6px", fontSize: 20, textAlign: "center" }}>
            Delete account
          </h3>
          <p style={{ color: C.dim, fontSize: 13.5, lineHeight: 1.6, textAlign: "center", margin: "0 0 14px" }}>
            This permanently deletes {childName ? <b style={{ color: C.ink }}>{childName}</b> : "your child"}&rsquo;s
            profile, photo, avatar, and all learning progress, plus this parent
            account. <b style={{ color: "#ffb3b3" }}>This cannot be undone.</b>
          </p>
          <ErrorNote>{err}</ErrorNote>
          <Field label="Confirm your password">
            <input style={inputStyle} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label={'Type "DELETE" to confirm'}>
            <input style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
          </Field>
          <button onClick={remove} disabled={busy || !ready} style={{ ...danger, opacity: busy || !ready ? 0.55 : 1, cursor: busy || !ready ? "default" : "pointer" }}>
            {busy ? "Deleting…" : "Permanently delete account"}
          </button>
          <button onClick={onClose} disabled={busy} style={cancel}>Cancel</button>
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
const danger = {
  width: "100%", marginTop: 4, padding: "12px 14px", borderRadius: 12,
  border: "1px solid rgba(255,90,90,.5)", background: "rgba(255,70,70,.16)",
  color: "#ffb3b3", fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 15.5,
};
const cancel = {
  width: "100%", marginTop: 10, background: "none", border: "none", color: C.dim,
  fontFamily: "Nunito, sans-serif", fontSize: 14, cursor: "pointer",
};
