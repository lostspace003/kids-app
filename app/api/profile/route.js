// Create or update the child's profile (one per parent account).
//
// POST  (multipart/form-data): first-time creation. Fields: childName, dob,
//        country, gender, photo (file). Stores the photo, kicks off async
//        Ghibli avatar generation, returns the profile with avatarStatus.
// PATCH (application/json): edit static fields (childName, dob, country,
//        gender). Email and PHOTO are locked and cannot change here.
import { getCurrentUser } from "@/app/lib/server/session.js";
import { db } from "@/app/lib/server/db.js";
import { storage, mediaUrl } from "@/app/lib/server/storage.js";
import { startAvatarJob } from "@/app/lib/server/avatar-job.js";
import { json, error } from "@/app/lib/server/http.js";
import { publicProfile } from "@/app/api/auth/me/route.js";

const GENDERS = new Set(["boy", "girl"]);

function validDob(dob) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || "")) return false;
  const d = new Date(dob);
  const now = new Date();
  // Reasonable bounds: not in the future, not older than 18 years.
  return d <= now && d >= new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  if (await db.getProfile(user.id))
    return error("Profile already exists.", 409);

  let form;
  try {
    form = await req.formData();
  } catch {
    return error("Expected multipart form data.");
  }
  const childName = String(form.get("childName") || "").trim();
  const dob = String(form.get("dob") || "").trim();
  const country = String(form.get("country") || "").trim();
  const gender = String(form.get("gender") || "").trim();
  const photo = form.get("photo");

  if (childName.length < 1 || childName.length > 40)
    return error("Please enter the child's name.");
  if (!validDob(dob)) return error("Please enter a valid date of birth.");
  if (!country) return error("Please choose a country.");
  if (!GENDERS.has(gender)) return error("Please choose boy or girl.");

  const now = new Date().toISOString();
  const hasPhoto = photo && typeof photo.arrayBuffer === "function" && photo.size > 0;
  let profile;

  if (hasPhoto) {
    // Photo provided: store it, generate the Ghibli avatar, and lock the photo.
    const buf = Buffer.from(await photo.arrayBuffer());
    if (buf.length > 12 * 1024 * 1024) return error("Photo is too large (max 12MB).");
    const contentType = photo.type || "image/png";
    const ext = contentType.includes("jpeg") ? "jpg" : "png";
    const photoKey = `photos/${user.id}.${ext}`;
    await storage.put(photoKey, buf);
    profile = await db.upsertProfile(user.id, {
      childName, dob, country, gender,
      photoKey, avatarKey: null, avatarSource: "photo", avatarStatus: "pending",
      defaultAvatar: null, createdAt: now, updatedAt: now,
    });
    startAvatarJob(user.id, buf, contentType);
  } else {
    // No photo: assign a random default traveller avatar (can upload later).
    const def = Math.random() < 0.5 ? "/hamza.webp" : "/huzaifa.webp";
    profile = await db.upsertProfile(user.id, {
      childName, dob, country, gender,
      photoKey: null, avatarKey: null, avatarSource: "default",
      defaultAvatar: def, avatarStatus: "ready", createdAt: now, updatedAt: now,
    });
  }

  return json({ ok: true, profile: publicProfile(profile) }, 201);
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return error("Not signed in.", 401);
  const existing = await db.getProfile(user.id);
  if (!existing) return error("No profile to update.", 404);

  let body;
  try {
    body = await req.json();
  } catch {
    return error("Invalid request");
  }
  const patch = {};
  if (body.childName != null) {
    const n = String(body.childName).trim();
    if (n.length < 1 || n.length > 40) return error("Please enter a valid name.");
    patch.childName = n;
  }
  if (body.dob != null) {
    if (!validDob(body.dob)) return error("Please enter a valid date of birth.");
    patch.dob = body.dob;
  }
  if (body.country != null) {
    const c = String(body.country).trim();
    if (!c) return error("Please choose a country.");
    patch.country = c;
  }
  if (body.gender != null) {
    if (!GENDERS.has(body.gender)) return error("Please choose boy or girl.");
    patch.gender = body.gender;
  }
  // Note: photoKey / avatarKey / email are intentionally never updated here.
  patch.updatedAt = new Date().toISOString();
  const profile = await db.upsertProfile(user.id, patch);
  return json({ ok: true, profile: publicProfile(profile) });
}
