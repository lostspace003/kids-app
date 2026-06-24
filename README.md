# The Prophets' Journey

A gamified Islamic learning experience for kids — travel the path of all **25 prophets** (in order of ascendance) by the light of your lantern. Each prophet is a "land" you light up by journeying through their story, making a choice, applying the lesson to today, and earning Noor (✦) and a virtue badge.

Built from a Claude Design prototype (see `project/` and `chats/`). Implemented as a **Next.js (App Router) + React** app.

## Features

- **Three screens** — profile select (Hamza / Huzaifa), a vertical zig-zag journey map (lock / current / done states, Noor + badge counters), and the cinematic stage.
- **Moving 3D-parallax scenes** — the camera travels and zooms as you progress, with per-terrain animated silhouettes (Nuh's ark, Yunus's whale, the Kaaba, Ibrahim's fire, a starfield, rain, drifting clouds, birds…), a fixed lantern as "you," and a guiding Hudhud bird.
- **Story loop per prophet** — Arrive → multi-chapter Story → moral Decision → result → modern "apply it today" scenario → result → Reward.
- **Synced storyteller narration** — warm, name-personalised voice (Web Speech API) that highlights each word as it's spoken, with pronunciation tuning for Islamic terms (Allah, Bismillah, MashaAllah…).
- **Bilingual** — Roman-Urdu by default, English via the 🌐 toggle. Choice + progress persist in `localStorage` per profile.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
```

> Narration uses the **device's installed voices**. For native Urdu + properly pronounced "Allah," install an Urdu (ur-PK) voice on the device; otherwise it falls back gracefully to an English voice reading the Roman-Urdu text.

## Project layout

- `app/` — the Next.js application
  - `app/components/ProphetsJourney.jsx` — the full experience (rendered client-only)
  - `app/data/` — story content: `prophets-data.js` (English) + `prophets-ur.js` (Roman-Urdu)
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
