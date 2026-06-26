// Serves stored media (uploaded photos, generated avatars, and the narration
// audio library) from whichever backend is active — local filesystem or Azure
// Blob — behind one stable URL:  /api/media/<key...>
import { storage, contentTypeForKey } from "@/app/lib/server/storage.js";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { key: segments } = await params;
  const key = (segments || []).map(decodeURIComponent).join("/");
  // Narration audio under "audio/" is public + content-hashed (immutable), so it
  // can be cached hard and shared. Everything else (user photos) stays private.
  const isAudio = key.startsWith("audio/");
  const cache = isAudio
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
