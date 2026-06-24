// ---------------------------------------------------------------------------
// Azure SQL implementation of the repository interface (see db-local.js).
// Same method surface; profiles/progress merges are done in JS then written
// as whole rows. `mssql` is imported dynamically so local dev never needs it.
// The schema is created on first connect (idempotent).
// ---------------------------------------------------------------------------
import { azure } from "./config.js";

let poolPromise = null;

async function getPool() {
  if (!azure.sqlConnectionString) throw new Error("AZURE_SQL_CONNECTION_STRING is not set");
  if (!poolPromise) {
    const sql = (await import("mssql")).default;
    poolPromise = sql.connect(azure.sqlConnectionString).then(async (pool) => {
      await ensureSchema(pool);
      return pool;
    });
  }
  return poolPromise;
}

async function ensureSchema(pool) {
  await pool.request().batch(`
IF OBJECT_ID('dbo.users','U') IS NULL CREATE TABLE dbo.users (
  id NVARCHAR(36) PRIMARY KEY, email NVARCHAR(256) NOT NULL UNIQUE,
  passwordHash NVARCHAR(512), emailVerified BIT NOT NULL DEFAULT 0,
  tokenVersion INT NOT NULL DEFAULT 0, createdAt NVARCHAR(40));
IF OBJECT_ID('dbo.profiles','U') IS NULL CREATE TABLE dbo.profiles (
  userId NVARCHAR(36) PRIMARY KEY, childName NVARCHAR(80), dob NVARCHAR(20),
  country NVARCHAR(80), gender NVARCHAR(10), photoKey NVARCHAR(256),
  avatarKey NVARCHAR(256), avatarStatus NVARCHAR(20),
  createdAt NVARCHAR(40), updatedAt NVARCHAR(40), avatarReadyAt NVARCHAR(40));
IF OBJECT_ID('dbo.otps','U') IS NULL CREATE TABLE dbo.otps (
  email NVARCHAR(256) PRIMARY KEY, codeHash NVARCHAR(128), expiresAt BIGINT,
  attempts INT NOT NULL DEFAULT 0, purpose NVARCHAR(20));
IF OBJECT_ID('dbo.progress','U') IS NULL CREATE TABLE dbo.progress (
  userId NVARCHAR(36) PRIMARY KEY, data NVARCHAR(MAX));
IF OBJECT_ID('dbo.feedback','U') IS NULL CREATE TABLE dbo.feedback (
  id NVARCHAR(36) PRIMARY KEY, userId NVARCHAR(36), stage NVARCHAR(80),
  rating INT, [text] NVARCHAR(MAX), source NVARCHAR(20), createdAt NVARCHAR(40));
IF OBJECT_ID('dbo.analytics','U') IS NULL CREATE TABLE dbo.analytics (
  id NVARCHAR(36) PRIMARY KEY, userId NVARCHAR(36), [type] NVARCHAR(80),
  payload NVARCHAR(MAX), createdAt NVARCHAR(40));
`);
}

const userFromRow = (r) => (r ? { ...r, emailVerified: !!r.emailVerified } : null);

export const dbAzure = {
  _getPool: getPool,

  // ---- users ----
  async getUserByEmail(email) {
    const pool = await getPool();
    const r = await pool.request().input("e", email.toLowerCase()).query("SELECT * FROM dbo.users WHERE email=@e");
    return userFromRow(r.recordset[0]);
  },
  async getUserById(id) {
    const pool = await getPool();
    const r = await pool.request().input("id", id).query("SELECT * FROM dbo.users WHERE id=@id");
    return userFromRow(r.recordset[0]);
  },
  async createUser(user) {
    const pool = await getPool();
    await pool.request()
      .input("id", user.id).input("email", user.email).input("ph", user.passwordHash)
      .input("ev", user.emailVerified ? 1 : 0).input("tv", user.tokenVersion || 0).input("ca", user.createdAt)
      .query("INSERT INTO dbo.users (id,email,passwordHash,emailVerified,tokenVersion,createdAt) VALUES (@id,@email,@ph,@ev,@tv,@ca)");
    return user;
  },
  async updateUser(id, patch) {
    const cur = await this.getUserById(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    const pool = await getPool();
    await pool.request()
      .input("id", id).input("ph", next.passwordHash).input("ev", next.emailVerified ? 1 : 0).input("tv", next.tokenVersion || 0)
      .query("UPDATE dbo.users SET passwordHash=@ph, emailVerified=@ev, tokenVersion=@tv WHERE id=@id");
    return next;
  },

  // ---- profiles ----
  async getProfile(userId) {
    const pool = await getPool();
    const r = await pool.request().input("u", userId).query("SELECT * FROM dbo.profiles WHERE userId=@u");
    return r.recordset[0] || null;
  },
  async upsertProfile(userId, patch) {
    const cur = (await this.getProfile(userId)) || { userId };
    const p = { ...cur, ...patch, userId };
    const pool = await getPool();
    await pool.request()
      .input("u", userId).input("cn", p.childName ?? null).input("dob", p.dob ?? null)
      .input("co", p.country ?? null).input("g", p.gender ?? null).input("pk", p.photoKey ?? null)
      .input("ak", p.avatarKey ?? null).input("as", p.avatarStatus ?? null)
      .input("ca", p.createdAt ?? null).input("ua", p.updatedAt ?? null).input("ra", p.avatarReadyAt ?? null)
      .query(`MERGE dbo.profiles AS t USING (SELECT @u AS userId) AS s ON t.userId=s.userId
        WHEN MATCHED THEN UPDATE SET childName=@cn,dob=@dob,country=@co,gender=@g,photoKey=@pk,avatarKey=@ak,avatarStatus=@as,createdAt=@ca,updatedAt=@ua,avatarReadyAt=@ra
        WHEN NOT MATCHED THEN INSERT (userId,childName,dob,country,gender,photoKey,avatarKey,avatarStatus,createdAt,updatedAt,avatarReadyAt)
        VALUES (@u,@cn,@dob,@co,@g,@pk,@ak,@as,@ca,@ua,@ra);`);
    return p;
  },

  // ---- otps ----
  async saveOtp(email, rec) {
    const pool = await getPool();
    await pool.request()
      .input("e", email.toLowerCase()).input("ch", rec.codeHash).input("ea", rec.expiresAt)
      .input("at", rec.attempts || 0).input("p", rec.purpose || "signup")
      .query(`MERGE dbo.otps AS t USING (SELECT @e AS email) AS s ON t.email=s.email
        WHEN MATCHED THEN UPDATE SET codeHash=@ch,expiresAt=@ea,attempts=@at,purpose=@p
        WHEN NOT MATCHED THEN INSERT (email,codeHash,expiresAt,attempts,purpose) VALUES (@e,@ch,@ea,@at,@p);`);
    return rec;
  },
  async getOtp(email) {
    const pool = await getPool();
    const r = await pool.request().input("e", email.toLowerCase()).query("SELECT * FROM dbo.otps WHERE email=@e");
    return r.recordset[0] || null;
  },
  async deleteOtp(email) {
    const pool = await getPool();
    await pool.request().input("e", email.toLowerCase()).query("DELETE FROM dbo.otps WHERE email=@e");
  },
  async bumpOtpAttempts(email) {
    const pool = await getPool();
    await pool.request().input("e", email.toLowerCase()).query("UPDATE dbo.otps SET attempts=attempts+1 WHERE email=@e");
  },

  // ---- progress ----
  async getProgress(userId) {
    const pool = await getPool();
    const r = await pool.request().input("u", userId).query("SELECT data FROM dbo.progress WHERE userId=@u");
    const row = r.recordset[0];
    return row ? JSON.parse(row.data) : null;
  },
  async saveProgress(userId, data) {
    const pool = await getPool();
    await pool.request().input("u", userId).input("d", JSON.stringify(data))
      .query(`MERGE dbo.progress AS t USING (SELECT @u AS userId) AS s ON t.userId=s.userId
        WHEN MATCHED THEN UPDATE SET data=@d
        WHEN NOT MATCHED THEN INSERT (userId,data) VALUES (@u,@d);`);
    return data;
  },

  // ---- feedback / analytics ----
  async addFeedback(rec) {
    const pool = await getPool();
    await pool.request()
      .input("id", rec.id).input("u", rec.userId).input("st", rec.stage).input("r", rec.rating)
      .input("t", rec.text || "").input("s", rec.source || "stage").input("ca", rec.createdAt)
      .query("INSERT INTO dbo.feedback (id,userId,stage,rating,[text],source,createdAt) VALUES (@id,@u,@st,@r,@t,@s,@ca)");
    return rec;
  },
  async addAnalytics(rec) {
    const pool = await getPool();
    await pool.request()
      .input("id", rec.id).input("u", rec.userId ?? null).input("ty", rec.type)
      .input("p", JSON.stringify(rec.payload ?? {})).input("ca", rec.createdAt)
      .query("INSERT INTO dbo.analytics (id,userId,[type],payload,createdAt) VALUES (@id,@u,@ty,@p,@ca)");
    return rec;
  },
};
