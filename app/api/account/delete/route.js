// POST /api/account/delete — permanently delete the signed-in parent account
// and ALL associated data (profile, child name/DOB, uploaded photo, generated
// avatar, learning progress, feedback, certificates). Required by the app
// stores (Apple Guideline 5.1.1(v): in-app account deletion).
//
// The parent must re-enter their password to confirm. After deletion the
// session cookie is destroyed so the device is signed out immediately.
import { db } from "@/app/lib/server/db.js";
import { storage } from "@/app/lib/server/storage.js";
import { getCurrentUser, destroySession } from "@/app/lib/server/session.js";
import { verifyPassword } from "@/app/lib/server/password.js";
import { json, error } from "@/app/lib/server/http.js";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }

  // Confirm with the account password so a deletion can't be triggered by an
  // accidental tap or a forged cross-site request.
  const password = String(body.password || "");
  if (!(await verifyPassword(password, user.passwordHash)))
    return error("Password is incorrect.", 401);

  // Grab the media keys before the profile row is gone, so we can purge blobs.
  const profile = await db.getProfile(user.id).catch(() => null);
  const keys = [profile?.photoKey, profile?.avatarKey].filter(Boolean);

  const { email } = (await db.deleteAccount(user.id)) || {};

  // Best-effort cleanup of out-of-band data; never let it block the deletion.
  await Promise.allSettled([
    ...keys.map((k) => storage.delete(k)),
    email ? db.deleteOtp(email) : Promise.resolve(),
  ]);

  await destroySession();
  return json({ ok: true });
}
