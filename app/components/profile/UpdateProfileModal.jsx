"use client";

import React, { useState, useCallback, useRef } from "react";
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
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const photoLocked = !!profile?.photoLocked;

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
        body: JSON.stringify({ childName, dob, country, gender }),
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
            <Primary onClick={save} disabled={busy || !childName.trim() || !dob || !country}>
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
