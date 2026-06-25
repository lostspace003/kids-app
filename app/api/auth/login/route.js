// Email + password login. (OTP is only used once at signup.)
import { db } from "@/app/lib/server/db.js";
import { verifyPassword } from "@/app/lib/server/password.js";
import { createSession } from "@/app/lib/server/session.js";
import {
  json,
  error,
  normalizeEmail,
  publicUser,
} from "@/app/lib/server/http.js";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  const user = await db.getUserByEmail(email);
  // Generic message so we don't reveal whether the email exists.
  const bad = () => error("Email or password is incorrect.", 401);
  if (!user) return bad();
  if (!(await verifyPassword(password, user.passwordHash))) return bad();
  if (user.flagged)
    return error("This account has been blocked.", 403);
  if (!user.emailVerified)
    return error("Please verify your email before logging in.", 403);

  await createSession(user);
  const profile = await db.getProfile(user.id);
  return json({ ok: true, user: publicUser(user), hasProfile: !!profile });
}
