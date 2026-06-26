"use client";

import React, { useState } from "react";
import { C } from "./ui";

// Fixed hamburger button + slide-in drawer. Items: update profile, feedback,
// change password, contact, and login/logout (contextual on auth state).
export default function HamburgerMenu({
  authed, childName, avatarUrl,
  onUpdate, onFeedback, onChangePassword, onContact, onLogin, onLogout, onLeaderboard,
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const act = (fn) => () => { close(); fn?.(); };

  const items = [];
  if (authed) {
    items.push(["🏆", "Leaderboard", act(onLeaderboard)]);
    items.push(["🧒", "Update profile", act(onUpdate)]);
    items.push(["⭐", "Give feedback", act(onFeedback)]);
    items.push(["🔑", "Change password", act(onChangePassword)]);
  }
  items.push(["✉️", "Contact", act(onContact)]);
  items.push(authed ? ["🚪", "Log out", act(onLogout)] : ["➡️", "Log in", act(onLogin)]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Menu" style={fab}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>☰</span>
      </button>

      {open && (
        <div style={scrim} onClick={close}>
          <div style={drawer} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 4px 18px" }}>
              {authed && (
                <img src={avatarUrl || "/hamza.webp"} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.gold}` }} />
              )}
              <div>
                <div style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontWeight: 600, fontSize: 17 }}>
                  {authed ? (childName || "Menu") : "Menu"}
                </div>
                <div style={{ color: C.dim, fontSize: 12.5 }}>Safar-e-Anbiya</div>
              </div>
              <button onClick={close} aria-label="Close" style={closeBtn}>✕</button>
            </div>

            {items.map(([icon, label, on], i) => (
              <button key={i} onClick={on} style={row}>
                <span style={{ fontSize: 19, width: 26 }}>{icon}</span>
                <span style={{ fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 15.5 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

const fab = {
  position: "fixed", bottom: 14, left: 12, zIndex: 40,
  width: 44, height: 44, borderRadius: "50%",
  border: `1px solid ${C.line}`, background: "rgba(10,7,26,.62)", color: C.ink,
  cursor: "pointer", backdropFilter: "blur(6px)",
  boxShadow: "0 6px 18px rgba(0,0,0,.4)",
};
const scrim = {
  position: "fixed", inset: 0, zIndex: 130, background: "rgba(5,3,15,.6)",
  display: "flex", justifyContent: "flex-start",
};
const drawer = {
  width: "min(300px, 84vw)", height: "100%", overflowY: "auto",
  background: "linear-gradient(180deg,#160e2e,#0c0820)",
  borderRight: `1px solid ${C.line}`, padding: "18px 14px",
  animation: "ipjRise .25s ease both",
};
const row = {
  display: "flex", alignItems: "center", gap: 12, width: "100%",
  padding: "13px 12px", marginBottom: 6, borderRadius: 12, cursor: "pointer",
  border: `1px solid ${C.line}`, background: "rgba(255,255,255,.03)", color: C.ink,
  textAlign: "left",
};
const closeBtn = {
  marginLeft: "auto", width: 32, height: 32, borderRadius: "50%",
  border: `1px solid ${C.line}`, background: "transparent", color: C.dim, cursor: "pointer",
};
