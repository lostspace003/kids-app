// ---------------------------------------------------------------------------
// Sync the local narration audio (public/audio) up to Azure Blob — the "media"
// container under the "audio/" prefix, which the app serves via /api/media/audio.
// Run this after `npm run gen:audio` to publish new/changed clips.
//
// Auth: uses the Azure CLI (`az login`) to fetch the account key — no secrets in
// the repo. Override the target with AZURE_STORAGE_ACCOUNT / AZURE_STORAGE_RG.
//
//   npm run sync:audio
// ---------------------------------------------------------------------------
import { execSync } from "node:child_process";

const ACC = process.env.AZURE_STORAGE_ACCOUNT || "gennoormediab5ae1c";
const RG = process.env.AZURE_STORAGE_RG || "rg-gennoor-tech";

const key = execSync(
  `az storage account keys list --account-name ${ACC} --resource-group ${RG} --query "[0].value" -o tsv`,
  { encoding: "utf8" }
).replace(/\s/g, "");
if (!key) { console.error("Could not fetch the storage key via az — are you `az login`'d?"); process.exit(1); }

console.log(`Syncing public/audio -> ${ACC}/media/audio (overwrite) ...`);
execSync(
  `az storage blob upload-batch --account-name ${ACC} --account-key ${key} --destination media --destination-path audio --source public/audio --overwrite true --output none`,
  { stdio: "inherit" }
);
console.log("Done. Clips are live at /api/media/audio/<hash>.mp3");
