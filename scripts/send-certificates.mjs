// ---------------------------------------------------------------------------
// Completion-certificate agent. Run weekly by GitHub Actions (Sun 09:00 IST).
//
// For every child who has completed all prophets and hasn't been certified yet
// (others are skipped), this:
//   1. asks gpt-5.4 (Azure OpenAI) for a warm, personalised certificate
//      paragraph + a short HTML email,
//   2. renders an HTML certificate (with the child's avatar + our branding) to
//      PDF via headless Chrome,
//   3. emails it via Azure Communication Services (CC admin@gennoor.com),
//   4. records the certificate so the child is never emailed twice.
//
// DRY_RUN=1 -> generate + render + save to ./cert-out locally; no email, no DB
// write. Used for local testing (email send + the cron are not tested locally).
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import sql from "mssql";
import puppeteer from "puppeteer";
import { BlobServiceClient } from "@azure/storage-blob";
import { EmailClient } from "@azure/communication-email";
import { PROPHET_DATA } from "../app/data/prophets-data.js";

const DRY = process.env.DRY_RUN === "1";
const TOTAL = PROPHET_DATA.length; // 25
const ADMIN_CC = process.env.ADMIN_CC || "admin@gennoor.com";
const E = {
  sql: process.env.AZURE_SQL_CONNECTION_STRING,
  storage: process.env.AZURE_STORAGE_CONNECTION_STRING,
  container: process.env.AZURE_STORAGE_CONTAINER || "media",
  acs: process.env.ACS_CONNECTION_STRING,
  sender: process.env.ACS_EMAIL_SENDER,
  oaEndpoint: (process.env.OPENAI_ENDPOINT || "").replace(/\/$/, ""),
  oaKey: process.env.OPENAI_KEY,
  oaDep: process.env.OPENAI_DEPLOYMENT || "gpt-54",
  oaVer: process.env.OPENAI_API_VERSION || "2024-08-01-preview",
};

function ageYears(dob) {
  if (!dob) return null;
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return Math.max(0, a);
}

function fileDataUri(p, mime) {
  try { return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`; } catch { return ""; }
}

async function avatarDataUri(profile, container) {
  if ((profile.avatarSource === "photo" || profile.avatarKey) && profile.avatarKey && container) {
    try {
      const buf = await container.getBlockBlobClient(profile.avatarKey).downloadToBuffer();
      return `data:image/webp;base64,${buf.toString("base64")}`;
    } catch {}
  }
  const def = (profile.defaultAvatar || "/huzaifa.webp").replace(/^\//, "");
  return fileDataUri(path.resolve("public", def), "image/webp");
}

// gpt-5.4 "agent": warm, child-appropriate, returns strict JSON.
async function generateContent(childName) {
  if (!E.oaEndpoint || !E.oaKey) {
    return {
      paragraph: `${childName} has journeyed, with light and love, through the lives of all twenty-five prophets — learning patience, kindness, and trust in Allah. MashaAllah!`,
      emailSubject: `MashaAllah ${childName} — your Safar-e-Anbiya certificate`,
      emailIntro: `${childName} has completed the whole Journey of the Prophets — all twenty-five, peace be upon them. We are overjoyed to share in this beautiful milestone.`,
    };
  }
  const url = `${E.oaEndpoint}/openai/deployments/${E.oaDep}/chat/completions?api-version=${E.oaVer}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": E.oaKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You write warm, sincere, child-appropriate Islamic congratulatory content for a kids' learning app called Safar-e-Anbiya (Journey of the Prophets). Keep it gentle, joyful, and respectful. Avoid theological rulings. Return STRICT JSON only." },
        { role: "user", content: `A child named "${childName}" has completed the journey through all 25 prophets (peace be upon them). Return a JSON object with exactly these keys: "paragraph" (2-3 warm sentences for a printed certificate, naming the child), "emailSubject" (short, warm), "emailIntro" (1-2 warm plain-text sentences for the start of a congratulatory email to the family, naming the child; no HTML).` },
      ],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const txt = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(txt);
}

function certificateHtml({ childName, age, dateStr, paragraph, avatar, emblem }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif}
  body{width:1122px;height:793px;background:radial-gradient(120% 100% at 50% 0%,#1b1340,#0b0720);color:#f4eede;position:relative;overflow:hidden}
  .frame{position:absolute;inset:28px;border:3px solid #f5c451;border-radius:18px;box-shadow:inset 0 0 0 2px rgba(245,196,81,.3)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px}
  .emblem{width:120px;height:120px;margin-bottom:8px}
  .brand{font-family:'Fredoka',sans-serif;letter-spacing:2px;color:#f5c451;font-size:22px;margin-bottom:6px}
  h1{font-size:46px;color:#fff;margin:10px 0 4px}
  .sub{letter-spacing:6px;font-size:14px;color:rgba(244,238,222,.7);text-transform:uppercase;margin-bottom:22px}
  .avatar{width:140px;height:140px;border-radius:50%;object-fit:cover;border:4px solid #f5c451;margin:6px 0 12px}
  .name{font-size:40px;color:#f5c451;font-weight:bold;margin:6px 0}
  .para{max-width:760px;font-size:18px;line-height:1.6;color:#f0ead8;margin:10px 0}
  .dua{margin-top:14px;padding:14px 26px;border-radius:14px;background:rgba(245,196,81,.08);border:1px solid rgba(245,196,81,.3)}
  .dua-ar{font-size:34px;color:#f5c451;line-height:1.5;direction:rtl}
  .dua-tr{font-size:15px;color:#cfc8b8;font-style:italic;margin-top:4px}
  .dua-mn{font-size:15px;color:#f0ead8;margin-top:2px}
  .foot{position:absolute;bottom:46px;left:0;right:0;display:flex;justify-content:space-between;padding:0 90px;font-size:14px;color:rgba(244,238,222,.65)}
  </style></head><body><div class="frame"></div><div class="wrap">
    ${emblem ? `<img class="emblem" src="${emblem}"/>` : ""}
    <div class="brand">SAFAR-E-ANBIYA · JOURNEY OF THE PROPHETS</div>
    <h1>Certificate of Completion</h1>
    <div class="sub">Awarded with love and du'a</div>
    ${avatar ? `<img class="avatar" src="${avatar}"/>` : ""}
    <div class="name">${childName}</div>
    <div class="para">${paragraph}</div>
    <div class="dua">
      <div class="dua-ar">رَبِّ زِدْنِي عِلْمًا</div>
      <div class="dua-tr">Rabbi zidnī ‘ilmā</div>
      <div class="dua-mn">“My Lord, increase me in knowledge.” — Qur’an 20:114</div>
    </div>
    <div class="foot"><span>${dateStr}</span><span>gennoor.com · admin@gennoor.com</span></div>
  </div></body></html>`;
}

// A polished, email-client-safe HTML email (table layout, inline styles,
// hosted emblem). `intro` is the warm personalised line from gpt-5.4.
function buildEmailHtml(childName, intro) {
  return `<div style="margin:0;padding:0;background:#0b0720">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0b0720;padding:24px 0">
   <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#140e2e;border:1px solid rgba(245,196,81,.3);border-radius:18px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">
      <tr><td align="center" style="padding:30px 28px 6px">
        <img src="https://safar-anbiya.gennoor.com/brand/png/emblem-256.png" width="74" height="74" alt="Safar-e-Anbiya" style="display:block"/>
        <div style="color:#f5c451;letter-spacing:2px;font-size:12px;margin-top:10px">SAFAR-E-ANBIYA &middot; JOURNEY OF THE PROPHETS</div>
      </td></tr>
      <tr><td style="padding:6px 34px 4px">
        <h1 style="color:#f4eede;font-size:25px;text-align:center;margin:16px 0 8px">MashaAllah, ${childName}! 🌙</h1>
        <p style="color:#cfc8b8;font-size:15px;line-height:1.75;text-align:center;margin:0 0 12px">${intro}</p>
        <p style="color:#cfc8b8;font-size:15px;line-height:1.75;text-align:center;margin:0 0 16px">The <strong style="color:#f5c451">Certificate of Completion</strong> is attached as a PDF — print it, share it, and celebrate this beautiful milestone together.</p>
        <div style="text-align:center;margin:6px 0 14px">
          <span style="display:inline-block;background:rgba(245,196,81,.12);border:1px solid rgba(245,196,81,.35);color:#f5c451;border-radius:999px;padding:9px 20px;font-size:14px">🏅 All 25 prophets — complete</span>
        </div>
        <div style="text-align:center;margin:10px 0 4px">
          <div style="color:#f5c451;font-family:Georgia,serif;font-size:26px;direction:rtl">رَبِّ زِدْنِي عِلْمًا</div>
          <div style="color:#8f88a0;font-size:13px;font-style:italic;margin-top:4px">Rabbi zidnī ‘ilmā — “My Lord, increase me in knowledge.”</div>
        </div>
      </td></tr>
      <tr><td align="center" style="padding:18px 28px 26px;border-top:1px solid rgba(245,196,81,.15)">
        <div style="color:#8f88a0;font-size:12px">Safar-e-Anbiya &middot; <a href="https://safar-anbiya.gennoor.com" style="color:#f5c451;text-decoration:none">safar-anbiya.gennoor.com</a> &middot; admin@gennoor.com</div>
      </td></tr>
    </table>
   </td></tr>
  </table>
 </div>`;
}

async function main() {
  if (!E.sql) throw new Error("AZURE_SQL_CONNECTION_STRING required");
  const pool = await sql.connect(E.sql);
  // ensure certificates table exists
  await pool.request().batch("IF OBJECT_ID('dbo.certificates','U') IS NULL CREATE TABLE dbo.certificates (userId NVARCHAR(36) PRIMARY KEY, issuedAt NVARCHAR(40), pdfKey NVARCHAR(256));");

  const rows = (await pool.request().query(`
    SELECT u.id, u.email, p.childName, p.dob, p.gender, p.avatarKey, p.avatarSource, p.defaultAvatar, pr.data
    FROM dbo.users u
    JOIN dbo.profiles p ON u.id=p.userId
    JOIN dbo.progress pr ON u.id=pr.userId
    LEFT JOIN dbo.certificates c ON u.id=c.userId
    WHERE u.emailVerified=1 AND u.flagged=0 AND c.userId IS NULL`)).recordset;

  const eligible = rows.filter((r) => {
    try { return (JSON.parse(r.data)?.completed || []).length >= TOTAL; } catch { return false; }
  });
  console.log(`${rows.length} not-yet-certified; ${eligible.length} have completed all ${TOTAL}.`);
  if (!eligible.length) { console.log("Nothing to do."); await pool.close(); return; }

  let container = null;
  if (E.storage) container = BlobServiceClient.fromConnectionString(E.storage).getContainerClient(E.container);
  const emailClient = E.acs ? new EmailClient(E.acs) : null;
  const emblem = fileDataUri(path.resolve("public/brand/png/emblem-512.png"), "image/png");
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  if (DRY) fs.mkdirSync("cert-out", { recursive: true });

  for (const r of eligible) {
    try {
      const content = await generateContent(r.childName);
      const avatar = await avatarDataUri(r, container);
      const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const html = certificateHtml({ childName: r.childName, age: ageYears(r.dob), dateStr, paragraph: content.paragraph, avatar, emblem });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({ width: "1122px", height: "793px", printBackground: true });
      await page.close();

      const emailBody = buildEmailHtml(r.childName, content.emailIntro || `${r.childName} has completed the whole journey. MashaAllah!`);

      if (DRY) {
        const safe = r.childName.replace(/[^\w]+/g, "_");
        fs.writeFileSync(`cert-out/${safe}.pdf`, pdf);
        fs.writeFileSync(`cert-out/${safe}.email.html`, emailBody);
        console.log(`  [dry] ${r.email} -> cert-out/${safe}.pdf (${Math.round(pdf.length / 1024)}KB), subject: ${content.emailSubject}`);
        continue;
      }

      if (container) await container.getBlockBlobClient(`certificates/${r.id}.pdf`).uploadData(pdf);
      if (emailClient) {
        const poller = await emailClient.beginSend({
          senderAddress: E.sender,
          content: { subject: content.emailSubject || `MashaAllah ${r.childName}!`, html: emailBody },
          recipients: { to: [{ address: r.email }], cC: [{ address: ADMIN_CC }] },
          attachments: [{ name: `Safar-Anbiya-Certificate-${r.childName}.pdf`, contentType: "application/pdf", contentInBase64: pdf.toString("base64") }],
        });
        await poller.pollUntilDone();
      }
      await pool.request().input("u", r.id).input("i", new Date().toISOString()).input("k", `certificates/${r.id}.pdf`)
        .query("INSERT INTO dbo.certificates (userId, issuedAt, pdfKey) VALUES (@u,@i,@k)");
      console.log(`  ✓ sent + recorded: ${r.email}`);
    } catch (e) {
      console.error(`  ✗ ${r.email}: ${e.message}`);
    }
  }
  await browser.close();
  await pool.close();
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
