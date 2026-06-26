// Azure Blob Storage implementation (wired in Phase 6). Same interface as
// storage-local.js. @azure/storage-blob is imported dynamically.
import { azure } from "./config.js";

let containerPromise = null;

async function getContainer() {
  if (!azure.storageConnectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }
  if (!containerPromise) {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const svc = BlobServiceClient.fromConnectionString(
      azure.storageConnectionString
    );
    const c = svc.getContainerClient(azure.storageContainer);
    containerPromise = c.createIfNotExists().then(() => c);
  }
  return containerPromise;
}

export const storageAzure = {
  async put(key, buffer) {
    const c = await getContainer();
    await c.getBlockBlobClient(key).uploadData(buffer);
    return key;
  },
  async get(key) {
    const c = await getContainer();
    return c.getBlockBlobClient(key).downloadToBuffer();
  },
  async exists(key) {
    const c = await getContainer();
    return c.getBlockBlobClient(key).exists();
  },
  async delete(key) {
    if (!key) return;
    const c = await getContainer();
    await c.getBlockBlobClient(key).deleteIfExists();
  },
};
