// Stateless session cookie: base64url(payload).hmac. Payload carries the user
// id and a token version (tv). Bumping a user's tokenVersion (on password
// change or "sign out everywhere") invalidates all existing cookies.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_SECRET } from "./config.js";
import { db } from "./db.js";

const COOKIE = "pj_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}
function sign(data) {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
}

export function signToken({ uid, tv }) {
  const payload = b64url(JSON.stringify({ uid, tv, iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function createSession(user) {
  const store = await cookies();
  store.set(COOKIE, signToken({ uid: user.id, tv: user.tokenVersion || 0 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

// Returns the authenticated user (or null). Validates token version so stale
// sessions are rejected after password change / global sign-out.
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  const claims = verifyToken(token);
  if (!claims) return null;
  const user = await db.getUserById(claims.uid);
  if (!user || (user.tokenVersion || 0) !== claims.tv) return null;
  return user;
}
