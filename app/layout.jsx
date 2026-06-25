import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import AdsenseScript from "./components/ads/AdsenseScript";

export const metadata = {
  title: "Safar Anbiya · Journey of the Prophets",
  description:
    "A gamified Islamic learning journey for kids — travel the path of all 25 prophets by the light of your lantern.",
  icons: {
    icon: [
      { url: "/brand/png/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/png/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/svg/emblem-color.svg", type: "image/svg+xml" },
    ],
    apple: "/brand/png/apple-touch-icon-180.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0c0820",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,600&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <AdsenseScript />
        {children}
      </body>
    </html>
  );
}
