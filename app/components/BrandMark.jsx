"use client";

import React from "react";

// The Safar-e-Anbiya lantern emblem, shown on every screen EXCEPT the first
// (splash) page — which carries the full wordmark itself. Fixed top-centre,
// non-interactive, so it sits above the content as a consistent brand anchor.
export default function BrandMark({ size = 30, withWordmark = false }) {
  return (
    <div style={wrap} aria-hidden="true">
      <img src="/brand/svg/emblem-glow.svg" alt="" width={size} height={size} style={{ display: "block" }} />
      {withWordmark && (
        <span style={{ fontFamily: "Fredoka, sans-serif", fontWeight: 600, fontSize: 15, color: "#f4eede", letterSpacing: ".3px" }}>
          Safar-e-<span style={{ color: "#f5c451" }}>Anbiya</span>
        </span>
      )}
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: 6,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 35,
  display: "flex",
  alignItems: "center",
  gap: 8,
  pointerEvents: "none",
};
