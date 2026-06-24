// Serves stored media (uploaded photos, generated avatars) from whichever
// backend is active — local filesystem or Azure Blob — behind one stable URL:
//   /api/media/<key...>
import { storage, contentTypeForKey } from "@/app/lib/server/storage.js";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { key: segments } = await params;
  const key = (segments || []).map(decodeURIComponent).join("/");
  try {
    const buf = await storage.get(key);
    return new Response(buf, {
      headers: {
        "Content-Type": contentTypeForKey(key),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
