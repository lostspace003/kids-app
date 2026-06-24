import { destroySession } from "@/app/lib/server/session.js";
import { json } from "@/app/lib/server/http.js";

export async function POST() {
  await destroySession();
  return json({ ok: true });
}
