// Showmark – shown by the toolbar icon on pages where Chrome doesn't let extensions run (see background.js).
const REASONS = {
  browser: 'Chrome blocks extensions on its own pages, such as settings, new tabs and chrome:// addresses.',
  webstore: 'Chrome blocks extensions on the Chrome Web Store.',
  pdf: "PDFs open in Chrome's built-in viewer, which extensions can't draw on.",
  file: "Showmark doesn't have access to files on your computer yet.",
  other: 'Chrome blocks extensions on this page.',
};

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const kind = Object.hasOwn(REASONS, params.get('kind')) ? params.get('kind') : 'other';

function track(event, properties = {}) {
  try { chrome.runtime.sendMessage({ type: 'showmark:track', event, properties }).catch(() => {}); } catch {}
}

$('#reason').textContent = REASONS[kind];

(async () => {
  // A local PDF still opens in the PDF viewer, so file access only helps for other local files.
  if (kind === 'file' && !(await chrome.extension.isAllowedFileSchemeAccess())) $('#fix').hidden = false;
})();

$('#file-access').addEventListener('click', () => {
  track('file_access_settings_opened');
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
  window.close();
});
$('#settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

track('blocked_popup_viewed', { page_kind: kind, retry: params.has('retry') });
