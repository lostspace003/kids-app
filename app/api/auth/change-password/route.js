// Change password for the logged-in parent. Bumps tokenVersion to invalidate
// other sessions, then re-issues a fresh cookie for the current device.
import { db } from "@/app/lib/server/db.js";
import { getCurrentUser, createSession } from "@/app/lib/server/session.js";
import { hashPassword, verifyPassword } from "@/app/lib/server/password.js";
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
  const current = String(body.currentPassword || "");
  const next = String(body.newPassword || "");

  if (!(await verifyPassword(current, user.passwordHash)))
    return error("Current password is incorrect.", 401);
  if (next.length < 8)
    return error("New password must be at least 8 characters.");

  const passwordHash = await hashPassword(next);
  const tokenVersion = (user.tokenVersion || 0) + 1;
  await db.updateUser(user.id, { passwordHash, tokenVersion });
  await createSession({ ...user, tokenVersion });

  return json({ ok: true });
}
