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
    // Restricted pages (chrome://, Web Store, PDF viewer, etc.). Tell the user via a per-tab badge;
    // it clears automatically when the tab navigates.
    console.warn('[Showmark] Cannot run on this page:', err?.message || err);
    // Deliberately no error message or URL in the event: Chrome's message includes the page address.
    capture('overlay_activation_failed', { reason: 'restricted_page' });
    try {
      await chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#ff3b30' });
      await chrome.action.setTitle({ tabId: tab.id, title: "Showmark can't run on this page (browser pages, Web Store, PDFs)" });
    } catch {}
  }
});

// The options page doubles as onboarding: open it once after install.
chrome.runtime.onInstalled.addListener(async ({ reason, previousVersion }) => {
  const { version } = chrome.runtime.getManifest();
  if (reason === 'install') {
    await capture('extension_installed', {
      $set: personProperties(),
      $set_once: { installed_at: new Date().toISOString(), initial_extension_version: version },
    });
    await chrome.runtime.openOptionsPage();
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
