# Swole Sauna Tracker

A mobile-first, single-page workout tracker for bodybuilding show prep. All data
lives in the browser's `localStorage` — no backend, no accounts, no network
required. Built to be used in the gym, phone in hand.

## Features

- **Home** — Start a workout from scratch or quick-start from a template. The
  Home tab badge shows a live stopwatch while a workout is in progress.
- **Active Workout** — Scoreboard-style set logger with per-set weight/reps,
  a tap-to-complete checkmark that triggers a circular-arc **rest timer** with
  an audible beep (Web Audio). Shows your **last session** for each movement.
  Add/remove/reorder movements, edit rest and targets, all mid-workout. State is
  persisted continuously, so a phone lock or accidental close never loses data.
- **Templates** — Build reusable workouts (movements, target sets/reps, rest).
  Start a live workout from any template; editing a template never touches your
  history.
- **History** — Every completed workout, searchable and filterable by muscle
  group, sortable by date / volume / duration. Tap for a full breakdown, edit
  notes inline, or **repeat** a workout with blank set logs.
- **Analytics**
  - *Weekly Volume* — sets per muscle group vs. your hypertrophy targets
    (Mon–Sun), with status indicators and per-movement breakdowns.
  - *By Movement* — SVG charts of max weight and total volume across the last 8
    sessions, plus a session table.
- **Settings** — lbs/kg toggle (weights stored in lbs, converted for display),
  editable weekly set targets, movement library management, and full data
  **export / import / clear**.

## Tech Stack

- React 18 (functional components + hooks)
- Vite 5
- Tailwind CSS 3 (utility classes only — all components built from scratch)
- `localStorage` for all persistence

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy to Vercel (use it on your phone)

1. Push this repo to GitHub.
2. At [vercel.com](https://vercel.com), **Add New Project** → import the repo.
3. Vercel auto-detects Vite. Confirm:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy.** You'll get a URL like `swole-sauna-xyz.vercel.app`.

### Add to home screen

Open the URL in Chrome (Android) or Safari (iOS) → menu → **Add to Home
Screen**. The included web manifest launches it full-screen like a native app.

> **Data note:** `localStorage` is per-device and per-browser. Use Settings →
> Export / Import to move data between devices. Any push to the main branch
> redeploys automatically on Vercel.
