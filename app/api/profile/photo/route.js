// Upload a photo AFTER signup (for children who skipped it and use a default
// avatar). Generates the Ghibli avatar and locks the photo from then on.
// Rejected if a photo is already set (photos are immutable once uploaded).
import { getCurrentUser, destroySession } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { storage } from "@/app/lib/server/storage.js";
import { startAvatarJob } from "@/app/lib/server/avatar-job.js";
import { moderateImage } from "@/app/lib/server/moderation.js";
import { json, error } from "@/app/lib/server/http.js";
import { publicProfile } from "@/app/api/auth/me/route.js";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const existing = await db.getProfile(user.id);
  if (!existing) return error("No profile yet.", 404);
  if (existing.avatarSource === "photo" || existing.photoKey)
    return error("A photo is already set and can't be changed.", 409);

  let form;
  try {
    form = await req.formData();
  } catch {
    return error("Expected multipart form data.");
  }
  const photo = form.get("photo");
  if (!photo || typeof photo.arrayBuffer !== "function" || !photo.size)
    return error("Please choose a photo.");

  const buf = Buffer.from(await photo.arrayBuffer());
  if (buf.length > 12 * 1024 * 1024) return error("Photo is too large (max 12MB).");
  const contentType = photo.type || "image/png";
  // Content-safety screen before storing/generating; ban on failure.
  const mod = await moderateImage(buf, contentType);
  if (!mod.allowed) {
    await db.updateUser(user.id, { flagged: true });
    await db.blockEmail(user.email, ("photo:" + (mod.reason || "flagged")).slice(0, 200));
    await destroySession();
    return error("This photo can't be used, and the account has been blocked.", 422);
  }
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const photoKey = `photos/${user.id}.${ext}`;
  await storage.put(photoKey, buf);

  const profile = await db.upsertProfile(user.id, {
    photoKey,
    avatarKey: null,
    avatarSource: "photo",
    avatarStatus: "pending",
    defaultAvatar: null,
    updatedAt: new Date().toISOString(),
  });
  startAvatarJob(user.id, buf, contentType);

  return json({ ok: true, profile: publicProfile(profile) }, 201);
}
