export default function manifest() {
  return {
    id: "/",
    name: "Safar Anbiya · Journey of the Prophets",
    short_name: "Safar Anbiya",
    description:
      "A gamified Islamic learning journey for kids — travel the path of all 25 prophets by the light of your lantern.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0820",
    theme_color: "#0c0820",
    lang: "en",
    dir: "ltr",
    categories: ["education", "kids"],
    // Tell browsers/OSes to prefer this installable PWA over a native app.
    prefer_related_applications: false,
    // The Android (TWA) package this site maps to. Use this SAME package id in
    // PWABuilder's Android options so the app verifies ownership of the domain.
    related_applications: [
      {
        platform: "play",
        id: "com.gennoor.safaranbiya",
        url: "https://play.google.com/store/apps/details?id=com.gennoor.safaranbiya",
      },
    ],
    icons: [
      {
        src: "/brand/png/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/png/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/png/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/brand/png/screenshot-phone.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Safar Anbiya — start your journey through the prophets",
      },
      {
        src: "/brand/png/social-lockup.png",
        sizes: "924x540",
        type: "image/png",
        form_factor: "wide",
        label: "Safar Anbiya — Journey of the Prophets",
      },
    ],
  };
}
