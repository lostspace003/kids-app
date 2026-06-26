// GET /api/profile/handle
//   ?check=<handle>  → { handle, valid, available }
//   (no param)       → { gender, suggestions:[{handle, available}] }
// Powers the leaderboard-handle picker: Islamic-history name suggestions plus
// live availability so taken handles can be greyed out. Handles are unique.
import { db } from "@/app/lib/server/db.js";
import { getCurrentUser } from "@/app/lib/server/session.js";
import { json, error } from "@/app/lib/server/http.js";
import { NAME_POOL, normalizeHandle, publicIdentity } from "@/app/lib/leaderboard.js";

export const dynamic = "force-dynamic";

async function takenHandles(exceptUserId) {
  const all = await db.getAllProfiles();
  const set = new Set();
  for (const p of all) {
    if (p.userId === exceptUserId) continue;
    set.add(normalizeHandle(p.handle) || publicIdentity(p.userId, p.gender).handle);
  }
  return set;
}

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const profile = await db.getProfile(user.id);
  const gender = profile?.gender === "girl" ? "girl" : "boy";
  const taken = await takenHandles(user.id);
  const url = new URL(req.url);

  const check = url.searchParams.get("check");
  if (check != null) {
    const h = normalizeHandle(check);
    if (!h) return json({ handle: check, valid: false, available: false });
    return json({ handle: h, valid: true, available: !taken.has(h) });
  }

  // Up to 8 varied suggestions from the child's gender pool, with availability.
  const pool = NAME_POOL[gender];
  const picks = [];
  const seen = new Set();
  let guard = 0;
  while (picks.length < 8 && guard < 300) {
    guard++;
    const name = pool[Math.floor(Math.random() * pool.length)];
    const num = 10 + Math.floor(Math.random() * 90);
    const h = `${name}${num}`;
    if (seen.has(h)) continue;
    seen.add(h);
    picks.push({ handle: h, available: !taken.has(h) });
  }
  return json({ gender, suggestions: picks });
}
