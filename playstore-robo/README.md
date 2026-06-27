# Robo scripts for Safar-e-Anbiya (Android / Play Console)

These guide the **Robo crawler** in Google Play Console's **Pre-launch report**
(and Firebase Test Lab) past the splash → intro → auth screens, so the automated
test actually explores the app instead of getting stuck on the login wall.

Two files:

| File | Use | Needs a test account? |
|------|-----|-----------------------|
| **`robo-guest.json`** | **Recommended.** Clicks into the free **guest story** — pure button taps, very robust. | No |
| `robo-login.json` | Best-effort: logs into a real signed-in account. | Yes — edit the file first |

## Why guest is the primary script

The app is a **TWA** (a thin Android shell around the live website), so every
screen is web content inside an `android.webkit.WebView`. Robo matches WebView
elements by **visible text**, which works great for buttons. But **typing into
web `<input>` fields is unreliable** in Robo — so the login script is best-effort.
The guest path needs no typing, so prefer it.

## Before using `robo-login.json`

Open it and replace:
- `REPLACE_WITH_TEST_EMAIL@example.com` → a throwaway **test** parent account
- `REPLACE_WITH_TEST_PASSWORD` → its password

Use a disposable account (the crawler may tap around, including destructive menu
items like *Delete account*). If text entry fails in the report, fall back to
`robo-guest.json`.

## How to upload

**Google Play Console**
1. Console → your app → **Test and release → Pre-launch report → Settings**.
2. Under **Robo script**, upload `robo-guest.json` (or `robo-login.json`).
3. Save. The next release uploaded to a testing track runs the crawler with it.

**Firebase Test Lab (gcloud CLI)**
```bash
gcloud firebase test android run \
  --type robo \
  --app app-release.aab \
  --robo-script playstore-robo/robo-guest.json \
  --timeout 5m
```

**Android Studio** — *Run → Record Espresso Test* isn't this; use
**Run → Edit Configurations → Robo test → Robo script** to attach the file when
running a Robo test on a connected device/emulator.

## Tuning notes

- Every action is `optional: true` so a single missed match doesn't abort the run.
- The leading `WAIT_FOR_ELEMENT` (20s) absorbs the WebView's first paint / network
  load. If the device is slow or offline, bump `delayTime`.
- Button labels are matched with loose `textRegex` (e.g. `.*see a story first.*`)
  plus a `visionText` OCR fallback, so minor copy changes won't break them. If you
  rename a button in the app, update the matching regex/visionText here.
- The login script's "signed-in" wait keys off the word **Noor** on the map; change
  it if that label changes.
