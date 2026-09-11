// Showmark – options page (also shown once as onboarding).
const DEFAULT_KEYS = { rect: 'r', circle: 'c', free: 'f', fade: 't', collapse: 'h', exit: 'q' };
const ACTIONS = [
  ['rect', 'Rectangle'],
  ['circle', 'Circle'],
  ['free', 'Freehand'],
  ['fade', 'Toggle auto-erase'],
  ['collapse', 'Collapse or expand the toolbar'],
  ['exit', 'Exit Showmark'],
];
const PRESETS = ['#ff9f0a', '#ff3b30', '#34c759', '#af52de', '#00c7be', '#ffffff'];
const FADE_OPTIONS = [0, 2, 5, 10];
const RESERVED = new Set(['escape', ' ', '1', '2', '3', '4', '5', '6']); // Esc clears/exits, 1–6 pick colors

const $ = (sel) => document.querySelector(sel);
// Usage analytics are relayed to the service worker, which drops them when the user has opted out.
function track(event, properties = {}) {
  try { chrome.runtime.sendMessage({ type: 'showmark:track', event, properties }).catch(() => {}); } catch {}
}
const isMac = navigator.platform.startsWith('Mac') || /Mac/.test(navigator.userAgent);

// ---------- settings (same document the toolbar uses) ----------
async function loadSettings() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  settings.keys = { ...DEFAULT_KEYS, ...(settings.keys || {}) };
  return settings;
}
// Read-modify-write so we never clobber values the toolbar changed meanwhile (e.g. its position).
async function patchSettings(patch) {
  const { settings = {} } = await chrome.storage.local.get('settings');
  await chrome.storage.local.set({ settings: { ...settings, ...patch } });
}

// ---------- launch shortcut (owned by the browser) ----------
function pretty(shortcut) {
  if (!isMac) return shortcut.replace(/\+/g, ' + ');
  const map = { Ctrl: '⌃', Command: '⌘', MacCtrl: '⌃', Alt: '⌥', Shift: '⇧' };
  return shortcut.split('+').map((k) => map[k] || k).join('');
}
async function refreshLaunchShortcut() {
  const ok = $('#shortcut-ok'), missing = $('#shortcut-missing');
  try {
    const cmds = await chrome.commands.getAll();
    const cmd = cmds.find((c) => c.name === '_execute_action');
    if (cmd?.shortcut) {
      $('#combo').textContent = pretty(cmd.shortcut);
      ok.hidden = false; missing.hidden = true;
      return true;
    }
  } catch {}
  ok.hidden = true; missing.hidden = false;
  return false;
}
const openShortcutsPage = (via) => {
  track('launch_shortcut_page_opened', { via });
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
};
$('#open-shortcuts').addEventListener('click', () => openShortcutsPage('setup'));
$('#change-shortcut').addEventListener('click', () => openShortcutsPage('change'));
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshLaunchShortcut(); });
window.addEventListener('focus', refreshLaunchShortcut);

// ---------- in-overlay shortcuts (ours) ----------
let recording = null; // { action, button }

function renderKeys(keys) {
  $('#keys').innerHTML = ACTIONS.map(([action, label]) =>
    `<tr><td><button class="key" data-action="${action}" aria-label="Change key for ${label}">${keys[action].toUpperCase()}</button></td><td>${label}</td></tr>`).join('');
  $('#keys').querySelectorAll('.key').forEach((b) => b.addEventListener('click', () => startRecording(b)));
}

function setStatus(text, isError = false) {
  const el = $('#key-status');
  el.textContent = text;
  el.classList.toggle('error', isError);
}

function startRecording(button) {
  stopRecording();
  recording = { action: button.dataset.action, button, previous: button.textContent };
  button.classList.add('recording');
  button.textContent = '…';
  setStatus('Press a key. Esc to cancel.');
}
function stopRecording() {
  if (!recording) return;
  recording.button.classList.remove('recording');
  recording.button.textContent = recording.previous;
  recording = null;
}

document.addEventListener('keydown', async (e) => {
  if (!recording) return;
  e.preventDefault();
  e.stopPropagation();
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; // wait for the actual key
  const k = e.key.toLowerCase();
  if (k === 'escape') { stopRecording(); setStatus(''); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) { setStatus('Use a single key without modifiers.', true); return; }
  if (k.length !== 1 || !/[a-z0-9]/.test(k)) { setStatus('Use a letter or a digit.', true); return; }
  if (RESERVED.has(k)) { setStatus(k === 'escape' ? 'Esc is reserved.' : `${k} is reserved for colors.`, true); return; }
  const settings = await loadSettings();
  const clash = ACTIONS.find(([a]) => a !== recording.action && settings.keys[a] === k);
  if (clash) { setStatus(`${k.toUpperCase()} is already used by "${clash[1]}".`, true); return; }
  const { action } = recording;
  const keys = { ...settings.keys, [action]: k };
  const label = ACTIONS.find(([a]) => a === action)[1];
  recording = null; // don't restore the old label
  await patchSettings({ keys });
  track('drawing_shortcut_changed', { action, key: k });
  renderKeys(keys);
  setStatus(`${label}: ${k.toUpperCase()}`);
}, true);

$('#reset-keys').addEventListener('click', async () => {
  stopRecording();
  await patchSettings({ keys: { ...DEFAULT_KEYS } });
  track('drawing_shortcuts_reset');
  renderKeys(DEFAULT_KEYS);
  setStatus('Shortcuts reset to defaults.');
});

// ---------- drawing defaults ----------
function renderDrawing(settings) {
  const color = settings.color || PRESETS[0];
  $('#colors').innerHTML = PRESETS.map((c) =>
    `<button class="swatch${c === color ? ' on' : ''}" data-color="${c}" style="--c:${c}" aria-label="Color ${c}"></button>`).join('');
  $('#colors').querySelectorAll('.swatch').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.color !== color) track('default_color_changed', { color: b.dataset.color });
    await patchSettings({ color: b.dataset.color });
    renderDrawing({ ...settings, color: b.dataset.color });
  }));
  const current = settings.fadeEnabled ? settings.fadeSeconds ?? 5 : 0;
  $('#fade').innerHTML = FADE_OPTIONS.map((s) =>
    `<button data-seconds="${s}"${s === current ? ' class="on"' : ''}>${s === 0 ? 'Off' : s + ' s'}</button>`).join('');
  $('#fade').querySelectorAll('button').forEach((b) => b.addEventListener('click', async () => {
    const s = +b.dataset.seconds;
    const patch = s === 0 ? { fadeEnabled: false } : { fadeEnabled: true, fadeSeconds: s };
    if (s !== current) track('default_auto_erase_changed', { enabled: s !== 0, seconds: s || null });
    await patchSettings(patch);
    renderDrawing({ ...settings, ...patch });
  }));
}

// ---------- usage data ----------
const analyticsBox = $('#analytics');
async function renderAnalytics() {
  let enabled = true;
  try {
    const res = await chrome.runtime.sendMessage({ type: 'showmark:analytics-get' });
    if (typeof res?.enabled === 'boolean') enabled = res.enabled;
  } catch {}
  analyticsBox.checked = enabled;
  analyticsBox.disabled = false;
}
analyticsBox.addEventListener('change', async () => {
  const enabled = analyticsBox.checked;
  analyticsBox.disabled = true;
  try { await chrome.runtime.sendMessage({ type: 'showmark:analytics-set', enabled }); } catch {}
  analyticsBox.disabled = false;
  $('#analytics-status').textContent = enabled ? 'Usage data is on. Thanks!' : 'Usage data is off. Nothing is sent.';
});

// ---------- init ----------
(async () => {
  const launchShortcutAssigned = await refreshLaunchShortcut();
  const settings = await loadSettings();
  renderKeys(settings.keys);
  renderDrawing(settings);
  await renderAnalytics();
  track('settings_page_viewed', { launch_shortcut_assigned: launchShortcutAssigned });
})();
