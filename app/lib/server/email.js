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
  const subject = "Your Safar-e-Anbiya verification code";
  const text =
    `Assalamu alaikum,\n\n` +
    `Your verification code is: ${code}\n\n` +
    `It expires in 10 minutes. Enter it to finish setting up your child's ` +
    `account on Safar-e-Anbiya.\n\n` +
    `If you didn't request this, you can ignore this email.\n\n` +
    `Questions? Contact us at ${CONTACT_EMAIL}.`;
  const html =
    `<p>Assalamu alaikum,</p>` +
    `<p>Your verification code is:</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>` +
    `<p>It expires in 10 minutes. Enter it to finish setting up your child's ` +
    `account on <strong>Safar-e-Anbiya</strong>.</p>` +
    `<p style="color:#666;font-size:13px">If you didn't request this, you can ` +
    `ignore this email. Questions? Contact ${CONTACT_EMAIL}.</p>`;
  return email.send({ to, subject, text, html });
}

export function sendPasswordResetEmail(to, code) {
  const subject = "Your Safar-e-Anbiya password reset code";
  const text =
    `Assalamu alaikum,\n\n` +
    `We received a request to reset your Safar-e-Anbiya password.\n\n` +
    `Your password reset code is: ${code}\n\n` +
    `It expires in 10 minutes. Enter it to choose a new password.\n\n` +
    `If you didn't request this, you can safely ignore this email — your ` +
    `password will stay unchanged.\n\n` +
    `Questions? Contact us at ${CONTACT_EMAIL}.`;
  const html =
    `<p>Assalamu alaikum,</p>` +
    `<p>We received a request to reset your <strong>Safar-e-Anbiya</strong> password.</p>` +
    `<p>Your password reset code is:</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>` +
    `<p>It expires in 10 minutes. Enter it to choose a new password.</p>` +
    `<p style="color:#666;font-size:13px">If you didn't request this, you can ` +
    `safely ignore this email — your password will stay unchanged. ` +
    `Questions? Contact ${CONTACT_EMAIL}.</p>`;
  return email.send({ to, subject, text, html });
}
