// Email facade + the OTP message template (parent-facing copy).
import { MODE, CONTACT_EMAIL } from "./config.js";
import { emailLocal } from "./email-local.js";

let _email = emailLocal;
if (MODE === "azure") {
  const { emailAzure } = await import("./email-azure.js");
  _email = emailAzure;
}

export const email = _email;

export function sendOtpEmail(to, code) {
  const subject = "Your Prophets' Journey verification code";
  const text =
    `Assalamu alaikum,\n\n` +
    `Your verification code is: ${code}\n\n` +
    `It expires in 10 minutes. Enter it to finish setting up your child's ` +
    `account on Prophets' Journey.\n\n` +
    `If you didn't request this, you can ignore this email.\n\n` +
    `Questions? Contact us at ${CONTACT_EMAIL}.`;
  const html =
    `<p>Assalamu alaikum,</p>` +
    `<p>Your verification code is:</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>` +
    `<p>It expires in 10 minutes. Enter it to finish setting up your child's ` +
    `account on <strong>Prophets' Journey</strong>.</p>` +
    `<p style="color:#666;font-size:13px">If you didn't request this, you can ` +
    `ignore this email. Questions? Contact ${CONTACT_EMAIL}.</p>`;
  return email.send({ to, subject, text, html });
}
