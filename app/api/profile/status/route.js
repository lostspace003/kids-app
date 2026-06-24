// Lightweight poll endpoint for the avatar generation job.
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { mediaUrl } from "@/app/lib/server/storage.js";
import { json, error } from "@/app/lib/server/http.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const p = await db.getProfile(user.id);
  if (!p) return error("No profile.", 404);
  return json({
    ok: true,
    avatarStatus: p.avatarStatus || "none",
    avatarUrl: mediaUrl(p.avatarKey),
  });
}
