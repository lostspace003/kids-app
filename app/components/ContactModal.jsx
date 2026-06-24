"use client";

import React from "react";
import { Card, Primary, C } from "./ui";

const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@gennoor.com";

export default function ContactModal({ onClose }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✉️</div>
          <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, margin: "0 0 6px", fontSize: 20 }}>Get in touch</h3>
          <p style={{ color: C.dim, fontSize: 14.5, margin: "0 0 16px", lineHeight: 1.5 }}>
            Questions, ideas, or anything at all? We'd love to hear from you.
          </p>
          <a href={`mailto:${EMAIL}`} style={emailPill}>{EMAIL}</a>
          <div style={{ marginTop: 18 }}>
            <Primary onClick={onClose}>Close</Primary>
          </div>
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
const emailPill = {
  display: "inline-block", fontFamily: "Fredoka, sans-serif", fontSize: 17, fontWeight: 600,
  color: C.gold, textDecoration: "none", padding: "10px 18px", borderRadius: 999,
  border: `1px solid ${C.line}`, background: "rgba(245,196,81,.1)",
};
