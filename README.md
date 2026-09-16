# Showmark

A modern annotation tool for Chrome: draw rectangles, circles and freehand strokes on any web page while you present, demo or screen share. Compact dark toolbar, smooth un-draw animations, keyboard-first. No build step, no dependencies. Drawings never leave the browser; anonymous usage statistics can be switched off in settings.

Works in Chrome 125+ and other Chromium browsers (Edge, Brave, Arc, Vivaldi, Opera).

Website: https://showmark.pages.dev/ (source in `docs/`, deployed to Cloudflare Pages with `./deploy-site.sh`).

## Install

From the Chrome Web Store: https://chromewebstore.google.com/detail/showmark-modern-draw-anno/dfojhmdfkljmojndockacpejlbflgpll

Or load the source unpacked:

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

The settings page opens once and confirms your launch shortcut.

## Launch

Press **Alt+Shift+S** (macOS: ⌥⇧S) on any page. Press it again, or click the toolbar icon, to exit.
If the shortcut was already taken by something else, set your own at `chrome://extensions/shortcuts`.

## Settings

Right-click the Showmark icon → **Options**, or click the gear in the drawing toolbar. There you can remap every drawing shortcut (letters or digits 7–0; `Esc` and `1`–`6` are fixed), set the default color and auto-erase delay, and jump to the browser's shortcut page to change the launch key.

## While drawing

Defaults shown; all of them except `Esc` and `1`–`6` can be changed in Settings.

| Key | Action |
|---|---|
| `R` | Rectangle |
| `C` | Circle |
| `F` | Freehand |
| `Shift` + drag | Perfect square or circle |
| `1`–`6` | Preset colors (custom picker in the toolbar) |
| `T` | Toggle auto-erase (shapes fade after 2, 5 or 10 s) |
| `H` | Collapse or expand the toolbar |
| `Esc` | Clear everything |
| `Esc` `Esc` | Exit Showmark (two quick presses) |
| `Q` | Exit Showmark |

Drag the toolbar by its handle to move it. Position, collapsed state, color, mode and fade settings are remembered on this device only (nothing is synced).

## Usage statistics

Showmark counts how its own controls are used (tool, color, shortcut, settings) under a random per-install ID and sends them to PostHog EU. No page URLs, content, drawings or personal data. The switch to turn it off is on the settings page. Event list, architecture and dashboard links: `ANALYTICS.md`.

## Limitations

- Cannot run on browser pages (`chrome://…`), the Chrome Web Store, or the built-in PDF viewer. The icon shows a red "!" badge on those tabs.
- Annotations are ephemeral: they disappear when you exit, reload or navigate.

## Files

- `manifest.json` – Manifest V3, permissions `activeTab`, `scripting`, `storage`.
- `background.js` – ES-module service worker: toggles the overlay in the active tab, opens the settings page on install, and is the only context that sends analytics.
- `lib/analytics.js` – first-party PostHog client (batch API over `fetch`, queue in session storage, opt-out).
- `ANALYTICS.md` – event taxonomy and PostHog dashboard.
- `content/showmark.js` – overlay and toolbar, rendered inside a Shadow DOM.
- `options/` – settings page: launch shortcut status, editable drawing shortcuts, default color and auto-erase, usage-data switch. Also shown once after install.
- `icons/logo.png` – logo source. Regenerate the PNG sizes with: crop the centre 900×900, then `sips -z N N` for 16, 32, 48 and 128.
- `DESIGN.md` – design system (Dark Graphite Precision Amber) the UI follows.
- `CHROMEWEBSTORE.md` – store listing copy, permission justifications and publishing checklist.
- `PRIVACY.md` – privacy policy text to host publicly.
- `docs/` – landing page, deployed to Cloudflare Pages with `./deploy-site.sh`: FAQ, structured data, `llms.txt`, `robots.txt`, `sitemap.xml`, and `privacy.html` generated from `PRIVACY.md`. Keep the two privacy texts in sync.
- `package.sh` – builds the ZIP for the Chrome Web Store (ships only runtime files).

## Publish

```bash
./package.sh
```

Then upload the ZIP in the Chrome Web Store Developer Dashboard and copy the listing fields from `CHROMEWEBSTORE.md`.
