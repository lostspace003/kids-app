// Azure Communication Services Email implementation (wired in Phase 6).
// Requires a verified sender domain (gennoor.com via DNS, or an Azure-managed
// subdomain). @azure/communication-email is imported dynamically.
import { azure } from "./config.js";

let clientPromise = null;

async function getClient() {
  if (!azure.acsConnectionString) {
    throw new Error("ACS_CONNECTION_STRING is not set");
  }
  if (!clientPromise) {
    const { EmailClient } = await import("@azure/communication-email");
    clientPromise = Promise.resolve(new EmailClient(azure.acsConnectionString));
  }
  return clientPromise;
}

export const emailAzure = {
  async send({ to, subject, text, html }) {
    const client = await getClient();
    const poller = await client.beginSend({
      senderAddress: azure.emailSender,
      content: { subject, plainText: text, html: html || undefined },
      recipients: { to: [{ address: to }] },
    });
    await poller.pollUntilDone();
    return { ok: true };
  },
};
