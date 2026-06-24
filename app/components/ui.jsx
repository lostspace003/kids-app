"use client";

import React from "react";

// Shared palette + primitives so the auth / profile / welcome screens all
// match the journey's warm dark-and-gold aesthetic.
export const C = {
  bg: "radial-gradient(1200px 800px at 50% 0%, #1b1340 0%, #0c0820 55%, #070512 100%)",
  gold: "#f5c451",
  goldGrad: "linear-gradient(135deg,#ffd56b,#f5b836)",
  ink: "#f4eede",
  dim: "rgba(244,238,222,.66)",
  panel: "rgba(255,255,255,.04)",
  line: "rgba(245,196,81,.22)",
};

export function Screen({ children, narrow = false }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 18px",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: narrow ? 400 : 460, animation: "ipjRise .5s ease both" }}>
        {children}
      </div>
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: "rgba(20,14,46,.72)",
        border: `1px solid ${C.line}`,
        borderRadius: 22,
        padding: "26px 22px",
        boxShadow: "0 18px 60px rgba(0,0,0,.45)",
        backdropFilter: "blur(6px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children, sub }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 18 }}>
      <div style={{ fontSize: 38, marginBottom: 6 }}>🏮</div>
      <h1 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 24, margin: 0, fontWeight: 600 }}>
        {children}
      </h1>
      {sub && <p style={{ color: C.dim, fontSize: 14.5, margin: "6px 0 0" }}>{sub}</p>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", color: C.ink, fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ display: "block", color: C.dim, fontSize: 12, marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

export const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,.28)",
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  color: C.ink,
  fontSize: 16, // 16px avoids iOS zoom-on-focus
  fontFamily: "Nunito, sans-serif",
  padding: "12px 14px",
  outline: "none",
};

export function Primary({ children, disabled, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="ipj-primary"
      style={{
        width: "100%",
        fontFamily: "Fredoka, sans-serif",
        fontSize: 17,
        fontWeight: 600,
        color: "#3a2606",
        background: C.goldGrad,
        border: "none",
        borderRadius: 999,
        padding: "13px 22px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function LinkBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: C.gold,
        fontFamily: "Nunito, sans-serif",
        fontSize: 14.5,
        fontWeight: 700,
        cursor: "pointer",
        padding: 4,
      }}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div
      style={{
        background: "rgba(255,90,90,.12)",
        border: "1px solid rgba(255,120,120,.4)",
        color: "#ffc9c9",
        borderRadius: 12,
        padding: "10px 12px",
        fontSize: 14,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}
