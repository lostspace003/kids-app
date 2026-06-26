// GET /api/leaderboard — public, child-safe ranking.
// Returns pseudonymous entries (fun icon + generated handle + score) ranked by
// cumulative Noor, youngest-first on ties (DOB used only server-side, never
// returned). No child name, photo, age, or country is exposed.
import { db } from "@/app/lib/server/db.js";
import { getCurrentUser } from "@/app/lib/server/session.js";
import { json } from "@/app/lib/server/http.js";
import { mediaUrl } from "@/app/lib/server/storage.js";
import { buildLeaderboard } from "@/app/lib/leaderboard.js";

export const dynamic = "force-dynamic";

export async function GET() {
  let meId = null;
  try { const u = await getCurrentUser(); meId = u?.id || null; } catch {}

  const [profiles, progressList] = await Promise.all([
    db.getAllProfiles(),
    db.getAllProgress(),
  ]);
  const progMap = Object.fromEntries(progressList.map((p) => [p.userId, p.data || {}]));

  const rows = profiles
    .map((p) => {
      const prog = progMap[p.userId] || {};
      return {
        userId: p.userId,
        gender: p.gender === "girl" ? "girl" : "boy",
        dob: p.dob || null,
        handle: p.handle || null, // custom handle if the parent set one
        // Ghibli cartoon avatar (from an uploaded photo) — never the real photo.
        // buildLeaderboard only surfaces it for children ≤10.
        avatar: p.avatarSource === "photo" && p.avatarKey ? mediaUrl(p.avatarKey) : null,
        score: Number(prog.noor) || 0,
        completed: Array.isArray(prog.completed) ? prog.completed.length : 0,
      };
    })
    // Only children who have actually started count toward the board.
    .filter((r) => r.score > 0 || r.completed > 0);

  const board = buildLeaderboard(rows, meId);
  return json(board);
}
