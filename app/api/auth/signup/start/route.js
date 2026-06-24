// Begin signup: parent provides email + password. We create an unverified
// user (or refresh an existing unverified one), then email a 6-digit OTP.
import { randomUUID } from "node:crypto";
import { db } from "@/app/lib/server/db.js";
import { hashPassword } from "@/app/lib/server/password.js";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/app/lib/server/otp.js";
import { sendOtpEmail } from "@/app/lib/server/email.js";
import { json, error, normalizeEmail, isValidEmail } from "@/app/lib/server/http.js";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!isValidEmail(email)) return error("Please enter a valid email address.");
  if (password.length < 8)
    return error("Password must be at least 8 characters.");

  const existing = await db.getUserByEmail(email);
  if (existing && existing.emailVerified) {
    return error("An account with this email already exists. Please log in.", 409);
  }

  const passwordHash = await hashPassword(password);
  if (existing) {
    await db.updateUser(existing.id, { passwordHash });
  } else {
    await db.createUser({
      id: randomUUID(),
      email,
      passwordHash,
      emailVerified: false,
      tokenVersion: 0,
      createdAt: new Date().toISOString(),
    });
  }

  const code = generateOtp();
  await db.saveOtp(email, {
    codeHash: hashOtp(code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    purpose: "signup",
  });
  await sendOtpEmail(email, code);

  return json({ ok: true, needsVerification: true });
}
