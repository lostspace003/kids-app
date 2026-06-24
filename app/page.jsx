"use client";

import dynamic from "next/dynamic";

// The experience is highly interactive (Web Speech API, randomised parallax
// fields, localStorage progress) and must run only in the browser — rendering
// it on the server would cause hydration mismatches, so we load it client-only.
const ProphetsJourney = dynamic(
  () => import("./components/ProphetsJourney"),
  { ssr: false }
);

export default function Page() {
  return <ProphetsJourney />;
}
