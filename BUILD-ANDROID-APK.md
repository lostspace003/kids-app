# Turning Safar-e-Anbiya into an Android app (APK → Play Store)

The web app is live at **https://safar-anbiya.gennoor.com** (Azure). You do **not**
rewrite it — you wrap the live site in a thin Android shell called a **TWA
(Trusted Web Activity)**. The app opens your hosted website full-screen, so it's
always the same and always up to date.

## Is this route current? — Yes
- **APK now** → install directly on any Android phone (testing / sharing).
- **Play Store later** → the same tool also produces an **AAB** file (Google Play
  needs an AAB, not an APK, for new apps). So **APK now → Play Store later works**.
- **iOS later** → same idea but a separate step (needs a Mac + Apple Developer
  account). Not part of the Android flow.

## Easiest tool: PWABuilder (free, by Microsoft)

1. Go to **https://www.pwabuilder.com**
2. Paste **`https://safar-anbiya.gennoor.com`** → **Start**.
3. **Package For Stores → Android** → **Download**.
4. The zip contains:
   - **`app-release-signed.apk`** → copy to phone, tap to install (enable
     "Install unknown apps" once). This is your app.
   - **`app-release.aab`** → keep for Google Play later.
   - **`assetlinks.json`** + signing key → keep safe (needed for full-screen +
     for re-signing future updates).

## Prerequisite (for a clean, full-screen app)

PWABuilder needs the site to expose:
1. A **web app manifest** (`/manifest.webmanifest`) + icons — so it can package it.
2. A **`/.well-known/assetlinks.json`** file — so the app opens with **no browser
   address bar** (verifies the app owns the domain).

Recommended flow:
1. Add the manifest + icon links + the asset-links route to the app → deploy.
2. Run PWABuilder → download → it gives you `assetlinks.json` (contains your
   app's SHA-256 signing fingerprint).
3. Host that file's contents at **`/.well-known/assetlinks.json`** on the site →
   deploy.
4. Reinstall the APK → it opens full-screen, no browser bar.

(The brand icons already exist under `public/brand/png/` — `icon-192.png`,
`icon-512.png`, `icon-maskable-512.png` — ready for the manifest.)

## Publishing to Google Play (later)
1. Create a Google Play Developer account (one-time **$25**).
2. Play Console → create app → upload the **`app-release.aab`**.
3. Fill store listing (name, description, screenshots, icon, privacy policy).
4. Submit for review.

## Notes
- The device needs Chrome (or Android System WebView) — standard on Android.
- Because it's a TWA, any change you deploy to the website shows in the app
  instantly; you only rebuild the APK if you change the icon/name/manifest.
- Alternative tool (also fine): Google's **Bubblewrap** CLI — same TWA result,
  command-line instead of a website.
