# Pheonix Browser (Electron)

A minimalist, dark-themed Electron browser with tabs, back/forward/reload, address bar with search, bookmarks (localStorage), animated loading bar, and extra-smooth UI animations.

## Features
- Modern dark UI with glassmorphism top bar, rounded corners, soft shadows
- Tabs with smooth open/close and active transitions
- Address/search bar (intelligently treats input as URL or Google search)
- Back, Forward, Reload controls
- Keyboard shortcuts: Ctrl+T (new tab), Ctrl+W (close tab), Ctrl+L (focus address bar)
- Top-right Google button: instantly opens Google in the active tab (positioned just left of the minimize control)
- Optional bookmarks (localStorage) with quick panel
- Animated loading bar while pages load
- Animated Pheonix Home on new tabs, with a built-in Google search box

## Tech Stack
- Electron (main + renderer)
- HTML, CSS, JavaScript
- No backend, only local files

## Project Structure

```
    └── home/
        ├── index.html  # Animated Pheonix home page with Google search
        ├── style.css
        └── script.js
pheonix-browser/
├── package.json
├── main.js
├── preload.js
└── renderer/
    ├── index.html
    ├── style.css
    └── script.js
```

## Setup

1) Install dependencies

```powershell
cd "c:\Users\91851\Downloads\making browser using VScode\mini-browser"
npm install
```

If Electron isn't installed by the previous step, install it explicitly:

```powershell
npm install electron@^31 --save-dev
```

2) Run the app

```powershell
npm start
```

## Notes
- The app uses Electron's `<webview>` tag (enabled via webviewTag) to render web pages per tab.
- A persistent partition (`persist:main`) is used so session data and cookies survive restarts.
- For security, renderer has `nodeIntegration: false`, `contextIsolation: true`, and a minimal preload bridge for shortcuts.
- On Windows, the window uses a hidden title bar with an overlay for a modern look. The top bar includes a draggable region; buttons are non-draggable.
 - New tabs open the local animated Pheonix Home page (file://…). Submitting the search field navigates to Google.

## Shortcuts
- Ctrl+T: New tab
- Ctrl+W: Close active tab
- Alt+Left: Back
- Alt+Right: Forward
- Ctrl+R: Reload
- Ctrl+L: Focus address bar

## Troubleshooting
- If pages don't load, check your internet connection (the app itself has no backend).
- If the window appears without the top bar styles, ensure `titleBarStyle` and `titleBarOverlay` are supported in your Electron version; update Electron if needed.
- On some systems, when a webview has focus, key events may not reach the page. The app menu accelerators bridge those shortcuts via IPC.
