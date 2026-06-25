
# Web ads (Google AdSense) — setup

Ads are **web-only**: they show to browser visitors of `safar-anbiya.gennoor.com`
and are **suppressed inside the installed app/TWA** (AdSense forbids ads in
apps/WebViews, and this is a kids app). Because the app shows no ads, the Play
listing stays **"contains ads: No."**

Everything is **off until you set the env vars below**, so the code is already
safe to deploy.

## How it works (code)
- `app/lib/ads.js` — gating: needs a publisher id AND a real browser (not the TWA).
- `app/components/ads/AdsenseScript.jsx` — loads AdSense, forces **non-personalised** ads. Wired in `app/layout.jsx`.
- `app/components/ads/AdSlot.jsx` — a reusable responsive ad unit.
- Example placement: bottom of the intro card (`app/components/AboutIntro.jsx`).

## One-time AdSense steps
1. Create/verify a **Google AdSense** account for `safar-anbiya.gennoor.com` and
   wait for approval.
2. In AdSense → **Privacy & messaging / Tag for child-directed treatment**, mark
   the site as **directed to children** (this is required — our code forces
   non-personalised ads, but child-directed treatment is set at the account/site
   level for AdSense).
3. Add an **`ads.txt`** file at the site root. Copy the exact line AdSense gives
   you (looks like `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`)
   into `public/ads.txt`, then deploy. (Without it, ad fill is reduced.)
4. Create one or more **ad units** (Display → responsive). Each gives a **slot id**.

## Turn it on (Azure → Web App → Configuration → Application settings)
Add these app settings (then Save → app restarts):

| Setting | Value |
|---------|-------|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-XXXXXXXXXXXXXXXX` (your publisher id) |
| `NEXT_PUBLIC_ADSENSE_SLOT_INTRO` | the slot id of the intro ad unit |

> These are `NEXT_PUBLIC_*` so they're read at build time. Because the Azure
> build runs on deploy, set them and then trigger a deploy (push or
> **Deploy to Azure Web App** workflow) so they're baked in.

## Adding more placements
Import and drop in a slot anywhere (web-only, auto-hidden in the app):
```jsx
import AdSlot from "./ads/AdSlot";
{process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOO && (
  <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOO} />
)}
```
Keep ads **out of the child's story/quiz flow** — prefer parent-facing or
between-session spots. Avoid placements that could cause accidental taps.

## Compliance recap
- Non-personalised ads only (forced in code).
- Child-directed treatment set at the AdSense account level.
- No ads inside the app/TWA (gated to browsers).
- Privacy policy already discloses this (`/privacy`).
