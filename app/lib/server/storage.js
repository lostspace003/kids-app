// Storage facade. Both implementations expose put/get/exists. Every stored
// object is reached through one stable app URL — /api/media/<key> — so the
// browser never sees mode-specific blob URLs.
import { MODE } from "./config.js";
import { storageLocal } from "./storage-local.js";

let _storage = storageLocal;
if (MODE === "azure") {
  const { storageAzure } = await import("./storage-azure.js");
  _storage = storageAzure;
}

export const storage = _storage;

export function mediaUrl(key) {
  if (!key) return null;
  return "/api/media/" + key.split("/").map(encodeURIComponent).join("/");
}

// Content type from key extension (keys always carry one, e.g. photos/x.png).
export function contentTypeForKey(key) {
  const ext = (key.split(".").pop() || "").toLowerCase();
  return (
    {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      mp3: "audio/mpeg",
      json: "application/json",
    }[ext] || "application/octet-stream"
  );
}
