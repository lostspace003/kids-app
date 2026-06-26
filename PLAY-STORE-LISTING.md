# Google Play store listing — Safar-e-Anbiya

Copy-paste fields for the Play Console **Main store listing**, plus the
**Data safety** and **App content** answers you'll be asked for.

---

## App title  (max 30 chars)
```
Safar-e-Anbiya: Prophets
```
*(24 chars. Alternative if you prefer: `Safar-e-Anbiya – Prophets` = 25.)*

## Short description  (max 80 chars)
```
A gentle, gamified journey through all 25 prophets — Islamic stories for kids.
```
*(78 chars.)*

## Full description  (max 4000 chars)
```
Safar-e-Anbiya — Journey of the Prophets is a gentle, gamified Islamic learning
app that walks children through the lives of all 25 prophets (peace be upon
them), one beautiful stop at a time.

Travel a glowing map by the light of your lantern. At each prophet's stop, your
child hears a warmly narrated story, reflects on a kind moral choice, listens to
a related Qur'an verse with clear recitation, and answers a friendly recap quiz —
earning Noor (light) and badges along the way.

WHAT'S INSIDE
• All 25 prophets — a complete, age-appropriate journey from Adam (AS) onward.
• Narrated stories — soft, child-friendly narration you can play, pause, or replay.
• Qur'an verses — a few authentic ayat per prophet, with recitation and meaning.
• Gentle choices — little "what would you do?" moments that nurture good akhlaq.
• Recap quizzes — simple questions that help the lessons stick.
• Rewards that delight — collect Noor, earn badges, and light up each new land.
• A friendly leaderboard — see how you rank by a blend of Noor and your daily
  streak. Children appear by first name and age with a fun icon — never a photo,
  surname, or country — and a parent can hide their child with a PIN-protected opt-out.
• Try before you sign in — preview a story as a guest, then create a free parent
  account to continue and save progress.
• A Certificate of Completion — finish all 25 prophets and receive a personalised
  certificate to print and treasure.
• Choose your language — listen in English or Urdu (male or female narration).

MADE FOR FAMILIES
• Set up by a parent — a parent account keeps your child's progress safe across
  devices.
• A calm, ad-free space — no third-party ads and no cross-app tracking.
• Personal touch — give your child a cartoon avatar to guide their journey.

Safar-e-Anbiya turns timeless stories into a joyful habit — helping children grow
in faith, kindness, and knowledge, at their own pace.

"Rabbi zidni 'ilma — My Lord, increase me in knowledge." (Qur'an 20:114)

Questions or feedback? Email admin@gennoor.com.
```

---

## Graphics (already prepared — `playstore-screenshots/`)
- **App icon (512×512):** `app-icon-512.png`
- **Feature graphic (1024×500):** `feature-graphic-1024x500.png`
- **Phone screenshots (1080×1920):** `final/1-launch.png` … `final/11-guest.png`
  (11 available: launch, journey-map, story, quran-ayah, decision, quiz,
  reward-badge, languages, certificate, **leaderboard**, **guest preview**.
  Play allows 2–8 — suggested 8: journey-map, story, quran-ayah, decision, quiz,
  reward-badge, leaderboard, and one of launch/guest.)

> **Regenerating screenshots.** The phone screenshots are produced automatically
> at exactly 1080×1920 by `scripts/capture-screenshots.mjs` (drives the running
> dev server with Chrome via puppeteer-core). Start the app (`npm run dev`), then
> `node scripts/capture-screenshots.mjs --lang en`. It writes the numbered set
> (`01-…`–`26-…`) and the curated `final/` set. Re-run after any UI change so the
> store art stays current. `final/9-certificate.png` is the completion certificate
> (a separate generated artifact, not an in-app screen).

## Privacy policy URL  (required)
```
https://safar-anbiya.gennoor.com/privacy
```
*(Hosted by the app — `app/privacy/page.jsx`. Deploy before submitting so the URL
is live.)*

## Category & contact
- **App category:** Education (or Educational, under the Family program).
- **Email:** admin@gennoor.com
- **Website:** https://safar-anbiya.gennoor.com

---

## Data safety form — what to declare
The app DOES collect personal data, so answer "Yes" and declare:

| Data type | Collected | Purpose | Shared | Notes |
|-----------|-----------|---------|--------|-------|
| Email address | Yes | Account management | No | Parent's email; verification + certificate emails |
| Name | Yes | App functionality / personalisation | **Yes** | Child's first name; **shown on the public leaderboard** |
| Date of birth | Yes | App functionality | **Yes (age)** | Age shown on the leaderboard; full DOB never shown/shared |
| Other info (country, gender) | Yes | App functionality | No | Profile setup |
| Photos | Yes | App functionality | No | Optional; used to generate the avatar |
| App activity (progress) | Yes | App functionality | No | Prophets completed, badges, Noor |
| App info & performance / Device IDs | Only if applicable | — | — | Standard logs only; no analytics/ads SDKs |

**Leaderboard note (name + age are publicly visible):** the leaderboard shows each
child&rsquo;s **first name and age**, plus their score, streak, and lands completed,
to other users. It does **not** show a photo, surname, full DOB, or country. The
full DOB is used only to compute age and as a hidden server-side tie-breaker. A
child aged ≤10 may show their **cartoon (Ghibli) avatar** instead of an icon — never
the real uploaded photo. A parent can **hide their child** from the leaderboard at
any time, protected by a **4-digit PIN** (stored only as a salted hash; resettable
via an emailed code). Because first name + age are visible to other users, in the
Data safety form mark **Name** and **Date of birth (age)** as **"Shared"** (purpose:
app functionality), or disable the leaderboard before launch if you prefer not to
declare sharing. Guest "preview a story" mode creates no account and stores no
personal data.

Also declare:
- **Data is encrypted in transit:** Yes (HTTPS).
- **Users can request deletion:** Yes (email admin@gennoor.com).
- **No data shared with third parties for advertising.** Service providers
  (Azure, Azure Communication Services, OpenAI/Azure OpenAI) are processors, not
  "sharing" in the Data safety sense — they process on our behalf.

### Ads
- **Contains ads: No.** Ads (Google AdSense) are shown **only on the public
  website to browser visitors** and are suppressed inside the app/TWA, so the
  app itself contains no ads. They are non-personalised and child-directed.
  See `ADS-SETUP.md`. (If you ever show ads *inside* the app, you must change
  this answer to "Yes" and meet the Families ads requirements.)

## App content / Families
- This app targets children, so it must join the **Designed for Families /
  Families** program: complete the **Target audience and content** section and
  select age groups that include children.
- Provide the privacy policy URL above.
- Confirm **no ads** (or, if you ever add ads, they must be families-appropriate).
- Complete the **content rating** questionnaire (educational, no objectionable
  content → expect "Everyone").

---

## Submission checklist (your steps in Play Console)

Everything in this repo (listing copy, screenshots, icon, feature graphic,
privacy policy, build guides) is ready. These remaining steps need your accounts,
payment, and signing keys, so they can't be automated:

- [ ] **Deploy the site** and confirm CI/CD is green, so
      `https://safar-anbiya.gennoor.com` and `…/privacy` are live. (This deploy
      also adds the new `handle` / `lbOptOut` / `lbPinHash` profile columns.)
- [ ] **Play Console account** — create it ($25 one-time) and add the app.
- [ ] **Build & upload the signed AAB** — follow `BUILD-ANDROID-APK.md` (TWA /
      Bubblewrap). Keep the signing key safe; enable Play App Signing.
- [ ] **Main store listing** — paste the title, short & full description, and
      upload `playstore-screenshots/` (icon, feature graphic, 2–8 phone shots).
- [ ] **Data safety form** — fill from the table above (declare email, name, DOB,
      country, photo, app activity; encrypted in transit; deletion on request; no
      ads/sharing for advertising). The leaderboard/guest/PIN add no new data.
- [ ] **App content** — privacy policy URL, **content rating** questionnaire, and
      join **Designed for Families** (target age groups include children).
- [ ] **App access (demo account)** — login is required, so provide a reviewer
      test email + password under *App content → App access*. **Most common
      rejection cause if missing.**
- [ ] **Ads declaration** — "Contains ads: No" (ads are website-only). Set the
      AdSense ID later per `ADS-SETUP.md` if you want site ads.
- [ ] **iOS (optional)** — same listing assets; follow `BUILD-IOS-APP.md`
      (Codemagic, no Mac needed). iPhone screenshots: re-run the capture script
      with the iPhone viewport noted in that guide.
- [ ] **Submit for review** — Android review ~1–3 days.
