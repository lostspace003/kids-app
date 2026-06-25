"use client";

import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import getCroppedBlob from "../../lib/cropImage";
import { COUNTRIES } from "../../lib/countries";
import {
  Screen, Card, Title, Field, Primary, ErrorNote, inputStyle, C,
} from "../ui";

// Creates the child's profile. Email is passed in (the parent's account email)
// and shown locked. The uploaded photo is cropped, then on submit we POST the
// profile and poll until the Ghibli avatar is ready, then hand off to Welcome.
export default function ProfileSetup({ email, onDone }) {
  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");

  // photo / crop state
  const [rawSrc, setRawSrc] = useState(null); // object URL of the picked file
  const [showInfo, setShowInfo] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState("form"); // form | processing

  const onCropComplete = useCallback((_a, px) => setAreaPixels(px), []);

  function pickFile() {
    setShowInfo(true); // show the info popup BEFORE opening the picker
  }
  function acknowledgeInfo() {
    setShowInfo(false);
    fileRef.current?.click();
  }
  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      setErr("Please choose a PNG or JPG image.");
      return;
    }
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

  // Photo is optional — a default avatar is used when it's skipped.
  const valid = childName.trim() && dob && country && gender;

  async function submit() {
    if (!valid) return;
    setErr(""); setSubmitting(true); setPhase("processing");
    try {
      const fd = new FormData();
      fd.append("childName", childName.trim());
      fd.append("dob", dob);
      fd.append("country", country);
      fd.append("gender", gender);
      if (photoBlob) fd.append("photo", photoBlob, "photo.png");
      const res = await fetch("/api/profile", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not create profile.");

      // Only a real photo triggers avatar generation; default avatars are instant.
      let profile = data.profile;
      if (photoBlob) {
        for (let i = 0; i < 40 && profile.avatarStatus !== "ready"; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          const s = await fetch("/api/profile/status").then((r) => r.json()).catch(() => null);
          if (s?.ok) {
            profile = { ...profile, avatarStatus: s.avatarStatus, avatarUrl: s.avatarUrl };
            if (s.avatarStatus === "failed") break;
          }
        }
      }
      onDone?.(profile);
    } catch (e) {
      setErr(e.message);
      setPhase("form");
      setSubmitting(false);
    }
  }

  // ---- processing circle ----
  if (phase === "processing") {
    return (
      <Screen narrow>
        <Card style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={spinnerWrap}>
            <div className="ipj-spin" style={spinner} />
            <div style={{ fontSize: 30, position: "absolute" }}>🎨</div>
          </div>
          <h2 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, fontSize: 21, margin: "22px 0 6px" }}>
            Creating {childName.trim() || "your child"}'s profile…
          </h2>
          <p style={{ color: C.dim, fontSize: 14.5, margin: 0 }}>
            Painting a Ghibli-style avatar from the photo. This can take a little while.
          </p>
        </Card>
      </Screen>
    );
  }

  // ---- form ----
  return (
    <Screen narrow>
      <Card>
        <Title sub="Tell us about the young traveller">Create profile</Title>
        <ErrorNote>{err}</ErrorNote>

        <Field label="Child's name">
          <input style={inputStyle} value={childName} maxLength={40}
            onChange={(e) => setChildName(e.target.value)} placeholder="e.g. Hamza" />
        </Field>

        <Field label="Email" hint="Linked to your account — can't be changed.">
          <input style={{ ...inputStyle, opacity: 0.7, cursor: "not-allowed" }}
            value={email} disabled readOnly />
        </Field>

        <Field label="Date of birth">
          <input style={inputStyle} type="date" value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDob(e.target.value)} />
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
                  flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer",
                  fontFamily: "Fredoka, sans-serif", fontSize: 16,
                  border: `1px solid ${gender === v ? C.gold : C.line}`,
                  background: gender === v ? "rgba(245,196,81,.16)" : "rgba(0,0,0,.2)",
                  color: C.ink,
                }}>
                {emoji} {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Photo (optional)" hint="Skip it and a default avatar is used — you can add one later from the menu.">
          {photoPreview ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={photoPreview} alt="" style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover", border: `1px solid ${C.line}` }} />
              <button type="button" onClick={pickFile} style={ghostBtn}>Change photo</button>
            </div>
          ) : (
            <button type="button" onClick={pickFile} style={uploadBtn}>＋ Upload a photo (optional)</button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={onFile} style={{ display: "none" }} />
        </Field>

        <div style={{ marginTop: 8 }}>
          <Primary onClick={submit} disabled={!valid || submitting}>Create profile</Primary>
        </div>
      </Card>

      {/* Info popup shown before choosing a photo */}
      {showInfo && (
        <div style={overlay} onClick={() => setShowInfo(false)}>
          <Card style={{ maxWidth: 360 }} >
            <div onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: 34, textAlign: "center", marginBottom: 8 }}>🪄</div>
              <h3 style={{ fontFamily: "Fredoka, sans-serif", color: C.ink, textAlign: "center", margin: "0 0 8px" }}>
                About the photo
              </h3>
              <p style={{ color: C.dim, fontSize: 14.5, lineHeight: 1.5, textAlign: "center", margin: "0 0 18px" }}>
                When you add a photo, we'll create an <strong style={{ color: C.ink }}>animated, Studio&nbsp;Ghibli&ndash;style version</strong> of it as the avatar.
                It <strong style={{ color: C.ink }}>can't be changed afterwards</strong>, so pick a clear, friendly photo. 😊
              </p>
              <Primary onClick={acknowledgeInfo}>Choose photo</Primary>
            </div>
          </Card>
        </div>
      )}

      {/* Crop modal */}
      {cropping && (
        <div style={overlay}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ position: "relative", width: "100%", height: 320, background: "#000", borderRadius: 16, overflow: "hidden" }}>
              <Cropper image={rawSrc} crop={crop} zoom={zoom} aspect={1}
                cropShape="round" showGrid={false}
                onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <input type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: "100%", margin: "14px 0", accentColor: C.gold }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCropping(false)} style={{ ...ghostBtn, flex: 1 }}>Cancel</button>
              <div style={{ flex: 1 }}><Primary onClick={confirmCrop}>Use photo</Primary></div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

const overlay = {
  position: "fixed", inset: 0, zIndex: 60, background: "rgba(5,3,15,.72)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
  backdropFilter: "blur(3px)",
};
const uploadBtn = {
  width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer",
  border: `1px dashed ${C.line}`, background: "rgba(0,0,0,.2)", color: C.ink,
  fontFamily: "Fredoka, sans-serif", fontSize: 15,
};
const ghostBtn = {
  padding: "10px 16px", borderRadius: 999, cursor: "pointer",
  border: `1px solid ${C.line}`, background: "transparent", color: C.ink,
  fontFamily: "Fredoka, sans-serif", fontSize: 14,
};
const spinnerWrap = {
  position: "relative", width: 84, height: 84, margin: "0 auto",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const spinner = {
  position: "absolute", inset: 0, borderRadius: "50%",
  border: "5px solid rgba(245,196,81,.2)", borderTopColor: C.gold,
};
