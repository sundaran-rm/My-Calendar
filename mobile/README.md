# CalIO PWA — Installation Guide

CalIO is a fully offline-capable Progressive Web App. This package contains everything needed to self-host it.

## Files

```
calio-pwa/
├── index.html          ← The full app (all-in-one)
├── manifest.json       ← PWA manifest (name, icons, shortcuts)
├── sw.js               ← Service worker (offline caching)
├── offline.html        ← Shown when offline & not yet cached
├── icons/              ← App icons (all sizes)
│   ├── icon-72x72.png … icon-512x512.png
│   ├── icon-192x192-maskable.png
│   ├── icon-512x512-maskable.png
│   └── apple-touch-icon.png
└── README.md           ← This file
```

## How to Deploy

### Option 1 — Any static host (recommended)
Upload all files to **GitHub Pages**, **Netlify**, **Vercel**, or any static server.
- Must be served over **HTTPS** (required for service workers)
- Keep the folder structure exactly as-is

### Option 2 — Local dev server
```bash
npx serve .          # or
python3 -m http.server 8080
```
Then open `http://localhost:8080`

## Installing the App

Once opened in a browser:
- **Chrome/Edge (desktop):** Click the install icon in the address bar
- **Chrome (Android):** Tap "Add to Home Screen" in the browser menu
- **Safari (iOS):** Tap Share → "Add to Home Screen"

## Home Screen Shortcuts
Long-press the app icon to access quick shortcuts:
- **New Event** — Opens the event creation dialog
- **Today** — Jumps to today's date
- **New Journal Entry** — Opens today's journal

## Firebase Sync (optional)
To enable real-time sync across devices:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Firestore** in Native mode
3. Open the app → Settings → Firebase Setup
4. Paste your Firebase config JSON
5. Create or join a room code to start syncing

## Offline Behaviour
- All events, journal, notes, and todos are stored in **localStorage**
- The app works fully offline after the first visit
- Firebase sync resumes automatically when connectivity returns

## Updating
Replace `index.html` with the new version. The service worker will detect
the change and show an "App updated — refresh" toast on next load.
