// Serves stored media (uploaded photos, generated avatars, and the narration
// audio library) from whichever backend is active — local filesystem or Azure
// Blob — behind one stable URL:  /api/media/<key...>
import { storage, contentTypeForKey } from "@/app/lib/server/storage.js";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { key: segments } = await params;
  const key = (segments || []).map(decodeURIComponent).join("/");
  // Narration mp3s under "audio/" are public + content-hashed → cache hard.
  // The manifest changes whenever clips do, so it must stay fresh. Everything
  // else (user photos) stays private.
  const cache = key === "audio/manifest.json"
    ? "public, max-age=60, must-revalidate"
    : key.startsWith("audio/")
    ? "public, max-age=31536000, immutable"
    : "private, max-age=3600";
  try {
    const buf = await storage.get(key);
    return new Response(buf, {
      headers: { "Content-Type": contentTypeForKey(key), "Cache-Control": cache },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
