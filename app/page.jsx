"use client";

import dynamic from "next/dynamic";

// AuthGate orchestrates the launch salam splash, auth, profile creation, the
// welcome screen, and finally the journey. It's client-only because the whole
// experience relies on browser APIs (Web Audio, localStorage, parallax).
const AuthGate = dynamic(() => import("./components/AuthGate"), { ssr: false });

export default function Page() {
  return <AuthGate />;
}
