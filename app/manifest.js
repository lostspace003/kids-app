export default function manifest() {
  return {
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
  };
}
