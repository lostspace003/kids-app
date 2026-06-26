// Web-ads configuration for Safar-e-Anbiya.
//
// Ads are Google AdSense, shown ONLY to real browser visitors of the website —
// never inside the installed app/TWA. AdSense's program policies forbid showing
// its ads in apps/WebViews, and this is a kids app, so app surfaces stay
// ad-free (which also keeps the Play listing "contains ads: No").
//
// Everything is off until NEXT_PUBLIC_ADSENSE_CLIENT is set, so the code is
// safe to ship before an AdSense account exists.

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

// True only when a real AdSense publisher id (ca-pub-XXXXXXXXXXXXXXXX) is set.
export function adsConfigured() {
  return /^ca-pub-\d{8,}$/.test(ADSENSE_CLIENT);
}

// True only in a real browser tab — false inside the installed app/TWA, where
// showing AdSense would violate policy. Must be called client-side.
export function adsAllowedInBrowser() {
  if (typeof window === "undefined") return false;
  const standalone =
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const fromAndroidApp =
    typeof document !== "undefined" &&
    (document.referrer || "").startsWith("android-app://");
  return !standalone && !fromAndroidApp;
}

// Combined gate used by the ad components.
export function adsActive() {
  return adsConfigured() && adsAllowedInBrowser();
}
