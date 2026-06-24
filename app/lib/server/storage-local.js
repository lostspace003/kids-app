// Local blob store: files under .localdata/blobs/<key>. Keys may contain "/".
import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_DATA_DIR } from "./config.js";

const ROOT = path.join(process.cwd(), LOCAL_DATA_DIR, "blobs");

// Prevent path traversal; keep nested "folders" inside ROOT.
function resolveKey(key) {
  const p = path.join(ROOT, key);
  if (!p.startsWith(ROOT)) throw new Error("invalid key");
  return p;
}

export const storageLocal = {
  async put(key, buffer /* Buffer */) {
    const p = resolveKey(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, buffer);
    return key;
  },
  async get(key) {
    return fs.readFile(resolveKey(key)); // Buffer; throws if missing
  },
  async exists(key) {
    try {
      await fs.access(resolveKey(key));
      return true;
    } catch {
      return false;
    }
  },
};
