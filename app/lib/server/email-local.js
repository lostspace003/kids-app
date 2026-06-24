// Local email "sender": logs to the console and appends to .localdata/outbox
// so you can read OTP codes during development without a real mailbox.
import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_DATA_DIR } from "./config.js";

const OUTBOX = path.join(process.cwd(), LOCAL_DATA_DIR, "outbox.log");

export const emailLocal = {
  async send({ to, subject, text }) {
    const stamp = new Date().toISOString();
    const entry = `\n[${stamp}] TO: ${to}\nSUBJECT: ${subject}\n${text}\n${"-".repeat(60)}`;
    // eslint-disable-next-line no-console
    console.log("\n📧 [local email]" + entry + "\n");
    await fs.mkdir(path.dirname(OUTBOX), { recursive: true });
    await fs.appendFile(OUTBOX, entry, "utf8");
    return { ok: true };
  },
};
