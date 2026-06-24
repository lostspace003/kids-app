/** @type {import('next').NextConfig} */

// For GitHub Pages PROJECT sites the app is served from a sub-path
// (https://<user>.github.io/<repo>/). The deploy workflow sets PAGES=true so
// the build uses that base path; local `npm run dev` keeps the root path.
const basePath = process.env.PAGES === "true" ? "/kids-app" : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",              // emit a fully static site into ./out
  images: { unoptimized: true }, // no server image optimizer on static hosting
  trailingSlash: true,           // serve /route/ as /route/index.html
  basePath,
  assetPrefix: basePath || undefined,
  // Exposed to the browser so raw asset URLs (audio, photos) can be prefixed.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
