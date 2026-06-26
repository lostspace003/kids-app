// One-off: turn public/hana.jpeg into a Studio-Ghibli default girl avatar with a
// nice modest headscarf, saved as public/hana.webp (used as the default avatar
// for girls who don't upload a photo). Run: node scripts/gen-hana-avatar.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local (Next loads it for the app; a plain node script does not).
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT;
const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || "gpt-image-2";
const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION || "2025-04-01-preview";
const key = process.env.AZURE_OPENAI_IMAGE_KEY;
if (!endpoint || !key) { console.error("AZURE_OPENAI_IMAGE_* not set"); process.exit(1); }

const PROMPT =
  "Transform this photo into Studio Ghibli anime style: soft hand-painted " +
  "watercolour, warm gentle lighting, expressive eyes, clean line art, dreamy " +
  "nostalgic Miyazaki atmosphere. Dress the girl in a nice, modest headscarf " +
  "(hijab) in a soft pleasant colour, neatly framing her face. Preserve her " +
  "identity and friendly smile. Wholesome and child-friendly, portrait framing.";

const inBuf = fs.readFileSync(path.join(ROOT, "public", "hana.jpeg"));
const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/images/edits?api-version=${apiVersion}`;
const form = new FormData();
form.append("image[]", new Blob([inBuf], { type: "image/jpeg" }), "hana.jpg");
form.append("prompt", PROMPT);
form.append("model", deployment);
form.append("size", "1024x1024");
form.append("n", "1");
form.append("quality", "medium");
form.append("input_fidelity", "high");

console.log("Generating Hana's Ghibli avatar…");
const res = await fetch(url, { method: "POST", headers: { "api-key": key }, body: form });
if (!res.ok) { console.error("image edit failed:", res.status, (await res.text()).slice(0, 300)); process.exit(1); }
const j = await res.json();
const b64 = j?.data?.[0]?.b64_json;
if (!b64) { console.error("no image returned"); process.exit(1); }

const out = path.join(ROOT, "public", "hana.webp");
await sharp(Buffer.from(b64, "base64")).resize(512, 512, { fit: "cover" }).webp({ quality: 88 }).toFile(out);
console.log("Saved", path.relative(ROOT, out));
