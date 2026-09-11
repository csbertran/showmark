// Showmark – first-party analytics client. Runs only in the service worker.
//
// Posts anonymous usage events to PostHog's batch API (https://posthog.com/docs/api/capture). No SDK is
// bundled on purpose: the extension has no build step, and the Chrome Web Store has rejected extensions
// that ship analytics SDKs containing remote-code loaders or base64-encoded workers. ~120 lines of plain
// fetch() is easier for reviewers (and users) to audit.
//
// Sent with every event: event name, a random install ID, extension version, browser name and version,
// OS and UI language. Never sent: page URLs, titles, page content, drawings, or anything the user types.
// The project has IP anonymization turned on server-side. Users can turn this off in Settings.

const API_HOST = 'https://eu.i.posthog.com'; // PostHog EU Cloud. Must match the project's region.
const PROJECT_TOKEN = 'phc_uBKbcm8kqxYUEsazt9bxXQ3jgDkjHeEuF96sA85FtNo6'; // Public write-only token.
const LIB = 'showmark-extension';
const FLUSH_DELAY_MS = 1000;   // Coalesce bursts (e.g. a few keypresses) into one request.
const RETRY_DELAY_MS = 30_000;
const MAX_QUEUE = 100;         // Oldest events are dropped beyond this.
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 50;

const VERSION = chrome.runtime.getManifest().version;
const STATE_KEY = 'analytics';      // chrome.storage.local:   { distinctId, enabled }
const QUEUE_KEY = 'analyticsQueue'; // chrome.storage.session: [{ attempts, payload }] – survives worker restarts

const EVENT_NAME = /^[a-z][a-z0-9_]{1,63}$/;

// ---------- state ----------
async function getState() {
  const { [STATE_KEY]: state = {} } = await chrome.storage.local.get(STATE_KEY);
  const next = { enabled: state.enabled ?? true, distinctId: state.distinctId };
  if (next.enabled && !next.distinctId) {
    next.distinctId = crypto.randomUUID();
    await chrome.storage.local.set({ [STATE_KEY]: next });
  }
  return next;
}

export async function isEnabled() {
  return (await getState()).enabled;
}

// Turning analytics off sends one final `analytics_toggled` so opt-out rates are measurable, then
// forgets the install ID. Turning it back on starts over with a fresh ID.
export async function setEnabled(enabled) {
  const state = await getState();
  if (state.enabled === enabled) return;
  if (enabled) {
    await chrome.storage.local.set({ [STATE_KEY]: { enabled: true, distinctId: crypto.randomUUID() } });
    await capture('analytics_toggled', { enabled: true });
    return;
  }
  await capture('analytics_toggled', { enabled: false });
  await flush();
  queue = [];
  await saveQueue();
  await chrome.storage.local.set({ [STATE_KEY]: { enabled: false } });
}

// ---------- environment ----------
function environment() {
  const ua = navigator.userAgentData;
  const brand = ua?.brands?.find((b) => !/Chromium|Not.A.Brand/i.test(b.brand));
  const version = Number.parseInt(brand?.version ?? '', 10);
  return {
    $lib: LIB,
    $lib_version: VERSION,
    extension_version: VERSION,
    $browser: brand ? brand.brand.replace(/^Google /, '') : 'Chromium',
    $browser_version: Number.isNaN(version) ? undefined : version,
    $os: ua?.platform || undefined,
    $device_type: 'Desktop',
    $browser_language: navigator.language,
  };
}

// Person properties worth keeping on the profile (set on install and update, not on every event).
export function personProperties() {
  const env = environment();
  return { extension_version: VERSION, browser: env.$browser, os: env.$os, language: env.$browser_language };
}

// Only flat, primitive properties get through. Messages from the content script are trusted (same
// extension), but this keeps a typo from ever sending an object with page data in it.
function sanitizeProperties(properties) {
  const out = {};
  if (!properties || typeof properties !== 'object') return out;
  for (const [key, value] of Object.entries(properties).slice(0, 25)) {
    if (key === '$set' || key === '$set_once') { out[key] = sanitizeProperties(value); continue; }
    if (value === null || typeof value === 'boolean' || typeof value === 'number') out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, 100);
  }
  return out;
}

// ---------- queue ----------
let queue = null;
let flushTimer = null;
let inflight = false;

async function loadQueue() {
  if (!queue) {
    const { [QUEUE_KEY]: stored = [] } = await chrome.storage.session.get(QUEUE_KEY);
    queue = Array.isArray(stored) ? stored : [];
  }
  return queue;
}
async function saveQueue() {
  await chrome.storage.session.set({ [QUEUE_KEY]: queue ?? [] });
}

export async function capture(event, properties = {}) {
  if (typeof event !== 'string' || !EVENT_NAME.test(event)) return;
  const state = await getState();
  if (!state.enabled) return;
  const q = await loadQueue();
  q.push({
    attempts: 0,
    payload: {
      uuid: crypto.randomUUID(),
      event,
      distinct_id: state.distinctId,
      timestamp: new Date().toISOString(),
      properties: { ...environment(), ...sanitizeProperties(properties) },
    },
  });
  if (q.length > MAX_QUEUE) q.splice(0, q.length - MAX_QUEUE);
  await saveQueue();
  flushSoon();
}

export function flushSoon(delay = FLUSH_DELAY_MS) {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flush().catch(() => {}); }, delay);
}

export async function flush() {
  if (inflight) return;
  const q = await loadQueue();
  if (!q.length) return;
  inflight = true;
  const batch = q.slice(0, BATCH_SIZE);
  let retry = false;
  try {
    const res = await fetch(`${API_HOST}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PROJECT_TOKEN, batch: batch.map((e) => e.payload) }),
    });
    // 2xx: delivered. Other 4xx: malformed, retrying won't help. 5xx/429: try again later.
    if (res.ok || (res.status < 500 && res.status !== 429)) {
      queue = q.filter((e) => !batch.includes(e));
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    retry = true;
    for (const e of batch) e.attempts += 1;
    queue = q.filter((e) => e.attempts < MAX_ATTEMPTS);
  } finally {
    inflight = false;
    await saveQueue();
    if (queue.length) flushSoon(retry ? RETRY_DELAY_MS : 0);
  }
}

// Drain anything a previous worker lifetime left behind.
flushSoon(2000);
