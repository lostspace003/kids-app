# Safar-e-Anbiya — Journey of the Prophets

A gamified Islamic learning experience for kids — travel the path of all **25 prophets** (in order of ascendance) by the light of your lantern. Each prophet is a "land" you light up by journeying through their story, making a choice, applying the lesson to today, and earning Noor (✦) and a virtue badge.

Built from a Claude Design prototype (see `project/` and `chats/`). Implemented as a **Next.js (App Router) + React** app, backed by an Azure (or local-file) service layer for accounts, profiles, and progress.

## Features

- **The journey** — an account-gated child profile, a vertical zig-zag journey map (lock / current / done states, Noor + badge counters), and the cinematic stage.
- **Living, moving scenes** — the camera travels and zooms as you progress, over a continuous slow "ken-burns" drift and a soft fade as each new scene arrives, so the background never feels static. Per-terrain animated silhouettes (Nuh's ark, Yunus's whale, the Kaaba, Ibrahim's fire, a starfield, rain, drifting clouds, birds…), a fixed lantern as "you," and a guiding Hudhud bird.
- **Story loop per prophet** — Arrive → multi-chapter Story → moral Decision → result → modern "apply it today" scenario → result → quick **recap quiz** → Reward.
- **Studio-quality narration (Azure Speech)** — warm voices (`en-US-JennyNeural` for English; `ur-PK-AsadNeural` male / `ur-PK-UzmaNeural` female for Urdu) are **pre-generated** to static `.mp3` files with SSML pauses, then played back with word-by-word highlighting driven by Azure's word-boundary timings. A ↩ previous-slide and ↻ replay control ride the story card. Falls back to the browser Web Speech voice for any missing clip.
- **Gamification** — Noor points + level ladder, 1–3 ⭐ per prophet (based on good choices), a collectible **badge gallery**, a daily **🔥 streak**, a recap quiz, plus confetti and gentle WebAudio chimes on celebrations.
- **Leaderboard** — a child-friendly board ranked by a blended **score = Noor + (🔥 streak × 10)** (an ⓘ icon explains it in-app). Each entry shows the child's **first name + age** with a fun mascot icon — never a photo, surname, or country — and duplicate first names are auto-disambiguated. A parent can hide their child via a **PIN-protected opt-out**.
- **Accounts & privacy** — a parent signs up with email + a one-time code, creates one child profile, and can **change password** or **permanently delete the account** (and all data) from the in-app menu. Hosted privacy policy at `/privacy`.
- **Bilingual** — Roman-Urdu by default, English via the 🌐 toggle. English mode uses familiar Biblical prophet names (Abraham, Moses, Noah…); Urdu keeps the Arabic names (Ibrahim, Musa, Nuh…). Progress is saved server-side per account (guests run locally for one preview story).

## Narration audio pipeline

The narration is **static, pre-generated audio**, not synthesized live in the browser. It's stored in **Azure Blob** (the `media` container under `audio/`) and served via the `/api/media/audio/<key>` proxy — the build sets `NEXT_PUBLIC_AUDIO_BASE=/api/media/audio` so the app fetches it from Blob instead of the bundle. The files are kept locally under `public/audio/` for development (gitignored — a fresh clone runs `npm run sync:audio` in reverse, or just regenerates).

- `scripts/generate-audio.mjs` enumerates every narratable beat (both languages × both travellers), builds the exact spoken string via `app/lib/narration.js` (shared with the runtime so a content hash matches), and synthesises it through the **Azure Speech REST endpoint** with SSML (`<break>` pauses, `<prosody>` rate, friendly style). For Urdu it also normalises stray Arabic presentation-form glyphs and applies a small harakat-disambiguated pronunciation lexicon, so names and words are voiced correctly. It writes `public/audio/<hash>.mp3` + `public/audio/manifest.json` (per-clip duration + word-boundary timings); identical text is hashed once, so shared lines aren't duplicated. Each clip is written to a temp file and promoted only when it holds valid audio, so a failed synth never corrupts an existing clip.
- Regenerate (e.g. after editing story text or to change voices):

  ```bash
  # Credentials come from env, or are fetched via the Azure CLI if you're logged in.
  SPEECH_KEY=<key> SPEECH_REGION=centralindia npm run gen:audio          # missing clips only
  SPEECH_KEY=<key> SPEECH_REGION=centralindia npm run gen:audio -- --force  # rebuild all
  ```

  Voices are overridable: `VOICE_EN=en-US-AvaMultilingualNeural VOICE_UR=ur-PK-UzmaNeural ...`.
- Publish the regenerated clips to Blob (uses the Azure CLI — `az login` first):

  ```bash
  npm run sync:audio    # uploads public/audio -> media container, audio/ prefix
  ```

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
- `scripts/sync-audio-blob.mjs` — publish `public/audio/` to Azure Blob (`npm run sync:audio`)
- `public/audio/` — generated `.mp3` clips + `manifest.json` (local-only / gitignored; live copies in Azure Blob)
- Store-submission guides: `PLAY-STORE-LISTING.md`, `BUILD-ANDROID-APK.md`, `BUILD-IOS-APP.md`
- `project/`, `chats/` — the original Claude Design handoff bundle (kept for reference)
