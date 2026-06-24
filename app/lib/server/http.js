// Small helpers shared by API route handlers.

export function json(data, status = 200) {
  return Response.json(data, { status });
}

export function error(message, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_RE.test(email);
}

// Public shape of a user (never expose the password hash).
export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, emailVerified: !!user.emailVerified };
}
