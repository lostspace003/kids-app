// Bootstrap endpoint the client calls on load: who am I, and do I have a
// profile yet? Returns resolved media URLs so the client never builds them.
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { mediaUrl } from "@/app/lib/server/storage.js";
import { json, publicUser } from "@/app/lib/server/http.js";

export const dynamic = "force-dynamic";

export function publicProfile(p) {
  if (!p) return null;
  return {
    childName: p.childName,
    dob: p.dob,
    country: p.country,
    gender: p.gender, // "boy" | "girl"
    avatarStatus: p.avatarStatus || "none", // none | pending | ready | failed
    photoUrl: mediaUrl(p.photoKey),
    avatarUrl: mediaUrl(p.avatarKey),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return json({ ok: true, user: null, profile: null });
  const profile = await db.getProfile(user.id);
  return json({
    ok: true,
    user: publicUser(user),
    profile: publicProfile(profile),
  });
}
