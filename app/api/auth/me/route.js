// Bootstrap endpoint the client calls on load: who am I, and do I have a
// profile yet? Returns resolved media URLs so the client never builds them.
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { mediaUrl } from "@/app/lib/server/storage.js";
import { json, publicUser } from "@/app/lib/server/http.js";
import { normalizeHandle, publicIdentity } from "@/app/lib/leaderboard.js";

export const dynamic = "force-dynamic";

export function publicProfile(p) {
  if (!p) return null;
  // A real uploaded photo (avatarSource "photo") locks the photo. Otherwise the
  // child uses a default traveller avatar, and can still upload one later.
  const isPhoto = p.avatarSource === "photo" || !!p.photoKey;
  const fallbackDefault = p.defaultAvatar || (p.gender === "girl" ? "/hana.webp" : "/huzaifa.webp");
  return {
    childName: p.childName,
    dob: p.dob,
    country: p.country,
    gender: p.gender, // "boy" | "girl"
    avatarSource: isPhoto ? "photo" : "default",
    photoLocked: isPhoto,
    avatarStatus: p.avatarStatus || (isPhoto ? "pending" : "ready"),
    photoUrl: mediaUrl(p.photoKey),
    // While a photo avatar is still generating, fall back to the photo itself.
    avatarUrl: isPhoto ? (mediaUrl(p.avatarKey) || mediaUrl(p.photoKey)) : fallbackDefault,
    defaultAvatar: isPhoto ? null : fallbackDefault,
    // Public, editable leaderboard handle (custom if set, else generated).
    handle: normalizeHandle(p.handle) || publicIdentity(p.userId, p.gender).handle,
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
