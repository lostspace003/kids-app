// Begin a password reset: parent provides their email. If a verified account
// exists, we email a 6-digit OTP (purpose "reset"). The response is always the
// same success shape so this endpoint can't be used to discover which emails
// are registered.
import { db } from "@/app/lib/server/db.js";
import { generateOtp, hashOtp, OTP_TTL_MS } from "@/app/lib/server/otp.js";
import { sendPasswordResetEmail } from "@/app/lib/server/email.js";
import { json, error, normalizeEmail, isValidEmail } from "@/app/lib/server/http.js";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return error("Please enter a valid email address.");

  const user = await db.getUserByEmail(email);

  // Only send a code to a real, verified, non-blocked account. In every other
  // case we still return ok so the caller can't tell accounts apart.
  if (user && user.emailVerified && !user.flagged) {
    const code = generateOtp();
    await db.saveOtp(email, {
      codeHash: hashOtp(code),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      purpose: "reset",
    });
    await sendPasswordResetEmail(email, code);
  }

  return json({ ok: true });
}
