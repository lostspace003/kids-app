"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SafarSplash from "./SafarSplash";
import AboutIntro from "./AboutIntro";
import BrandMark from "./BrandMark";
import AuthFlow from "./auth/AuthFlow";
import ProfileSetup from "./profile/ProfileSetup";
import WelcomeProfile from "./profile/WelcomeProfile";
import HamburgerMenu from "./HamburgerMenu";
import FeedbackModal from "./FeedbackModal";
import ContactModal from "./ContactModal";
import ChangePasswordModal from "./ChangePasswordModal";
import UpdateProfileModal from "./profile/UpdateProfileModal";
import { C } from "./ui";

// The journey itself is browser-only (Web Audio, randomised fields).
const ProphetsJourney = dynamic(() => import("./ProphetsJourney"), { ssr: false });

// Stages: splash -> (auth | profile | welcome | journey)
export default function AuthGate() {
  const [me, setMe] = useState(undefined); // undefined=loading, else {user, profile}
  const [stage, setStage] = useState("splash");
  const [profile, setProfile] = useState(null);
  const [pendingEnter, setPendingEnter] = useState(false); // "enter app" tapped before session loaded

  // Journey chrome overlays: "none" | "update" | "feedback" | "contact" | "changepw"
  const [overlay, setOverlay] = useState("none");
  const [stageFeedback, setStageFeedback] = useState(null); // { stage } when a stage just ended
  // Bumped to remount the journey after a profile edit so name/gender/avatar refresh.
  const [journeyKey, setJourneyKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe({ user: d.user, profile: d.profile }))
      .catch(() => setMe({ user: null, profile: null }));
  }, []);

  // Route into the app from the About page, based on the loaded session.
  function routeIn() {
    if (!me.user) setStage("auth");
    else if (!me.profile) setStage("profile");
    else { setProfile(me.profile); setStage("journey"); }
  }
  function enterApp() {
    if (me === undefined) { setPendingEnter(true); return; } // wait for session
    routeIn();
  }
  // If "enter" was tapped before the session finished loading, route once ready.
  useEffect(() => {
    if (pendingEnter && me !== undefined) { setPendingEnter(false); routeIn(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEnter, me]);

  async function onAuthed({ hasProfile }) {
    const d = await fetch("/api/auth/me").then((r) => r.json()).catch(() => null);
    if (d?.user) setMe({ user: d.user, profile: d.profile });
    if (hasProfile && d?.profile) {
      setProfile(d.profile);
      setStage("journey");
    } else {
      setStage("profile");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setProfile(null);
    setMe({ user: null, profile: null });
    setOverlay("none");
    setStage("auth");
  }

  // Fired by the journey when a prophet's stage ends → ask for feedback.
  function handleStageComplete(prophetId) {
    setTimeout(() => setStageFeedback({ stage: String(prophetId) }), 1700);
  }

  function onProfileSaved(updated) {
    setProfile(updated);
    setMe((m) => (m ? { ...m, profile: updated } : m));
    setOverlay("none");
    setJourneyKey((k) => k + 1); // remount journey so the change takes effect
  }

  // ---- pre-journey stages ----
  if (stage === "splash")
    return <SafarSplash onBegin={() => setStage("intro")} />;
  if (stage === "intro")
    return (
      <>
        <AboutIntro authed={!!me?.user} onContinue={enterApp} />
        {pendingEnter && <LaunchLoading />}
      </>
    );
  if (stage === "auth")
    return <AuthFlow onAuthed={onAuthed} />;
  if (stage === "profile")
    return (
      <ProfileSetup
        email={me?.user?.email || ""}
        onDone={(p) => { setProfile(p); setStage("welcome"); }}
      />
    );
  if (stage === "welcome")
    return (<><BrandMark /><WelcomeProfile profile={profile} onContinue={() => setStage("journey")} /></>);

  // ---- journey + app chrome ----
  return (
    <>
      <ProphetsJourney
        key={journeyKey}
        account={me?.user || null}
        childProfile={profile}
        onStageComplete={handleStageComplete}
      />

      <HamburgerMenu
        authed={!!me?.user}
        childName={profile?.childName}
        avatarUrl={profile?.avatarUrl || profile?.photoUrl}
        onUpdate={() => setOverlay("update")}
        onFeedback={() => setOverlay("feedback")}
        onChangePassword={() => setOverlay("changepw")}
        onContact={() => setOverlay("contact")}
        onLogout={logout}
        onLogin={() => setStage("auth")}
      />

      {overlay === "update" && (
        <UpdateProfileModal
          profile={profile}
          email={me?.user?.email || ""}
          onClose={() => setOverlay("none")}
          onSaved={onProfileSaved}
        />
      )}
      {overlay === "feedback" && (
        <FeedbackModal
          title="Tell us what you think"
          subtitle="Your feedback helps us improve."
          stage="general"
          source="menu"
          onClose={() => setOverlay("none")}
          onDone={() => setOverlay("none")}
        />
      )}
      {overlay === "contact" && <ContactModal onClose={() => setOverlay("none")} />}
      {overlay === "changepw" && (
        <ChangePasswordModal onClose={() => setOverlay("none")} onDone={() => setOverlay("none")} />
      )}

      {/* End-of-stage feedback */}
      {stageFeedback && (
        <FeedbackModal
          title="How was this stage?"
          subtitle="Rate it from 1 to 3 stars."
          stage={stageFeedback.stage}
          source="stage"
          onClose={() => setStageFeedback(null)}
          onDone={() => setStageFeedback(null)}
        />
      )}
    </>
  );
}

function LaunchLoading() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="ipj-spin" style={{ width: 54, height: 54, borderRadius: "50%", border: "5px solid rgba(245,196,81,.2)", borderTopColor: C.gold }} />
    </div>
  );
}
