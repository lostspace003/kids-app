"use client";

import { useEffect } from "react";

// Registers /sw.js after the page loads so Safar Anbiya qualifies as an
// installable PWA (and so PWABuilder detects a service worker). Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
