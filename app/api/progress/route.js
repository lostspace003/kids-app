// Per-account journey progress (completed prophets, Noor, stars, streak).
// GET returns the saved blob; PUT replaces it. Stored in SQL (Azure) or the
// local JSON store, keyed by user id.
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { json, error } from "@/app/lib/server/http.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const progress = await db.getProgress(user.id);
  return json({ ok: true, progress: progress || null });
}

export async function PUT(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const p = body.progress;
  if (!p || typeof p !== "object") return error("Missing progress.");
  // Light shape guard; the client owns the schema.
  const clean = {
    completed: Array.isArray(p.completed) ? p.completed.slice(0, 100) : [],
    noor: Number(p.noor) || 0,
    stars: p.stars && typeof p.stars === "object" ? p.stars : {},
    earned: p.earned && typeof p.earned === "object" ? p.earned : {},
    streak: Number(p.streak) || 0,
    lastDay: p.lastDay ?? null,
  };
  await db.saveProgress(user.id, clean);
  return json({ ok: true });
}
