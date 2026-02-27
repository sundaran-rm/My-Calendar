# CalIO — Mobile PWA

A full-featured offline-first calendar Progressive Web App.

## 📦 Package Contents

```
calio-pwa/
├── index.html          ← Main app (open this in browser)
├── manifest.json       ← PWA manifest (icons, theme, shortcuts)
├── sw.js               ← Service worker (offline caching)
├── offline.html        ← Offline fallback page
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png          ← Standard
│   ├── icon-192x192-maskable.png ← Android adaptive
│   ├── icon-384x384.png
│   ├── icon-512x512.png          ← Standard large
│   ├── icon-512x512-maskable.png ← Android adaptive large
│   └── apple-touch-icon.png      ← iOS home screen (180x180)
└── README.md
```

## 🚀 How to Deploy

### Option A — GitHub Pages (Free, Recommended)

1. Create a repo on GitHub (e.g. `calio`)
2. Upload all files maintaining the folder structure
3. Go to Settings → Pages → Deploy from branch → `main` → root
4. Visit `https://yourusername.github.io/calio/`
5. Tap **Add to Home Screen** in your browser

### Option B — Netlify (Free, Drag & Drop)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `calio-pwa` folder onto the page
3. You get a live URL instantly (e.g. `https://calio-abc123.netlify.app`)
4. Optionally add a custom domain

### Option C — Vercel

```bash
npm i -g vercel
cd calio-pwa
vercel --prod
```

### Option D — Any Static Host

Upload all files to any web server. The app needs to be served over **HTTPS** for service workers and PWA install to work (localhost is fine for development).

### Option E — Local Development

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# Then open http://localhost:8080
```

## 📲 Installing on Device

### iOS (Safari)
1. Open the deployed URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**
5. Launch from home screen — runs full-screen, no browser chrome

### Android (Chrome)
1. Open the deployed URL in Chrome
2. Tap the **⋮** menu → **Add to Home Screen**
   (or look for the install banner/prompt)
3. Tap **Install**
4. Runs as a standalone app

### Desktop (Chrome/Edge)
1. Look for the install icon (⊕) in the address bar
2. Click **Install**

## ✨ Features

| Feature | Details |
|---------|---------|
| Views | Month, 3-Day, Day, Agenda |
| Events | Full CRUD, all-day, multi-day, timed |
| Recurrence | Daily/Weekly/Monthly/Yearly with intervals & end rules |
| Habits | Daily/Weekday/Weekly tracking with streaks |
| Calendars | Multiple named calendars with colors & visibility |
| Labels | Tag events with colored labels |
| Sync | Firebase Firestore real-time sync (optional) |
| Collaboration | Share a 6-char room code for real-time multi-device |
| Reminders | Browser push notifications |
| Import/Export | JSON backup and .ics (iCalendar) files |
| Offline | Full offline support via service worker |
| Themes | Dark & Light mode |
| Timezone | Override display timezone |

## 🔄 Shared Data with Desktop App

CalIO Mobile uses the **same localStorage keys** as the desktop calendar app (`calioEvents`, `calioCalendars`, `calioLabels`, `calioHabits`). If you open both on the same device/browser, they share data automatically.

For cross-device sync, connect Firebase and use the same **Room Code** on both apps.

## 🔒 Firebase Setup (Optional)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Add web app → Copy config
3. Enable **Firestore Database** in test mode
4. In CalIO: tap the sync indicator → paste config → Connect
5. Create a room and share the 6-char code with others

## 🛠 Tech Stack

- Vanilla HTML/CSS/JavaScript (zero dependencies)
- Firebase Firestore v10 (optional, CDN loaded)
- Google Fonts (DM Sans + DM Serif Display)
- Service Worker with cache-first strategy
- localStorage for offline persistence
