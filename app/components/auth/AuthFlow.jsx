"use client";

import React, { useState } from "react";
import {
  Screen, Card, Title, Field, Primary, LinkBtn, ErrorNote, inputStyle, C,
} from "../ui";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// mode: "login" | "signup" | "otp". onAuthed({ hasProfile }) fires on success.
// onGuest (optional) lets a visitor preview one story before signing in.
export default function AuthFlow({ onAuthed, onGuest }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  function switchMode(next) {
    setErr(""); setNotice(""); setCode(""); setMode(next);
  }

  async function doLogin(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { res, data } = await postJson("/api/auth/login", { email, password });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Login failed.");
    onAuthed({ hasProfile: data.hasProfile });
  }

  async function doSignupStart(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { res, data } = await postJson("/api/auth/signup/start", { email, password });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Could not start sign up.");
    setNotice(`We've emailed a 6-digit code to ${email}.`);
    setMode("otp");
  }

  async function doVerify(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { res, data } = await postJson("/api/auth/signup/verify", { email, code });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Verification failed.");
    onAuthed({ hasProfile: data.hasProfile });
  }

  async function resend() {
    setErr(""); setBusy(true);
    const { res, data } = await postJson("/api/auth/signup/start", { email, password });
    setBusy(false);
    if (!res.ok) return setErr(data.error || "Could not resend.");
    setNotice(`A new code was sent to ${email}.`);
  }

  // ---- OTP entry screen ----
  if (mode === "otp") {
    return (
      <Screen narrow>
        <Card>
          <Title sub="Enter the code we emailed you">Verify your email</Title>
          {notice && (
            <div style={noticeStyle}>{notice}</div>
          )}
          <ErrorNote>{err}</ErrorNote>
          <form onSubmit={doVerify}>
            <Field label="6-digit code">
              <input
                style={{ ...inputStyle, letterSpacing: 8, textAlign: "center", fontSize: 22 }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="······"
              />
            </Field>
            <Primary type="submit" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify & continue"}
            </Primary>
          </form>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <LinkBtn onClick={resend}>Resend code</LinkBtn>
            <span style={{ color: C.dim, margin: "0 6px" }}>·</span>
            <LinkBtn onClick={() => switchMode("signup")}>Change email</LinkBtn>
          </div>
        </Card>
      </Screen>
    );
  }

  // ---- Login / Signup screen ----
  const isSignup = mode === "signup";
  return (
    <Screen narrow>
      <Card>
        <Title sub={isSignup ? "Create a parent account to begin" : "Welcome back"}>
          {isSignup ? "Create account" : "Log in"}
        </Title>
        {notice && <div style={noticeStyle}>{notice}</div>}
        <ErrorNote>{err}</ErrorNote>
        <form onSubmit={isSignup ? doSignupStart : doLogin}>
          <Field label="Parent's email" hint={isSignup ? "We'll send a verification code here." : undefined}>
            <input
              style={inputStyle}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" hint={isSignup ? "At least 8 characters." : undefined}>
            <input
              style={inputStyle}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Primary type="submit" disabled={busy || !email || password.length < (isSignup ? 8 : 1)}>
            {busy ? "Please wait…" : isSignup ? "Send code" : "Log in"}
          </Primary>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, color: C.dim, fontSize: 14 }}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <LinkBtn onClick={() => switchMode(isSignup ? "login" : "signup")}>
            {isSignup ? "Log in" : "Create one"}
          </LinkBtn>
        </div>

        {onGuest && (
          <>
            <div style={dividerStyle}><span style={dividerTextStyle}>or</span></div>
            <button type="button" onClick={onGuest} style={guestBtnStyle}>
              👀 Just see a story first
            </button>
            <div style={{ textAlign: "center", marginTop: 8, color: C.dim, fontSize: 12.5 }}>
              Try Prophet 1 free — log in to continue and earn Noor.
            </div>
          </>
        )}
      </Card>
    </Screen>
  );
}

const noticeStyle = {
  background: "rgba(127,224,192,.12)",
  border: "1px solid rgba(127,224,192,.4)",
  color: "#bff0e2",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  marginBottom: 14,
};

const dividerStyle = {
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "18px 0 12px", borderTop: "1px solid rgba(245,196,81,.18)", position: "relative",
};
const dividerTextStyle = {
  position: "absolute", top: -10, background: C.bg || "#140e2e",
  padding: "0 10px", color: C.dim, fontSize: 12, letterSpacing: 1,
};
const guestBtnStyle = {
  width: "100%", cursor: "pointer", borderRadius: 14, padding: "13px",
  fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 16,
  color: "#f4eede", background: "rgba(245,196,81,.10)",
  border: "1px solid rgba(245,196,81,.4)",
};
