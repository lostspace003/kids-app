"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Cropper from "react-easy-crop";
import getCroppedBlob from "../../lib/cropImage";
import { Card, Field, Primary, ErrorNote, inputStyle, C } from "../ui";
import { COUNTRIES } from "../../lib/countries";

// Edit the editable profile fields. Email is always locked. The photo is
// locked ONCE a real photo has been uploaded; until then (default avatar) the
// parent can add a photo here, which generates the Ghibli avatar and locks it.
export default function UpdateProfileModal({ profile, email, onClose, onSaved }) {
  const [childName, setChildName] = useState(profile?.childName || "");
  const [dob, setDob] = useState(profile?.dob || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [gender, setGender] = useState(profile?.gender || "boy");
  const [handle, setHandle] = useState(profile?.handle || "");
  // Leaderboard visibility is PIN-protected (separate from the main Save).
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(!profile?.lbOptOut);
  const [lbPinSet, setLbPinSet] = useState(!!profile?.lbPinSet);
  const [lbFlow, setLbFlow] = useState(null); // null | "confirm" | "reset"
  const [lbPin, setLbPin] = useState("");
  const [lbNewPin, setLbNewPin] = useState("");
  const [lbOtp, setLbOtp] = useState("");
  const [lbResetSent, setLbResetSent] = useState(false);
  const [lbBusy, setLbBusy] = useState(false);
  const [lbErr, setLbErr] = useState("");
  const [lbMsg, setLbMsg] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // The pending target visibility (opposite of current) while confirming.
  const pendingOptOut = showOnLeaderboard; // turning OFF if currently shown, and vice-versa

  async function postLb(payload) {
    const r = await fetch("/api/profile/leaderboard-pin", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not update.");
    return d;
  }
  function resetLbUi() { setLbFlow(null); setLbPin(""); setLbNewPin(""); setLbOtp(""); setLbResetSent(false); setLbErr(""); setLbMsg(""); }
  async function applyLbChange() {
    setLbBusy(true); setLbErr("");
    try {
      const payload = { action: "apply", lbOptOut: !showOnLeaderboard };
      if (lbPinSet) payload.pin = lbPin; else payload.newPin = lbNewPin;
      const d = await postLb(payload);
      setShowOnLeaderboard(!d.profile.lbOptOut);
      setLbPinSet(!!d.profile.lbPinSet);
      resetLbUi(); setLbMsg("Saved.");
    } catch (e) { setLbErr(e.message); } finally { setLbBusy(false); }
  }
  async function sendLbReset() {
    setLbBusy(true); setLbErr("");
    try { await postLb({ action: "reset-start" }); setLbResetSent(true); setLbMsg("Code sent to your email."); }
    catch (e) { setLbErr(e.message); } finally { setLbBusy(false); }
  }
  async function verifyLbReset() {
    setLbBusy(true); setLbErr("");
    try {
      const d = await postLb({ action: "reset-verify", otp: lbOtp, newPin: lbNewPin, lbOptOut: !showOnLeaderboard });
      setShowOnLeaderboard(!d.profile.lbOptOut);
      setLbPinSet(true); resetLbUi(); setLbMsg("PIN reset & saved.");
    } catch (e) { setLbErr(e.message); } finally { setLbBusy(false); }
  }
  // handleStatus: "" | "checking" | "ok" | "taken" | "invalid"
  const [handleStatus, setHandleStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const photoLocked = !!profile?.photoLocked;

  // Fetch fresh handle suggestions (Islamic-history names + number).
  const loadSuggestions = useCallback(() => {
    fetch("/api/profile/handle")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSuggestions(d.suggestions || []))
      .catch(() => {});
  }, []);
  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  // Live availability check (debounced) as the parent types their own handle.
  useEffect(() => {
    const h = handle.trim();
    if (!h || h === (profile?.handle || "")) { setHandleStatus(""); return; }
    if (h.length < 3) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    const t = setTimeout(() => {
      fetch("/api/profile/handle?check=" + encodeURIComponent(h))
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d || !d.valid) return setHandleStatus("invalid");
          setHandleStatus(d.available ? "ok" : "taken");
        })
        .catch(() => setHandleStatus(""));
    }, 400);
    return () => clearTimeout(t);
  }, [handle, profile]);

  // optional photo (only when not yet locked)
  const [rawSrc, setRawSrc] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);
  const onCropComplete = useCallback((_a, px) => setAreaPixels(px), []);

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return setErr("Please choose a PNG or JPG image.");
    setErr("");
    setRawSrc(URL.createObjectURL(f));
    setCropping(true);
  }
  async function confirmCrop() {
    if (!rawSrc || !areaPixels) return;
    const blob = await getCroppedBlob(rawSrc, areaPixels);
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
    setCropping(false);
  }

  async function save() {
    setBusy(true); setErr("");
    try {
      // 1) static fields
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, dob, country, gender, handle }),
      });
      let d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Could not save changes.");
      let updated = d.profile;

      // 2) optional photo upload (only if added and not already locked)
      if (photoBlob && !photoLocked) {
        setMsg("Creating avatar…");
        const fd = new FormData();
        fd.append("photo", photoBlob, "photo.png");
        const pr = await fetch("/api/profile/photo", { method: "POST", body: fd });
        const pd = await pr.json().catch(() => ({}));
        if (!pr.ok) throw new Error(pd.error || "Could not upload photo.");
        updated = pd.profile;
        // Wait for the Ghibli avatar so we hand back the painted image, not the
        // raw photo (which is only the pending placeholder).
        for (let i = 0; i < 40 && updated.avatarStatus !== "ready"; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          const s = await fetch("/api/profile/status").then((r) => r.json()).catch(() => null);
          if (s?.ok) {
            updated = { ...updated, avatarStatus: s.avatarStatus, avatarUrl: s.avatarUrl };
            if (s.avatarStatus === "failed") break;
          }
        }
      }
      onSaved?.(updated);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
      setMsg("");
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 400, maxHeight: "92dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <img src={photoPreview || profile?.avatarUrl || profile?.defaultAvatar || "/huzaifa.webp"} alt=""
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${C.gold}` }} />
            <div>
              <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, margin: 0, fontSize: 19 }}>Update profile</h3>
              <div style={{ color: C.dim, fontSize: 12.5 }}>Email can't be changed.</div>
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

          <Field label="Leaderboard handle" hint="Shown on the leaderboard (lowercase). Real name & photo stay private. Tap a suggestion or type your own.">
            <input
              style={{
                ...inputStyle,
                borderColor: handleStatus === "taken" || handleStatus === "invalid" ? "#e08a8a"
                  : handleStatus === "ok" ? "#7fe0c0" : inputStyle.borderColor,
              }}
              value={handle}
              maxLength={20}
              placeholder="e.g. khwarizmi47"
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            />
            <div style={{ minHeight: 16, marginTop: 5, fontSize: 12 }}>
              {handleStatus === "checking" && <span style={{ color: C.dim }}>Checking…</span>}
              {handleStatus === "ok" && <span style={{ color: "#7fe0c0" }}>✓ Available</span>}
              {handleStatus === "taken" && <span style={{ color: "#e08a8a" }}>✗ Taken — try another or pick a suggestion below</span>}
              {handleStatus === "invalid" && <span style={{ color: "#e08a8a" }}>3–20 lowercase letters or numbers</span>}
            </div>
            {/* Auto-suggestions: tap an available one; taken ones are greyed out. */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
              {suggestions.map((s) => (
                <button
                  key={s.handle}
                  type="button"
                  disabled={!s.available}
                  onClick={() => s.available && setHandle(s.handle)}
                  title={s.available ? "Use this handle" : "Already taken"}
                  style={{
                    cursor: s.available ? "pointer" : "not-allowed",
                    fontFamily: "Fredoka, sans-serif", fontSize: 12.5,
                    padding: "5px 10px", borderRadius: 999,
                    border: `1px solid ${s.available ? C.line : "rgba(255,255,255,.08)"}`,
                    background: s.available ? "rgba(245,196,81,.10)" : "rgba(255,255,255,.03)",
                    color: s.available ? C.ink : "rgba(244,238,222,.35)",
                    textDecoration: s.available ? "none" : "line-through",
                  }}
                >
                  {s.handle}
                </button>
              ))}
              <button type="button" onClick={loadSuggestions} title="More suggestions"
                style={{ cursor: "pointer", fontFamily: "Fredoka, sans-serif", fontSize: 12.5, padding: "5px 10px", borderRadius: 999, border: `1px solid ${C.line}`, background: "transparent", color: C.gold }}>
                🎲 more
              </button>
            </div>
          </Field>

          <Field label="Leaderboard">
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              borderRadius: 12, padding: "11px 14px", border: `1px solid ${showOnLeaderboard ? C.gold : C.line}`,
              background: showOnLeaderboard ? "rgba(245,196,81,.10)" : "rgba(0,0,0,.2)", color: C.ink,
              fontFamily: "Fredoka, sans-serif", fontSize: 14.5,
            }}>
              <span>🏆 Show on leaderboard {lbPinSet && <span style={{ fontSize: 12, color: C.dim }}>🔒</span>}</span>
              <span style={{ fontSize: 13, color: showOnLeaderboard ? C.gold : C.dim }}>{showOnLeaderboard ? "On" : "Off"}</span>
            </div>
            <div style={{ color: C.dim, fontSize: 12, margin: "5px 0 8px" }}>
              Only a pseudonymous handle &amp; score appear — never the real name or photo.
              {lbPinSet ? " Changing this needs your 4-digit PIN." : " A 4-digit PIN will protect this setting."}
            </div>

            {lbMsg && <div style={{ color: "#7fe0c0", fontSize: 12.5, marginBottom: 6 }}>{lbMsg}</div>}
            {lbErr && <div style={{ color: "#e08a8a", fontSize: 12.5, marginBottom: 6 }}>{lbErr}</div>}

            {lbFlow == null && (
              <button type="button" onClick={() => { resetLbUi(); setLbFlow("confirm"); }} style={ghostBtn}>
                {showOnLeaderboard ? "Hide from leaderboard" : "Show on leaderboard"}
              </button>
            )}

            {lbFlow === "confirm" && (
              <div style={lbPanel}>
                <div style={{ fontSize: 13, color: C.dim, marginBottom: 8 }}>
                  {lbPinSet ? "Enter your 4-digit PIN to " : "Create a 4-digit PIN to "}
                  {showOnLeaderboard ? "hide" : "show"} your child.
                </div>
                <input
                  style={{ ...inputStyle, letterSpacing: 8, textAlign: "center" }}
                  inputMode="numeric" maxLength={4} placeholder="••••"
                  value={lbPinSet ? lbPin : lbNewPin}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); lbPinSet ? setLbPin(v) : setLbNewPin(v); }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button type="button" onClick={resetLbUi} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
                  <div style={{ flex: 1 }}>
                    <Primary onClick={applyLbChange} disabled={lbBusy || (lbPinSet ? lbPin.length !== 4 : lbNewPin.length !== 4)}>
                      {lbBusy ? "Saving…" : "Confirm"}
                    </Primary>
                  </div>
                </div>
                {lbPinSet && (
                  <button type="button" onClick={() => { resetLbUi(); setLbFlow("reset"); }} style={{ ...linkBtn, marginTop: 10 }}>
                    Forgot PIN?
                  </button>
                )}
              </div>
            )}

            {lbFlow === "reset" && (
              <div style={lbPanel}>
                {!lbResetSent ? (
                  <>
                    <div style={{ fontSize: 13, color: C.dim, marginBottom: 8 }}>We'll email a 6-digit code to {email}.</div>
                    <Primary onClick={sendLbReset} disabled={lbBusy}>{lbBusy ? "Sending…" : "Send reset code"}</Primary>
                  </>
                ) : (
                  <>
                    <input style={{ ...inputStyle, letterSpacing: 6, textAlign: "center", marginBottom: 8 }}
                      inputMode="numeric" maxLength={6} placeholder="6-digit code"
                      value={lbOtp} onChange={(e) => setLbOtp(e.target.value.replace(/\D/g, ""))} />
                    <input style={{ ...inputStyle, letterSpacing: 8, textAlign: "center" }}
                      inputMode="numeric" maxLength={4} placeholder="new 4-digit PIN"
                      value={lbNewPin} onChange={(e) => setLbNewPin(e.target.value.replace(/\D/g, ""))} />
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button type="button" onClick={resetLbUi} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
                      <div style={{ flex: 1 }}>
                        <Primary onClick={verifyLbReset} disabled={lbBusy || lbOtp.length !== 6 || lbNewPin.length !== 4}>
                          {lbBusy ? "Saving…" : "Reset & save"}
                        </Primary>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Field>

          {/* Photo: locked once a real one exists; otherwise optional upload. */}
          <Field label="Photo">
            {photoLocked ? (
              <div style={{ color: C.dim, fontSize: 13.5 }}>🔒 Photo is set and can't be changed.</div>
            ) : (
              <>
                <div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5, marginBottom: 8 }}>
                  Currently using a default avatar. Add a photo and we'll create an <strong style={{ color: C.ink }}>animated Ghibli version</strong> — this <strong style={{ color: C.ink }}>locks the photo</strong> afterwards.
                </div>
                {photoPreview ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={photoPreview} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", border: `1px solid ${C.line}` }} />
                    <button type="button" onClick={() => fileRef.current?.click()} style={ghostBtn}>Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} style={uploadBtn}>＋ Add a photo</button>
                )}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} style={{ display: "none" }} />
              </>
            )}
          </Field>

          <div style={{ marginTop: 6 }}>
            <Primary onClick={save} disabled={busy || !childName.trim() || !dob || !country || handleStatus === "taken" || handleStatus === "invalid" || handleStatus === "checking"}>
              {msg || (busy ? "Saving…" : photoBlob ? "Save & create avatar" : "Save changes")}
            </Primary>
          </div>
          <button onClick={onClose} style={cancel}>Cancel</button>
        </Card>
      </div>

      {/* crop modal */}
      {cropping && (
        <div style={overlay} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ position: "relative", width: "100%", height: 320, background: "#000", borderRadius: 16, overflow: "hidden" }}>
              <Cropper image={rawSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: "100%", margin: "14px 0", accentColor: C.gold }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCropping(false)} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
              <div style={{ flex: 1 }}><Primary onClick={confirmCrop}>Use photo</Primary></div>
            </div>
          </div>
        </div>
      )}
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
const ghostBtn = {
  padding: "10px 16px", borderRadius: 999, cursor: "pointer",
  border: `1px solid ${C.line}`, background: "transparent", color: C.ink,
  fontFamily: "Fredoka, sans-serif", fontSize: 14,
};
const uploadBtn = {
  width: "100%", padding: "12px", borderRadius: 12, cursor: "pointer",
  border: `1px dashed ${C.line}`, background: "rgba(0,0,0,.2)", color: C.ink,
  fontFamily: "Fredoka, sans-serif", fontSize: 15,
};
const lbPanel = {
  marginTop: 4, padding: 12, borderRadius: 12,
  border: `1px solid ${C.line}`, background: "rgba(0,0,0,.22)",
};
const linkBtn = {
  background: "none", border: "none", color: C.gold, cursor: "pointer",
  fontFamily: "Nunito, sans-serif", fontSize: 13, padding: 0,
};
