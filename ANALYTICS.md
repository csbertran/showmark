# Showmark analytics

Anonymous product analytics for the extension, sent to PostHog. This document is the source of truth for
what is collected and why; keep it, `PRIVACY.md` and the Chrome Web Store data disclosure in sync.

- PostHog project: **Showmark** (id 190306, EU Cloud) — https://eu.posthog.com/project/190306
- Dashboard: **Showmark – Extension analytics** — https://eu.posthog.com/project/190306/dashboard/947793
- Event definitions with descriptions: https://eu.posthog.com/project/190306/data-management/events

## Architecture

```
content/showmark.js ─┐  chrome.runtime.sendMessage({ type: 'showmark:track', event, properties })
                     ├──────────────────────────────▶ background.js ──▶ lib/analytics.js ──fetch──▶ eu.i.posthog.com/batch/
options/options.js ──┘
```

- **Only the service worker talks to the network.** The content script runs inside arbitrary web pages, so it
  never loads an analytics library and never sends anything itself; it relays event names and flat settings
  values to the worker.
- **No SDK, no remote code.** `lib/analytics.js` is a first-party client for PostHog's
  [batch API](https://posthog.com/docs/api/capture). Bundling `posthog-js` would need a build step and has
  caused Chrome Web Store rejections for remote-code and obfuscation heuristics. If you ever need feature
  flags, add a `/flags` call to the same file rather than pulling in the SDK.
- **Identity.** One random UUID per install (`chrome.storage.local` → `analytics.distinctId`). No
  `identify()`, no email, no Google account. Person properties (`extension_version`, `browser`, `os`,
  `language`) are set via `$set` only on `extension_installed` / `extension_updated`, never on every event.
- **Delivery.** Events are queued in `chrome.storage.session` (survives worker suspension), flushed 1 s after
  the last capture, retried up to 3 times on 5xx/network errors, dropped on other 4xx. Queue is capped at
  100 events. Every event carries a client `uuid` and `timestamp`, so retries never duplicate.
- **No host permission needed.** PostHog's ingestion endpoint allows cross-origin requests from
  `chrome-extension://` origins, so plain `fetch()` works without `host_permissions`.
- **Opt-out.** Settings page switch (also shown during onboarding). Off: one final
  `analytics_toggled { enabled: false }`, then the ID and queue are deleted and `capture()` becomes a no-op.
  On again: fresh ID.
- **Server side.** The project has IP anonymization on and event retention set to 12 months. Check both in
  project settings before publishing a new privacy policy version.

## Privacy rules (enforced in code)

- Never send page URLs, titles, hostnames, page content, drawings, coordinates, or free text. Chrome's
  "cannot access" error message contains the page URL, which is why `overlay_activation_failed` only
  sends `reason: 'restricted_page'`.
- Properties are sanitized to flat primitives (string ≤ 100 chars, number, boolean, null); objects other
  than `$set` / `$set_once` are dropped. Event names must match `^[a-z][a-z0-9_]{1,63}$`.
- Color values are the hex strings the user picked; shortcut `key` is the single letter or digit bound to an
  action. Neither is personal.

## Events

Common properties on every event: `$lib` (`showmark-extension`), `$lib_version`, `extension_version`,
`$browser`, `$browser_version`, `$os`, `$device_type`, `$browser_language`.

| Event | Where | When | Properties |
|---|---|---|---|
| `extension_installed` | background.js | First install | `$set` person props, `$set_once { installed_at, initial_extension_version }` |
| `extension_updated` | background.js | Version changed | `previous_version`, `$set` person props |
| `overlay_activation_failed` | background.js | Launch on chrome://, Web Store, PDF | `reason: 'restricted_page'` |
| `overlay_activated` | content/showmark.js | Overlay opened (icon or shortcut) | `tool`, `fade_enabled`, `fade_seconds`, `toolbar_collapsed`, `toolbar_moved` |
| `overlay_deactivated` | content/showmark.js | Overlay closed explicitly | `via` (`toolbar` \| `exit_key` \| `double_escape` \| `launcher` \| `reload`), `duration_seconds`, `shapes_drawn`, `clears` |
| `shape_drawn` | content/showmark.js | Shape finished | `shape` (`rect` \| `circle` \| `free`), `fade_enabled`, `fade_seconds`, `constrained`, `is_dot` |
| `canvas_cleared` | content/showmark.js | Clear button or Esc | `via` (`toolbar` \| `escape`), `shapes_cleared` |
| `drawing_tool_selected` | content/showmark.js | Tool changed | `tool`, `via` (`toolbar` \| `key`) |
| `color_changed` | content/showmark.js | Color changed | `color`, `is_preset`, `via` (`toolbar` \| `key` \| `custom_picker`) |
| `auto_erase_changed` | content/showmark.js | Auto-erase toggled / delay set | `fade_enabled`, `fade_seconds`, `via` |
| `toolbar_toggled` | content/showmark.js | Toolbar collapsed / expanded | `collapsed`, `via` |
| `toolbar_moved` | content/showmark.js | Toolbar dragged | `collapsed` |
| `settings_opened` | content/showmark.js | Gear button | `via: 'toolbar'` |
| `settings_page_viewed` | options/options.js | Settings / onboarding page loaded | `launch_shortcut_assigned` |
| `launch_shortcut_page_opened` | options/options.js | Opened chrome://extensions/shortcuts | `via` (`setup` \| `change`) |
| `drawing_shortcut_changed` | options/options.js | Shortcut remapped | `action`, `key` |
| `drawing_shortcuts_reset` | options/options.js | Reset to defaults | — |
| `default_color_changed` | options/options.js | Default color set | `color` |
| `default_auto_erase_changed` | options/options.js | Default auto-erase set | `enabled`, `seconds` |
| `analytics_toggled` | lib/analytics.js | Usage-data switch | `enabled` |

`overlay_deactivated` does not fire when the tab is closed or navigated, so `duration_seconds` only covers
explicit exits. Nothing fires while the overlay is idle.

## Dashboard tiles

1. Weekly active installs — unique IDs with `overlay_activated`, weekly
2. New installs per week — `extension_installed`
3. Activation funnel — `extension_installed` → `overlay_activated` → `shape_drawn`, 7-day window
4. Shapes drawn by tool — `shape_drawn` by `shape`
5. Weekly retention — first `overlay_activated` → returning `overlay_activated`
6. Feature usage — unique installs per secondary feature, 30 days
7. Launch shortcut bound at onboarding — `settings_page_viewed` by `launch_shortcut_assigned`
8. Friction — `overlay_activation_failed` and `analytics_toggled { enabled: false }`

## Adding an event

1. Add a row to the table above and a `track('event_name', { ... })` call. Flat, non-personal properties only.
2. Register the definition and description in PostHog (Data management → Events) so it shows up documented.
3. If the new data changes what is collected, update `PRIVACY.md`, the gist it is published to, and the
   Chrome Web Store disclosure in `CHROMEWEBSTORE.md`.

## Testing locally

- Load the extension unpacked, open the service worker console from `chrome://extensions`, and watch
  `POST https://eu.i.posthog.com/batch/` in its Network tab. Events show up in PostHog's Activity view within
  seconds.
- `chrome.storage.local.get('analytics')` in the worker console shows the install ID and switch state;
  `chrome.storage.session.get('analyticsQueue')` shows anything not yet delivered.
- Events from development builds share the production project. Filter them out in insights by adding an
  `extension_version` filter, or send them from a separate PostHog project by changing `PROJECT_TOKEN`.

## Cost note

Events are captured as identified events (person profiles on), which is what makes retention and person
properties work. If volume ever matters, add `$process_person_profile: false` to high-volume events such as
`shape_drawn` to have them billed as anonymous events.
