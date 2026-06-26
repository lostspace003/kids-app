# Publishing Safar Anbiya to the App Store — WITHOUT a Mac

Your app is a hosted PWA (`https://safar-anbiya.gennoor.com`). For iOS you wrap it
in a thin native shell (a `WKWebView` app), exactly like the Android TWA. The only
hard problem on Windows is that Apple normally requires a Mac + Xcode to **build**
and **sign** the app.

This guide removes the Mac using **Codemagic**, a cloud CI/CD service that owns the
Mac build machines for you. You drive everything from your Windows PC + a browser.

> **You still need:** an **Apple Developer account — $99/year** (this is Apple's fee,
> not Codemagic's). There is no legal way to publish to the App Store without it.

---

## What you'll end up with
- A signed `.ipa` (the iOS app file) built in the cloud.
- It auto-uploaded to **TestFlight** (Apple's test track) and **App Store Connect**.
- The listing submitted for review — all without ever touching a Mac.

## The 4 accounts/tools you'll use
| Tool | Purpose | Cost |
|---|---|---|
| **Apple Developer** | Legal publisher identity + signing | $99/year |
| **App Store Connect** | The store listing + review submission | included |
| **GitHub** | Holds the iOS project code (Codemagic reads it) | free |
| **Codemagic** | Cloud Mac that builds + signs + uploads | free tier (500 min/mo) |

---

# STEP 1 — Create your Apple Developer account
1. Go to **https://developer.apple.com/programs/enroll/**
2. Sign in with an Apple ID (create one if needed; turn on 2-factor auth).
3. Choose **Individual** (simplest; uses your name) or **Organization** (needs a
   D-U-N-S number, like the Google org path). **Individual is fine** for you.
4. Pay the **$99**. Enrollment approval can take a few hours to ~2 days.

✅ Done when you can log into **https://appstoreconnect.apple.com**.

---

# STEP 2 — Generate the iOS project from PWABuilder
1. Go to **https://www.pwabuilder.com**
2. Paste **`https://safar-anbiya.gennoor.com`** → **Start**.
3. **Package For Stores → iOS** → fill the fields:
   - **Bundle ID**: `com.gennoor.safaranbiya` (reverse-domain, lowercase, no spaces —
     **write it down, you reuse it everywhere**).
   - **App name**: `Safar Anbiya`
   - **URL / Start URL**: `https://safar-anbiya.gennoor.com`
4. **Download** → unzip. You now have an **Xcode project folder** (Swift source that
   loads your site in a full-screen web view).

> Keep this folder. You will push it to GitHub in Step 4 — you do **not** open it in
> Xcode (you don't have a Mac; Codemagic opens it for you).

---

# STEP 3 — Register the app + bundle ID in Apple
### 3a. Register the Bundle ID
1. **https://developer.apple.com/account** → **Certificates, IDs & Profiles** →
   **Identifiers** → **+**.
2. Select **App IDs → App** → Continue.
3. **Description**: `Safar Anbiya`, **Bundle ID**: *Explicit* →
   `com.gennoor.safaranbiya` (must match Step 2 exactly).
4. Register.

### 3b. Create the App Store Connect listing record
1. **https://appstoreconnect.apple.com** → **Apps → + → New App**.
2. **Platform**: iOS. **Name**: `Safar Anbiya`. **Primary language**: English.
3. **Bundle ID**: pick `com.gennoor.safaranbiya` from the dropdown.
4. **SKU**: any unique string, e.g. `safaranbiya-001`.
5. Create. (You'll fill the listing details later, in Step 8.)

---

# STEP 4 — Put the project on GitHub
Codemagic builds from a Git repo.

1. Create a **new private repo** on GitHub, e.g. `safar-anbiya-ios`.
2. From your Windows PC, inside the unzipped iOS folder:
   ```bash
   git init
   git add .
   git commit -m "PWABuilder iOS project for Safar Anbiya"
   git branch -M main
   git remote add origin https://github.com/<your-user>/safar-anbiya-ios.git
   git push -u origin main
   ```
3. Confirm the files (the `.xcodeproj` and `Sources`/`App` folders) appear on GitHub.

---

# STEP 5 — Create an App Store Connect API key (the "no-Mac" magic)
This key lets Codemagic **sign** the app and **upload** it without you generating
certificates on a Mac.

1. **App Store Connect → Users and Access → Integrations (or Keys) → App Store
   Connect API → +**.
2. **Name**: `Codemagic`. **Access**: **App Manager**.
3. **Generate** → **download the `.p8` key file** (you can only download it ONCE —
   save it safely).
4. Note the **Key ID** and the **Issuer ID** shown on that page.

Keep these three things: the **`.p8` file**, the **Key ID**, the **Issuer ID**.

---

# STEP 6 — Set up Codemagic
1. Go to **https://codemagic.io** → **Sign up with GitHub** → authorize.
2. **Add application** → pick your **`safar-anbiya-ios`** repo →
   project type **iOS App (Xcode / other)**.

### 6a. Connect Apple (paste the API key from Step 5)
1. Codemagic → **Teams / Integrations → Apple Developer Portal** (or
   **Settings → Code signing identities → App Store Connect**).
2. **Add key**: upload the **`.p8`**, paste the **Key ID** and **Issuer ID**.
3. This enables **automatic code signing** — Codemagic creates the certificate and
   provisioning profile in the cloud for you.

### 6b. Configure the build (UI workflow editor — easiest)
In the app's **Workflow settings**:
- **Build for platforms**: iOS.
- **Xcode project / workspace**: select the `.xcodeproj` (or `.xcworkspace`) that
  PWABuilder generated.
- **Scheme**: the app scheme (usually the app name).
- **Code signing**: **Automatic** → select your **App Store Connect API key**, and
  the **Bundle ID** `com.gennoor.safaranbiya`.
- **Distribution / Publishing**: enable **App Store Connect** → **TestFlight**.

> Prefer config-as-code? Add a `codemagic.yaml` at the repo root instead — template
> in the Appendix below.

---

# STEP 7 — Run the build
1. Codemagic → your app → **Start new build** → branch `main` → **Start**.
2. Watch the live log (~5–15 min). It will:
   - spin up a Mac VM,
   - install signing,
   - build the `.ipa`,
   - upload it to **TestFlight / App Store Connect**.
3. ✅ Success = a green build with an **`.ipa`** artifact, and the build appears in
   **App Store Connect → your app → TestFlight** a few minutes later (it shows
   "Processing" first).

If the build **fails**, copy the red error from the log and send it to me — the
common ones are scheme name, bundle-ID mismatch, or signing, all fixable.

---

# STEP 8 — Fill the store listing
In **App Store Connect → your app**:
- **App Information**: category (**Education**), content rights.
- **Privacy Policy URL**: you already host one — use that URL.
- **Pricing**: Free.
- **App Privacy**: answer the data-collection questionnaire (declare what your site
  collects — if accounts/OTP, declare email; if ads, declare advertising data).
- **Screenshots**: required sizes — **6.7" iPhone (1290×2796)** and
  **6.5" iPhone (1242×2688)** at minimum. You can produce these on Windows:
  open your site in Chrome DevTools device mode at those resolutions and capture,
  or reuse/resize your existing Play Store screenshots. Easiest: run the repo's
  `scripts/capture-screenshots.mjs` against a running dev server — it captures the
  full flow headlessly. For the iPhone sizes, change the `VIEWPORT` near the top of
  that script (e.g. `{ width: 430, height: 932, deviceScaleFactor: 3 }` → 1290×2796)
  and re-run.
- **Description, keywords, support URL**.
- **Build**: under the version, click **+ Build** → select the TestFlight build from
  Step 7.

---

# STEP 9 — Submit for review
1. Complete the **Age rating** questionnaire.
2. **Add for Review → Submit**.
3. Apple review typically takes **1–3 days**. You get an email on approval/rejection.

---

# ⚠️ The one real risk: App Store Guideline 4.2 ("minimum functionality")
Apple sometimes rejects apps that are *just a website in a web view*. To pass:
- Make sure the app **feels app-like**: works offline (service worker), full-screen,
  app-style navigation — not a plain webpage with browser chrome.
- In the review notes, **describe the interactive features** (the journey/game,
  audio narration, Qur'an recitation, accounts) so the reviewer sees it's a real app,
  not a bookmark.
- Provide a **demo account** if login is required, in **App Review Information**.

Your app is an interactive educational game, which is exactly the kind of content
that passes — a thin wrapper of a static page is the case that gets rejected.

---

# Cost summary
| Item | Cost |
|---|---|
| Apple Developer Program | **$99 / year** |
| Codemagic | **Free** (500 build-min/month; plenty for occasional builds) |
| GitHub | **Free** (private repo) |
| PWABuilder | **Free** |
| **Total to publish** | **$99/year — no Mac, no per-build cost** |

---

# Updating the app later
- **Content/site changes**: appear automatically (the app loads your live site) — no
  rebuild needed.
- **App shell changes** (icon, name, splash, bundle settings): bump the version in the
  Xcode project, push to GitHub, run Codemagic again, submit the new build.

---

# Appendix — optional `codemagic.yaml`
Put this at the repo root instead of using the UI workflow. Replace the placeholders.
```yaml
workflows:
  ios-release:
    name: Safar Anbiya iOS Release
    instance_type: mac_mini_m2
    max_build_duration: 60
    integrations:
      app_store_connect: Codemagic   # the API key name from Step 6a
    environment:
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.gennoor.safaranbiya
      vars:
        BUNDLE_ID: "com.gennoor.safaranbiya"
        XCODE_SCHEME: "Safar Anbiya"   # exact scheme name from the project
      xcode: latest
    scripts:
      - name: Set up signing
        script: xcode-project use-profiles
      - name: Build ipa
        script: |
          xcode-project build-ipa \
            --project "$CM_BUILD_DIR/$(find . -name '*.xcodeproj' -maxdepth 2 | head -1 | xargs basename)" \
            --scheme "$XCODE_SCHEME"
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
```

---

## TL;DR order of operations
1. Pay Apple **$99** (Step 1).
2. PWABuilder → iOS project (Step 2).
3. Register bundle ID + create app record in Apple (Step 3).
4. Push project to GitHub (Step 4).
5. Make an App Store Connect **API key** (Step 5).
6. Codemagic: connect repo + key, set automatic signing (Step 6).
7. Build → auto-uploads to TestFlight (Step 7).
8. Fill listing + screenshots (Step 8).
9. Submit for review (Step 9).
