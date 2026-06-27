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

// Shared language state for the pre-journey screens. Uses the SAME localStorage
// key as the journey ("ipj_lang_v2"), so the choice carries through. "ur" =
// Roman-Urdu transliteration (default), "en" = English.
export function useLang() {
  const [lang, setLang] = React.useState("ur");
  React.useEffect(() => {
    try { const s = localStorage.getItem("ipj_lang_v2"); if (s) setLang(s); } catch {}
  }, []);
  const toggle = () =>
    setLang((l) => {
      const n = l === "ur" ? "en" : "ur";
      try { localStorage.setItem("ipj_lang_v2", n); } catch {}
      return n;
    });
  return [lang, toggle];
}

export function LangToggle({ lang, onToggle, style }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: "absolute", top: 10, right: 10, zIndex: 5,
        border: `1px solid ${C.line}`, background: "rgba(245,196,81,.08)", color: C.ink,
        borderRadius: 40, padding: "6px 12px", cursor: "pointer",
        fontFamily: "Fredoka, sans-serif", fontWeight: 500, fontSize: 13,
        ...style,
      }}
    >
      🌐 {lang === "ur" ? "English" : "اردو"}
    </button>
  );
}

export function Screen({ children, narrow = false }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 18px 28px",
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
      {/* The Safar-e-Anbiya lantern emblem (brand logo), not a generic emoji. */}
      <img src="/brand/svg/emblem-glow.svg" alt="" width={54} height={54} style={{ display: "block", margin: "0 auto 6px" }} />
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

// Password field with a show/hide eye toggle. Drop-in replacement for a bare
// <input type="password" …>; forwards any extra props (value, onChange, etc.).
export function PasswordInput({
  value,
  onChange,
  autoComplete = "current-password",
  placeholder = "••••••••",
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        {...rest}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingRight: 46 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        title={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute", top: 0, right: 0, height: "100%", width: 44,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer",
          color: C.dim, fontSize: 17, padding: 0,
        }}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

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
