// Ghibli avatar generator. Calls the already-deployed Azure OpenAI gpt-image-2
// image-edit endpoint with the child's uploaded photo. Returns a PNG Buffer.
// Uses global fetch/FormData/Blob (Node 18+). Server-only: the API key never
// leaves the server.
import { imageGen } from "./config.js";

const GHIBLI_PROMPT =
  "Transform this photo into Studio Ghibli anime style: soft hand-painted " +
  "watercolor backgrounds, warm gentle lighting, lush scenery, expressive " +
  "eyes, clean line art, dreamy nostalgic Miyazaki atmosphere. Preserve the " +
  "subject's identity, pose, and composition. Keep it wholesome and " +
  "child-friendly.";

export function imageGenConfigured() {
  return Boolean(imageGen.endpoint && imageGen.key);
}

// inputBuffer: Buffer of the cropped photo (PNG/JPG). Returns Buffer (PNG).
export async function generateGhibliAvatar(inputBuffer, { contentType = "image/png" } = {}) {
  if (!imageGenConfigured()) {
    throw new Error("Avatar generator not configured (AZURE_OPENAI_IMAGE_*).");
  }
  const url =
    `${imageGen.endpoint.replace(/\/$/, "")}/openai/deployments/` +
    `${imageGen.deployment}/images/edits?api-version=${imageGen.apiVersion}`;

  const form = new FormData();
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  form.append("image[]", new Blob([inputBuffer], { type: contentType }), `input.${ext}`);
  form.append("prompt", GHIBLI_PROMPT);
  form.append("model", imageGen.deployment);
  form.append("size", "1024x1024");
  form.append("n", "1");
  form.append("quality", "medium");
  form.append("input_fidelity", "high");

  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": imageGen.key },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`image edit failed: ${res.status} ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("image edit returned no data");
  return Buffer.from(b64, "base64");
}
