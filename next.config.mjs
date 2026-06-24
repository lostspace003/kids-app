/** @type {import('next').NextConfig} */

// The app now runs as a Node server (Azure Web App B1) because it needs
// server-side auth (OTP), Blob/SQL access, and server-only secrets for the
// Ghibli avatar generator. It is therefore no longer a static export.
const nextConfig = {
  reactStrictMode: true,
  // Images come from Blob Storage / data URLs; skip the built-in optimizer.
  images: { unoptimized: true },
  // Don't fail the production build on lint during early iteration.
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_CONTACT_EMAIL:
      process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@gennoor.com",
  },
};

export default nextConfig;
