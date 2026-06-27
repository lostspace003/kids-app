// Light haptic feedback for screen transitions and button taps, via the Web
// Vibration API. Supported on Android (Chrome / installed PWA); on platforms
// without it — notably iOS Safari — these calls are silent no-ops.
//
// `pattern` is a single duration in ms or an [on, off, on, …] array.
export function vibrate(pattern = 12) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* vibration unavailable or blocked — ignore */
  }
}
