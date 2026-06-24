"use client";

import React, { useState } from "react";
import { Card, Field, Primary, ErrorNote, inputStyle, C } from "./ui";

export default function ChangePasswordModal({ onClose, onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function save() {
    setErr("");
    if (next.length < 8) return setErr("New password must be at least 8 characters.");
    if (next !== confirm) return setErr("New passwords don't match.");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not change password.");
      setDone(true);
      setTimeout(() => onDone?.(), 1200);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, margin: "0 0 14px", fontSize: 20, textAlign: "center" }}>
            Change password
          </h3>
          {done ? (
            <div style={{ textAlign: "center", color: "#bff0e2", padding: "16px 0" }}>
              ✅ Password updated.
            </div>
          ) : (
            <>
              <ErrorNote>{err}</ErrorNote>
              <Field label="Current password">
                <input style={inputStyle} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </Field>
              <Field label="New password" hint="At least 8 characters.">
                <input style={inputStyle} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
              </Field>
              <Field label="Confirm new password">
                <input style={inputStyle} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </Field>
              <Primary onClick={save} disabled={busy || !current || !next}>{busy ? "Saving…" : "Update password"}</Primary>
              <button onClick={onClose} style={cancel}>Cancel</button>
            </>
          )}
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
