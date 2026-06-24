// Repository facade. Picks the local (JSON-file) or Azure SQL implementation
// based on SERVICE_MODE. All server code imports `db` from here and never
// touches a concrete implementation directly.

import { MODE } from "./config.js";
import { dbLocal } from "./db-local.js";

let _db = dbLocal;
if (MODE === "azure") {
  // Lazy: only pull in the mssql-backed impl when actually in azure mode.
  const { dbAzure } = await import("./db-azure.js");
  _db = dbAzure;
}

export const db = _db;
