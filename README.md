# Safar-e-Anbiya — Journey of the Prophets

A gamified Islamic learning experience for kids — travel the path of all **25 prophets** (in order of ascendance) by the light of your lantern. Each prophet is a "land" you light up by journeying through their story, making a choice, applying the lesson to today, and earning Noor (✦) and a virtue badge.

Built from a Claude Design prototype (see `project/` and `chats/`). Implemented as a **Next.js (App Router) + React** app, backed by an Azure (or local-file) service layer for accounts, profiles, and progress.

## Features

- **The journey** — an account-gated child profile, a vertical zig-zag journey map (lock / current / done states, Noor + badge counters), and the cinematic stage.
- **Living, moving scenes** — the camera travels and zooms as you progress, over a continuous slow "ken-burns" drift and a soft fade as each new scene arrives, so the background never feels static. Per-terrain animated silhouettes (Nuh's ark, Yunus's whale, the Kaaba, Ibrahim's fire, a starfield, rain, drifting clouds, birds…), a fixed lantern as "you," and a guiding Hudhud bird.
- **Story loop per prophet** — Arrive → multi-chapter Story → moral Decision → result → modern "apply it today" scenario → result → quick **recap quiz** → Reward.
- **Studio-quality narration (Azure Speech)** — warm female voices (`en-US-JennyNeural` for English, `ur-PK-UzmaNeural` for Urdu) are **pre-generated** to static `.mp3` files with SSML pauses, then played back with word-by-word highlighting driven by Azure's word-boundary timings. Falls back to the browser Web Speech voice for any missing clip.
- **Gamification** — Noor points + level ladder, 1–3 ⭐ per prophet (based on good choices), a collectible **badge gallery**, a daily **🔥 streak**, a recap quiz, plus confetti and gentle WebAudio chimes on celebrations.
- **Leaderboard** — a child-friendly board ranked by a blended **score = Noor + (🔥 streak × 10)** (an ⓘ icon explains it in-app). Each entry shows the child's **first name + age** with a fun mascot icon — never a photo, surname, or country — and duplicate first names are auto-disambiguated. A parent can hide their child via a **PIN-protected opt-out**.
- **Accounts & privacy** — a parent signs up with email + a one-time code, creates one child profile, and can **change password** or **permanently delete the account** (and all data) from the in-app menu. Hosted privacy policy at `/privacy`.
- **Bilingual** — Roman-Urdu by default, English via the 🌐 toggle. Progress is saved server-side per account (guests run locally for one preview story).

## Narration audio pipeline

The narration is **static, pre-generated audio** (committed under `public/audio/`), not synthesized live in the browser.

- `scripts/generate-audio.mjs` enumerates every narratable beat (both languages × both travellers), builds the exact spoken string via `app/lib/narration.js` (shared with the runtime so a content hash matches), calls **Azure Speech** with SSML (`<break>` pauses, `<prosody>` rate, friendly style), and writes `public/audio/<hash>.mp3` + `public/audio/manifest.json` (per-clip duration + word-boundary timings). Identical text is hashed once, so shared lines aren't duplicated.
- Regenerate (e.g. after editing story text or to change voices):

  ```bash
  # Credentials come from env, or are fetched via the Azure CLI if you're logged in.
  SPEECH_KEY=<key> SPEECH_REGION=centralindia npm run gen:audio          # missing clips only
  SPEECH_KEY=<key> SPEECH_REGION=centralindia npm run gen:audio -- --force  # rebuild all
  ```

  Voices are overridable: `VOICE_EN=en-US-AvaMultilingualNeural VOICE_UR=ur-PK-UzmaNeural ...`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
```

> Narration plays the pre-generated Azure clips in `public/audio/` — no device voices or network calls needed at runtime. If a clip is missing it falls back to the browser's Web Speech voice.

## Project layout

- `app/` — the Next.js application
  - `app/components/ProphetsJourney.jsx` — the full experience (rendered client-only)
  - `app/data/` — story content: `prophets-data.js` (English) + `prophets-ur.js` (Roman-Urdu)
  - `app/lib/narration.js` — shared spoken-text assembly (used by the app **and** the audio generator)
  - `app/lib/leaderboard.js` — shared, child-safe leaderboard scoring + name handling
  - `app/lib/server/` — swappable service layer (local-file vs Azure) for db, storage, email, sessions
  - `app/api/` — route handlers (auth, profile, progress, leaderboard, account deletion, media)
- `scripts/generate-audio.mjs` — Azure Speech batch generator (see "Narration audio pipeline")
- `scripts/capture-screenshots.mjs` — headless store-screenshot generator (`--device play|ios67|ios65`)
- `public/audio/` — generated `.mp3` clips + `manifest.json` (committed)
- Store-submission guides: `PLAY-STORE-LISTING.md`, `BUILD-ANDROID-APK.md`, `BUILD-IOS-APP.md`
- `project/`, `chats/` — the original Claude Design handoff bundle (kept for reference)

---

# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Prophets Journey.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Islamic Prophet Learning Journey` project files (HTML prototypes, assets, components)
