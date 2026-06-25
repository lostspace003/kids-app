# Google Play store listing — Safar Anbiya

Copy-paste fields for the Play Console **Main store listing**, plus the
**Data safety** and **App content** answers you'll be asked for.

---

## App title  (max 30 chars)
```
Safar Anbiya: Prophets
```
*(22 chars. Alternative if you prefer: `Safar Anbiya – Prophets` = 23.)*

## Short description  (max 80 chars)
```
A gentle, gamified journey through all 25 prophets — Islamic stories for kids.
```
*(78 chars.)*

## Full description  (max 4000 chars)
```
Safar Anbiya — Journey of the Prophets is a gentle, gamified Islamic learning
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
• A Certificate of Completion — finish all 25 prophets and receive a personalised
  certificate to print and treasure.
• Choose your language — listen in English or Urdu (male or female narration).

MADE FOR FAMILIES
• Set up by a parent — a parent account keeps your child's progress safe across
  devices.
• A calm, ad-free space — no third-party ads and no cross-app tracking.
• Personal touch — give your child a cartoon avatar to guide their journey.

Safar Anbiya turns timeless stories into a joyful habit — helping children grow
in faith, kindness, and knowledge, at their own pace.

"Rabbi zidni 'ilma — My Lord, increase me in knowledge." (Qur'an 20:114)

Questions or feedback? Email admin@gennoor.com.
```

---

## Graphics (already prepared — `playstore-screenshots/`)
- **App icon (512×512):** `app-icon-512.png`
- **Feature graphic (1024×500):** `feature-graphic-1024x500.png`
- **Phone screenshots (1080×1920):** `final/1-launch.png` … `final/9-certificate.png`
  (Play allows 2–8 phone screenshots — suggested 8: journey-map, story, quran-ayah,
  decision, quiz, reward-badge, certificate, and one of launch/languages.)

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
| Name | Yes | App functionality / personalisation | No | Child's first name/nickname |
| Date of birth | Yes | App functionality | No | Used for age-appropriateness |
| Other info (country, gender) | Yes | App functionality | No | Profile setup |
| Photos | Yes | App functionality | No | Optional; used to generate the avatar |
| App activity (progress) | Yes | App functionality | No | Prophets completed, badges, Noor |
| App info & performance / Device IDs | Only if applicable | — | — | Standard logs only; no analytics/ads SDKs |

Also declare:
- **Data is encrypted in transit:** Yes (HTTPS).
- **Users can request deletion:** Yes (email admin@gennoor.com).
- **No data shared with third parties for advertising.** Service providers
  (Azure, Azure Communication Services, OpenAI/Azure OpenAI) are processors, not
  "sharing" in the Data safety sense — they process on our behalf.

## App content / Families
- This app targets children, so it must join the **Designed for Families /
  Families** program: complete the **Target audience and content** section and
  select age groups that include children.
- Provide the privacy policy URL above.
- Confirm **no ads** (or, if you ever add ads, they must be families-appropriate).
- Complete the **content rating** questionnaire (educational, no objectionable
  content → expect "Everyone").
```
