# Chrome Web Store Listing — Showmark

> Last Updated: 2026-09-11

## Store Listing

**Extension Name** [REQUIRED]
Showmark: Draw & Annotate on Any Web Page

**Short Description** [REQUIRED]
Annotate any web page while presenting or screen sharing. Draw rectangles, circles & freehand highlights with keyboard shortcuts.

**Detailed Description** [REQUIRED]
Showmark lets you draw on any web page while you present, demo or screen share, so everyone sees exactly what you are pointing at.

FEATURES
• Rectangles, circles and freehand strokes — pick a tool with one key (R, C, F) or from the floating toolbar
• Auto-erase — shapes un-draw themselves a few seconds after you finish them, so you never have to clean up mid-demo
• Six preset colors plus a custom color picker
• Compact floating toolbar — drag it anywhere, collapse it to a single dot, and it remembers where you left it
• Keyboard-first — Esc clears everything, two quick Esc presses exit, Shift-drag makes perfect squares and circles
• Customizable — remap any drawing shortcut and set your default color and auto-erase delay from the settings page
• Annotations stay attached to the content when you scroll
• Works on any site, without changing the page underneath
• Private by design — drawings never leave your browser, and the anonymous usage statistics have an off switch in settings

HOW TO USE
1. Press Alt+Shift+S (Option+Shift+S on Mac) on any page, or click the Showmark icon
2. Drag to draw. Press R, C or F to switch between rectangle, circle and freehand
3. Press 1–6 to change color, T to toggle auto-erase, H to collapse the toolbar
4. Press Esc to clear, or Esc twice (or Q) to exit and get the page back
5. Click the gear in the toolbar (or right-click the icon → Options) to change shortcuts and defaults

Your annotations are temporary: they disappear when you exit, reload or navigate. Nothing is saved to the page.

PRIVACY
Your drawings, the pages you visit and anything you type never leave your browser. Preferences (tool, color, auto-erase timing, shortcuts and toolbar position) are kept on your device only. Showmark counts how its own buttons and shortcuts are used (for example "rectangle tool selected") under a random identifier, with no page addresses, page content or personal data, so it can improve where it matters. You can switch this off in settings at any time. There are no accounts and no ads.

PERMISSIONS
• "Read and change data on the site you are on" (activeTab) — needed to draw the overlay on the page you are looking at. It is granted only for the tab where you launch Showmark, and only after you press the shortcut or click the icon.
• Storage — saves your preferences on your device.

SUPPORT
Found a bug or have a suggestion? Email showmark.support@gmail.com

Version 1.1.0 — adds anonymous usage statistics with an off switch in settings.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Draws temporary rectangle, circle and freehand annotations on top of the current web page.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | icons/icon128.png |
| Screenshot 1 [REQUIRED] | 1280×800 | ✅ Ready | store-assets/screenshot-1.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ✅ Ready | store-assets/screenshot-2.png |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Not created | |
| Screenshot 4 | 1280×800 | ⬜ Not created | |
| Screenshot 5 | 1280×800 | ⬜ Not created | |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | |

### Screenshot Notes
- Screenshot 1: a sample page annotated with a rectangle, a circle and a freehand stroke, toolbar visible at the bottom.
- Screenshot 2: same page with the color popover open, showing the preset swatches.
- Screenshots are generated from a mock page (not a third-party site) to avoid trademark issues. Regenerate them whenever the toolbar design changes.
- Suggested screenshot 3: collapsed toolbar (single dot) to show how little space it takes.
- Suggested screenshot 4: the settings page with the shortcut editor.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| activeTab | permissions | Grants temporary access to the tab where the user pressed the Showmark shortcut or clicked the icon, so the drawing overlay and toolbar can be added to that page. No access to other tabs, and no access until the user acts. |
| scripting | permissions | Inserts the drawing overlay into the current tab when the user launches Showmark. Only used together with activeTab, never on page load and never on tabs the user did not launch it in. |
| storage | permissions | Saves the user's preferences on their device: selected tool, color, auto-erase timing, custom keyboard shortcuts, toolbar position/collapsed state, the usage-statistics on/off switch and its random install identifier. Uses local storage only; nothing is synced. |

No `host_permissions` are requested. Usage statistics are sent with plain `fetch()` from the service worker to `https://eu.i.posthog.com/batch/`, which allows cross-origin requests, so no host permission is needed.

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** Yes

Tick only **User activity** in the disclosure form. Showmark records anonymous usage statistics about its own UI: which of its tools, colors, shortcuts and settings are used, plus extension version, browser name/version, OS and interface language, under a random per-install identifier. Sent to PostHog (EU Cloud, Frankfurt) with IP anonymization on. Not collected: page URLs, titles or content, drawings, keystrokes other than Showmark's own shortcuts, or any personal identifier. Users can switch it off in the settings page; the switch is shown on the onboarding page after install.

Do NOT tick: Personally identifiable information, Health, Financial, Authentication, Personal communications, Location, Web history, Website content.

UI preferences stay in `chrome.storage.local` on the device. Annotations exist only in memory while the overlay is open and are discarded when the user exits, reloads or navigates.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://gist.github.com/csbertran/ebae7dc93ad46e6d9f7c50414c48ab4f

Public gist of `PRIVACY.md`. Keep the two in sync: edit `PRIVACY.md` here, then paste it into the gist. Contact in the gist must read showmark.support@gmail.com.

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Carles Salvador

**Contact Email** [REQUIRED]
showmark.support@gmail.com

**Support URL / Email** [RECOMMENDED]
showmark.support@gmail.com

**Homepage URL** [RECOMMENDED]
None. The store listing is the project's public page.

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-09-11 | First release: rectangle, circle and freehand tools; per-shape auto-erase with un-draw animation; color presets and custom picker; draggable, collapsible toolbar; keyboard shortcuts; settings page (also onboarding) with launch-shortcut status, remappable drawing shortcuts and drawing defaults. | Not submitted (superseded by 1.1.0) |
| 1.1.0 | 2026-09-11 | Anonymous usage statistics (PostHog EU) with an off switch in settings; service worker is now an ES module. Privacy policy and data disclosure updated: "User activity" now collected. | Draft |

## Review Notes

### Known Issues / Limitations
- Cannot run on browser pages (`chrome://…`), the Chrome Web Store, or the built-in PDF viewer. The icon shows a red "!" badge on those tabs instead.
- Requires Chrome 125 or newer (`minimum_chrome_version`), for native popover and anchor positioning in the toolbar.
- Annotations are intentionally not persisted.
- Package with `./package.sh`; it excludes docs, the design system, the raw logo, and the skills folders.

### Analytics implementation (for reviewers)
- No analytics SDK is bundled and no remote code is loaded. `lib/analytics.js` is a ~150-line first-party client that POSTs JSON to `https://eu.i.posthog.com/batch/` with `fetch()` from the service worker only. Event taxonomy in `ANALYTICS.md`.
- The content script and options page never talk to the network; they relay `{ type: 'showmark:track' }` messages to the service worker, which sanitizes properties to flat primitives.
- The random install identifier lives in `chrome.storage.local`; pending events wait in `chrome.storage.session` so nothing is lost when the worker is suspended.
- Opt-out: settings page switch. Turning it off sends one final `analytics_toggled` event, deletes the identifier and the queue, and drops everything afterwards.

### Rejection History
None yet.
