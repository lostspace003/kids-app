// Generates a child's Ghibli avatar in the background so profile creation
// returns instantly (the generator takes ~30-90s). On success the avatar is
// stored as a light WebP and the profile's avatarStatus flips to "ready".
//
// On a persistent Node server (Azure Web App B1 / `next dev`) a detached
// promise survives until it settles. (If we ever move to short-lived
// serverless, this would need a queue — noted for Phase 6.)
import sharp from "sharp";
import { db } from "./db.js";
import { storage } from "./storage.js";
import { generateGhibliAvatar } from "./imagegen.js";

export function startAvatarJob(userId, photoBuffer, contentType) {
  // Fire and forget; never block the request on it.
  (async () => {
    try {
      const png = await generateGhibliAvatar(photoBuffer, { contentType });
      const webp = await sharp(png)
        .resize(640, 640, { fit: "cover" })
        .webp({ quality: 82 })
        .toBuffer();
      const key = `avatars/${userId}.webp`;
      await storage.put(key, webp);
      await db.upsertProfile(userId, {
        avatarKey: key,
        avatarStatus: "ready",
        avatarReadyAt: new Date().toISOString(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("avatar job failed for", userId, err?.message || err);
      await db.upsertProfile(userId, { avatarStatus: "failed" });
    }
  })();
}
