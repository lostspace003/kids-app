// ---------------------------------------------------------------------------
// Local development data store: a single JSON file under .localdata/.
// Implements the repository interface consumed by the rest of the server.
// Read-modify-write is serialised through an in-process promise chain so
// concurrent requests in `next dev` don't clobber each other.
//
// The Azure SQL implementation (db-azure.js) exposes the SAME interface.
// ---------------------------------------------------------------------------

import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_DATA_DIR } from "./config.js";

const FILE = path.join(process.cwd(), LOCAL_DATA_DIR, "db.json");

const EMPTY = {
  users: {}, // id -> user
  profiles: {}, // userId -> profile
  otps: {}, // email -> { codeHash, expiresAt, attempts, purpose }
  progress: {}, // userId -> data
  feedback: [], // records
  analytics: [], // records
};

let chain = Promise.resolve();

async function load() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...structuredClone(EMPTY), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY);
  }
}

async function save(data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

// Run a mutator (db -> result) atomically against the persisted file.
function tx(fn) {
  const run = chain.then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  // Keep the chain alive even if this tx throws.
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function readonly(fn) {
  return chain.then(async () => fn(await load()));
}

export const dbLocal = {
  // ---- users ----
  getUserByEmail: (email) =>
    readonly((d) =>
      Object.values(d.users).find((u) => u.email === email.toLowerCase()) || null
    ),
  getUserById: (id) => readonly((d) => d.users[id] || null),
  createUser: (user) =>
    tx((d) => {
      d.users[user.id] = user;
      return user;
    }),
  updateUser: (id, patch) =>
    tx((d) => {
      if (!d.users[id]) return null;
      d.users[id] = { ...d.users[id], ...patch };
      return d.users[id];
    }),

  // ---- profiles ----
  getProfile: (userId) => readonly((d) => d.profiles[userId] || null),
  upsertProfile: (userId, patch) =>
    tx((d) => {
      d.profiles[userId] = { ...(d.profiles[userId] || {}), ...patch, userId };
      return d.profiles[userId];
    }),

  // ---- otps ----
  saveOtp: (email, rec) =>
    tx((d) => {
      d.otps[email.toLowerCase()] = rec;
      return rec;
    }),
  getOtp: (email) => readonly((d) => d.otps[email.toLowerCase()] || null),
  deleteOtp: (email) =>
    tx((d) => {
      delete d.otps[email.toLowerCase()];
    }),
  bumpOtpAttempts: (email) =>
    tx((d) => {
      const o = d.otps[email.toLowerCase()];
      if (o) o.attempts = (o.attempts || 0) + 1;
      return o;
    }),

  // ---- progress ----
  getProgress: (userId) => readonly((d) => d.progress[userId] || null),
  saveProgress: (userId, data) =>
    tx((d) => {
      d.progress[userId] = data;
      return data;
    }),

  // ---- feedback / analytics ----
  addFeedback: (rec) =>
    tx((d) => {
      d.feedback.push(rec);
      return rec;
    }),
  addAnalytics: (rec) =>
    tx((d) => {
      d.analytics.push(rec);
      return rec;
    }),
};
