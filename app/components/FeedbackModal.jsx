"use client";

import React, { useState } from "react";
import { Card, Primary, C } from "./ui";

// 1–3 star rating + optional written note. Used at the end of each stage and
// from the hamburger menu. `stage` is a label/id; `source` is "stage"|"menu".
export default function FeedbackModal({ title, subtitle, stage, source = "menu", onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!rating) return setErr("Please tap a star first. ⭐");
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, stage, source }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not send feedback.");
      }
      onDone?.();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🌟</div>
          <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, margin: "0 0 4px", fontSize: 20 }}>
            {title || "How was it?"}
          </h3>
          {subtitle && <p style={{ color: C.dim, fontSize: 13.5, margin: "0 0 12px" }}>{subtitle}</p>}

          <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "12px 0 4px" }}>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 44, lineHeight: 1, padding: 2,
                  color: (hover || rating) >= n ? C.gold : "rgba(255,255,255,.2)",
                  transition: "transform .1s, color .1s",
                  transform: (hover || rating) >= n ? "scale(1.08)" : "scale(1)",
                }}
              >
                ★
              </button>
            ))}
          </div>
          <div style={{ color: C.dim, fontSize: 12.5, marginBottom: 12, height: 16 }}>
            {["", "Okay", "Good", "Loved it!"][hover || rating] || ""}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anything you'd like to tell us? (optional)"
            rows={3}
            maxLength={1000}
            style={{
              width: "100%", background: "rgba(0,0,0,.28)", border: `1px solid ${C.line}`,
              borderRadius: 12, color: C.ink, fontSize: 15, fontFamily: "Nunito, sans-serif",
              padding: "10px 12px", outline: "none", resize: "vertical", marginBottom: 10,
            }}
          />
          {err && <div style={{ color: "#ffc9c9", fontSize: 13, marginBottom: 10 }}>{err}</div>}

          <Primary onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send feedback"}</Primary>
          <button onClick={onClose} style={skip}>{source === "stage" ? "Skip" : "Close"}</button>
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
const skip = {
  marginTop: 12, background: "none", border: "none", color: C.dim,
  fontFamily: "Nunito, sans-serif", fontSize: 14, cursor: "pointer",
};
