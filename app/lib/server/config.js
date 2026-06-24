// ---------------------------------------------------------------------------
// Central server config. The app talks to four pluggable services — db,
// storage, email, imagegen — each with a "local" implementation (filesystem /
// console, for development) and an "azure" implementation (wired in Phase 6).
//
// SERVICE_MODE=local  -> JSON-file DB, filesystem blobs, console/outbox email
// SERVICE_MODE=azure  -> Azure SQL, Blob Storage, Communication Services Email
//
// Avatar generation (gpt-image-2) always uses the real Azure OpenAI endpoint
// because that resource is already deployed; it just needs the env vars.
// ---------------------------------------------------------------------------

export const MODE = process.env.SERVICE_MODE === "azure" ? "azure" : "local";

export const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "admin@gennoor.com";

export const imageGen = {
  endpoint: process.env.AZURE_OPENAI_IMAGE_ENDPOINT || "",
  deployment: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || "gpt-image-2",
  apiVersion: process.env.AZURE_OPENAI_IMAGE_API_VERSION || "2025-04-01-preview",
  key: process.env.AZURE_OPENAI_IMAGE_KEY || "",
};

export const azure = {
  sqlConnectionString: process.env.AZURE_SQL_CONNECTION_STRING || "",
  storageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  storageContainer: process.env.AZURE_STORAGE_CONTAINER || "media",
  acsConnectionString: process.env.ACS_CONNECTION_STRING || "",
  emailSender: process.env.ACS_EMAIL_SENDER || "",
};

// Local dev data lives outside the repo (gitignored) so it never ships.
export const LOCAL_DATA_DIR =
  process.env.LOCAL_DATA_DIR ||
  // process.cwd() is the project root when Next runs.
  ".localdata";
