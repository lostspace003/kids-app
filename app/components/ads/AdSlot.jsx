"use client";

import { useEffect, useState } from "react";
import { ADSENSE_CLIENT, adsActive } from "../../lib/ads";

// A single responsive AdSense unit. Renders nothing unless ads are active
// (browser-only + configured) and a slot id is given. Each `slot` is an ad-unit
// id created in your AdSense account.
export default function AdSlot({ slot, format = "auto", responsive = true, style }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (adsActive() && slot) setShow(true);
  }, [slot]);

  useEffect(() => {
    if (!show) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.requestNonPersonalizedAds = 1; // kids app: NPA only
      window.adsbygoogle.push({});
    } catch {
      /* ignore — library not ready / blocked */
    }
  }, [show]);

  if (!show) return null;
  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
