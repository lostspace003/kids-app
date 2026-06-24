// Feedback: a 1–3 star rating plus optional written note. Submitted at the end
// of each stage and from the hamburger menu. Stored per account in SQL/local.
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
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
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 3)) return error("Rating must be 1 to 3 stars.");
  const text = String(body.text || "").trim().slice(0, 1000);
  const stage = String(body.stage || "").trim().slice(0, 80) || "general";
  const source = body.source === "menu" ? "menu" : "stage";

  const rec = {
    id: randomUUID(),
    userId: user.id,
    stage,
    rating,
    text,
    source,
    createdAt: new Date().toISOString(),
  };
  await db.addFeedback(rec);
  return json({ ok: true });
}
