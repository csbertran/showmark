// Showmark – background service worker.
// Toggles the overlay in the active tab, opens the options page (onboarding) on first install, and is the
// single place that talks to PostHog (see lib/analytics.js). Other contexts relay events here.

import { capture, isEnabled, personProperties, setEnabled } from './lib/analytics.js';

const TOGGLE = { type: 'showmark:toggle' };

async function sendToggle(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, TOGGLE);
    return true;
  } catch {
    return false; // no content script in this tab yet
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;
  if (await sendToggle(tab.id)) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/showmark.js'],
    });
    await sendToggle(tab.id);
  } catch (err) {
    // Restricted pages (chrome://, Web Store, PDF viewer, etc.). Badge the icon and open a popup that says why.
    // All per-tab action state (badge, title, popup) is cleared by Chrome when the tab navigates.
    console.warn('[Showmark] Cannot run on this page:', err?.message || err);
    const kind = pageKind(err?.message);
    // Deliberately no error message or URL in the event: Chrome's message includes the page address.
    capture('overlay_activation_failed', { reason: 'restricted_page', page_kind: kind });
    await explainRestricted(tab.id, kind);
  }
});

// Chrome's error message contains the page URL. Reduce it to a coarse category here; only the category
// is ever sent anywhere.
function pageKind(message = '') {
  if (/gallery cannot be scripted|chromewebstore\.google\.com|chrome\.google\.com\/webstore/i.test(message)) return 'webstore';
  if (/\.pdf\b|mhjfbmdgcfjbbpaeojofohoefgiehjai/i.test(message)) return 'pdf';
  if (/file:\/\//i.test(message)) return 'file';
  if (/(chrome|chrome-extension|chrome-untrusted|edge|brave|about|devtools|view-source):/i.test(message)) return 'browser';
  return 'other';
}

async function explainRestricted(tabId, kind) {
  const popup = (retry) => `popup/blocked.html?kind=${kind}${retry ? '&retry=1' : ''}`;
  try {
    await chrome.action.setBadgeText({ tabId, text: '!' });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#ff3b30' });
    await chrome.action.setTitle({ tabId, title: "Showmark can't run on this page. Click for details." });
  } catch {}
  // chrome.action.openPopup() exists from Chrome 127; on older versions the badge is the only cue until
  // the next click, which then opens the popup set here.
  try {
    if (chrome.action.openPopup) {
      await chrome.action.setPopup({ tabId, popup: popup(false) });
      await chrome.action.openPopup();
    }
  } catch {}
  // Any later click or shortcut press on this tab opens the explanation directly, marked as a retry.
  try { await chrome.action.setPopup({ tabId, popup: popup(true) }); } catch {}
}

// The options page doubles as onboarding: open it once after install.
chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  const { version } = chrome.runtime.getManifest();
  if (reason === 'install') {
    await capture('extension_installed', {
      $set: personProperties(),
      $set_once: { installed_at: new Date().toISOString(), initial_extension_version: version },
    });
    await chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html?onboarding=1') });
  } else if (reason === 'update' && previousVersion && previousVersion !== version) {
    await capture('extension_updated', { previous_version: previousVersion, $set: personProperties() });
  }
});

// Messages from our own content script and options page.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !msg || typeof msg !== 'object') return;
  switch (msg.type) {
    // The toolbar's gear button asks us to open the options page (content scripts can't do it directly).
    case 'showmark:open-options':
      chrome.runtime.openOptionsPage();
      return;
    case 'showmark:track':
      capture(msg.event, msg.properties);
      return;
    case 'showmark:analytics-get':
      (async () => {
        try { sendResponse({ enabled: await isEnabled() }); } catch { sendResponse({ enabled: true }); }
      })();
      return true;
    case 'showmark:analytics-set':
      (async () => {
        try { await setEnabled(Boolean(msg.enabled)); sendResponse({ ok: true }); } catch { sendResponse({ ok: false }); }
      })();
      return true;
  }
});
