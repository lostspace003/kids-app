"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_CLIENT, adsActive } from "../../lib/ads";

// Loads the Google AdSense library — but only in a real browser tab (never in
// the installed app/TWA) and only when a publisher id is configured. Forces
// non-personalized ads (this is a kids app: no behavioural/personalised ads).
export default function AdsenseScript() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (adsActive()) {
      // Set before any ad unit pushes, so the very first request is NPA.
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1;
      setShow(true);
    }
  }, []);

  if (!show) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
