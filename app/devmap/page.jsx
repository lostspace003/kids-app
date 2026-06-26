"use client";

// DEV-ONLY preview route used by scripts/capture-screenshots.mjs to reach the
// journey map + leaderboard without a login, so store screenshots can be
// generated headlessly. It is NOT linked from the app and returns 404 in
// production, so it never ships in the deployed site or the wrapped TWA/iOS app.
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const ProphetsJourney = dynamic(() => import("../components/ProphetsJourney"), { ssr: false });

export default function DevMap() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ProphetsJourney
      account={{ id: "dev", email: "dev@local" }}
      childProfile={{ childName: "Hamza", gender: "boy" }}
      onStageComplete={() => {}}
      onScreenChange={() => {}}
    />
  );
}
