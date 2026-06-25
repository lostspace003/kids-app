// Image moderation via Azure AI Content Safety. Screens an uploaded photo
// BEFORE any Ghibli generation. Returns { allowed, reason }.
//
// In local dev (or if Content Safety isn't configured) it allows everything so
// development isn't blocked. In production every photo is screened.
import { MODE, azure } from "./config.js";

// Block at severity >= 2 (Low and above) for any harmful category. Azure
// severities are 0/2/4/6 (Safe/Low/Medium/High).
const BLOCK_AT = 2;

export async function moderateImage(buffer, contentType = "image/png") {
  if (MODE !== "azure" || !azure.contentSafetyEndpoint || !azure.contentSafetyKey) {
    return { allowed: true, reason: null, skipped: true };
  }
  try {
    const url =
      azure.contentSafetyEndpoint.replace(/\/$/, "") +
      "/contentsafety/image:analyze?api-version=2024-09-01";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": azure.contentSafetyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: { content: buffer.toString("base64") } }),
    });
    if (!res.ok) {
      // Fail-open on transient API errors so legitimate users aren't blocked.
      // eslint-disable-next-line no-console
      console.error("content-safety error", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return { allowed: true, reason: null, error: `cs ${res.status}` };
    }
    const data = await res.json();
    const cats = data.categoriesAnalysis || [];
    const hit = cats.find((c) => (c.severity || 0) >= BLOCK_AT);
    if (hit) return { allowed: false, reason: `${hit.category}:${hit.severity}` };
    return { allowed: true, reason: null };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("content-safety exception", e?.message || e);
    return { allowed: true, reason: null, error: "exception" };
  }
}
