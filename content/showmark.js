// Showmark – content script. Injected on demand; everything lives in a Shadow DOM.
(() => {
  // Re-injection (e.g. after the extension reloads) replaces any previous instance.
  try { window.__showmark?.destroy?.(); } catch {}
  document.querySelectorAll('showmark-root').forEach((el) => el.remove());

  const PRESETS = ['#ff9f0a', '#ff3b30', '#34c759', '#af52de', '#00c7be', '#ffffff'];
  const FADE_OPTIONS = [0, 2, 5, 10];
  const STROKE = 3;
  // Single-key shortcuts while the overlay is active. Editable from the options page.
  const DEFAULT_KEYS = { rect: 'r', circle: 'c', free: 'f', fade: 't', collapse: 'h', exit: 'q' };
  const PERSISTED = ['mode', 'color', 'fadeEnabled', 'fadeSeconds', 'toolbarPos', 'collapsed', 'keys'];

  const state = {
    active: false,
    mode: 'rect',          // 'rect' | 'circle' | 'free'
    color: PRESETS[0],
    fadeEnabled: false,
    fadeSeconds: 5,
    toolbarPos: null,      // {left, top} in px, or null = bottom-center
    collapsed: false,
    keys: { ...DEFAULT_KEYS },
  };

  // ---------- storage ----------
  const store = {
    async load() {
      try {
        const { settings } = await chrome.storage.local.get('settings');
        if (settings) applySettings(settings);
      } catch {}
    },
    save() {
      try { chrome.storage.local.set({ settings: pick(state) }).catch(() => {}); } catch {}
    },
  };
  function pick(s) {
    const out = {};
    for (const k of PERSISTED) if (s[k] !== undefined) out[k] = s[k];
    return out;
  }
  function applySettings(settings) {
    Object.assign(state, pick(settings));
    state.keys = { ...DEFAULT_KEYS, ...(settings.keys || {}) };
  }
  // Live-apply changes made on the options page while the overlay is open.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.settings?.newValue) return;
      applySettings(changes.settings.newValue);
      if (state.active) render();
    });
  } catch {}
  let saveTimer;
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(store.save, 150); };

  // ---------- analytics ----------
  // Relayed to the service worker, which owns the anonymous ID and the network (see lib/analytics.js).
  // Only names and flat settings values go in here: never page URLs, titles, content or drawings.
  const session = { startedAt: 0, shapes: 0, clears: 0 };
  function track(event, properties = {}) {
    try { chrome.runtime.sendMessage({ type: 'showmark:track', event, properties }).catch(() => {}); } catch {}
  }
  const fadeProps = () => ({ fade_enabled: state.fadeEnabled, fade_seconds: state.fadeEnabled ? state.fadeSeconds : null });

  // ---------- DOM ----------
  const host = document.createElement('showmark-root');
  host.hidden = true;
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
<style>
  :host { all: initial; display: block; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
          font: 500 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-user-select: none; user-select: none; color-scheme: dark;
          /* Dark Graphite Precision Amber */
          --canvas: #0c0e12; --surface: #111317; --acrylic: rgba(22,24,29,.85); --surface-high: #1e2024;
          --surface-highest: #282a2e; --border: #282a2e; --border-2: #333539; --divider: rgba(255,255,255,.08);
          --fg: #e2e2e8; --muted: #9ca3af; --primary: #ff985b; --primary-soft: rgba(255,152,91,.15);
          --primary-glow: rgba(255,152,91,.25); --danger: #ff3b30; --hover: rgba(255,255,255,.05); }
  :host([hidden]) { display: none; }
  * { box-sizing: border-box; }

  .overlay { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: auto; cursor: crosshair; }
  .overlay .shape { fill: none; stroke-width: ${STROKE}; stroke-linecap: round; stroke-linejoin: round; }
  .overlay .shape.fading { transition: opacity .6s ease; opacity: 0; } /* fallback when un-draw isn't possible */

  /* Floating annotation dock (HUD) */
  .bar { position: fixed; inset-inline: 0; bottom: 12px; margin-inline: auto; width: max-content;
         display: flex; align-items: center; gap: 4px; padding: 4px;
         background: var(--acrylic); color: var(--fg); border: 1px solid var(--border); border-radius: 999px;
         box-shadow: 0 6px 20px -2px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.04);
         -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
         pointer-events: auto; }
  .bar.placed { inset-inline: auto; margin-inline: 0; bottom: auto; }
  .bar.dragging { cursor: grabbing; }

  .bar button { appearance: none; border: 0; background: transparent; color: var(--muted); width: 28px; height: 28px;
                border-radius: 6px; display: grid; place-items: center; cursor: pointer; padding: 0; font: inherit;
                transition: background .12s ease, color .12s ease, box-shadow .12s ease; }
  .bar button:hover { background: var(--hover); color: var(--fg); }
  .bar button.on { background: var(--primary-soft); color: var(--primary); box-shadow: inset 0 0 0 1px rgba(255,152,91,.45); }
  .bar button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75;
                    stroke-linecap: round; stroke-linejoin: round; }
  .bar button svg.vb24 { width: 15px; height: 15px; stroke-width: 2.4; } /* 24-unit grid: keeps the same visual stroke */
  .bar .grip { cursor: grab; color: var(--muted); width: 16px; height: 28px; display: grid; place-items: center; }
  .bar .grip svg { width: 16px; height: 16px; }
  .bar .sep { width: 1px; height: 16px; background: var(--divider); margin: 0 2px; }
  .bar .dot i { display: block; width: 14px; height: 14px; border-radius: 50%; background: var(--color);
                box-shadow: 0 0 0 1px rgba(255,255,255,.12); }
  .bar .fade { width: auto; padding: 0 8px 0 6px; gap: 5px; display: inline-flex; }
  .bar .fade-label { font-size: 11px; font-variant-numeric: tabular-nums; min-width: 18px; text-align: left; }
  .bar .clear:hover { background: rgba(255,59,48,.12); color: var(--danger); box-shadow: inset 0 0 0 1px rgba(255,59,48,.35); }

  .bar.collapsed .full { display: none; }
  .bar:not(.collapsed) .mini { display: none; }
  .bar.collapsed { padding: 3px; gap: 0; }
  .bar .mini { width: 28px; height: 28px; border-radius: 50%; color: var(--fg); cursor: grab;
               box-shadow: inset 0 0 0 2.5px var(--color); }
  .bar .mini:hover { background: var(--hover); }
  .bar .mini svg { width: 12px; height: 12px; }

  /* Popovers (level 2) */
  .pop { position: fixed; inset: auto; margin: 0; overflow: visible; padding: 6px; gap: 6px; align-items: center;
         background: var(--surface-high); border: 1px solid var(--border-2); border-radius: 8px;
         box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 6px 20px -2px rgba(0,0,0,.6);
         pointer-events: auto; color: var(--fg);
         /* Anchored to the button that opened it; flips below when there is no room above. */
         position-area: block-start; position-try-fallbacks: flip-block; margin-block: 8px; }
  .pop:popover-open { display: flex; }
  .pop .swatch { width: 18px; height: 18px; border-radius: 50%; border: 0; cursor: pointer; padding: 0; margin: 2px;
                 background: var(--c); box-shadow: 0 0 0 1px rgba(255,255,255,.08); transition: box-shadow .12s ease; }
  .pop .swatch:hover { box-shadow: 0 0 0 2px var(--surface-high), 0 0 0 3.5px var(--muted); }
  .pop .swatch.on { box-shadow: 0 0 0 2px var(--surface-high), 0 0 0 3.5px #fff; }
  .pop .custom { position: relative; width: 18px; height: 18px; margin: 2px; border-radius: 50%; overflow: hidden; cursor: pointer;
                 background: conic-gradient(#ff9f0a, #ff3b30, #af52de, #00c7be, #34c759, #ff9f0a);
                 box-shadow: 0 0 0 1px rgba(255,255,255,.08); }
  .pop .custom:hover { box-shadow: 0 0 0 2px var(--surface-high), 0 0 0 3.5px var(--muted); }
  .pop .custom input { position: absolute; inset: -8px; width: 200%; height: 200%; opacity: 0; cursor: pointer; }
  .pop .opt { appearance: none; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 11px;
              height: 24px; padding: 0 8px; border-radius: 4px; cursor: pointer; }
  .pop .opt:hover { background: var(--hover); color: var(--fg); }
  .pop .opt.on { background: var(--primary-soft); color: var(--primary); box-shadow: inset 0 0 0 1px rgba(255,152,91,.45); }
</style>
<svg class="overlay" xmlns="http://www.w3.org/2000/svg"><g class="layer"></g></svg>
<div class="bar" role="toolbar" aria-label="Showmark">
  <button class="mini" title="Expand toolbar (H)"></button>
  <div class="full grip" title="Drag to move">${icon('grip')}</div>
  <button class="full mode" data-mode="rect">${icon('rect')}</button>
  <button class="full mode" data-mode="circle">${icon('circle')}</button>
  <button class="full mode" data-mode="free">${icon('free')}</button>
  <span class="full sep"></span>
  <button class="full dot" title="Color (1–6)" popovertarget="sm-colors"><i></i></button>
  <button class="full fade" popovertarget="sm-fades">${icon('clock')}<span class="fade-label">off</span></button>
  <span class="full sep"></span>
  <button class="full clear" title="Clear all (Esc · press twice to exit)">${icon('trash')}</button>
  <button class="full collapse">${icon('collapse')}</button>
  <button class="full gear" title="Settings & shortcuts">${icon('gear')}</button>
  <button class="full close">${icon('close')}</button>
</div>
<div class="pop colors" id="sm-colors" popover="auto"></div>
<div class="pop fades" id="sm-fades" popover="auto"></div>`;

  function icon(name) {
    const paths = {
      rect: '<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/>',
      circle: '<circle cx="8" cy="8" r="5.25"/>',
      free: '<path d="M2.5 11.5c1.5-5.5 3-6.5 4.2-2.5s2.2 4 6.8-4"/>',
      clock: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2.2 1.3"/>',
      trash: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8h5.8l.6-8"/>',
      collapse: '<path d="M6 4l4 4-4 4"/>',
      close: '<path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/>',
      // Cog with teeth (24-unit grid, scaled down at render time).
      gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
      grip: '<circle cx="6" cy="4.5" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="4.5" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="6" cy="11.5" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="11.5" r="1" fill="currentColor" stroke="none"/>',
    };
    const big = name === 'gear'; // drawn on a 24-unit grid
    return `<svg viewBox="0 0 ${big ? 24 : 16} ${big ? 24 : 16}" class="${big ? 'vb24' : ''}" aria-hidden="true">${paths[name]}</svg>`;
  }

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const overlay = $('.overlay');
  const layer = $('.layer');
  const bar = $('.bar');
  const colorsPop = $('.pop.colors');
  const fadesPop = $('.pop.fades');

  colorsPop.innerHTML =
    PRESETS.map((c, i) => `<button class="swatch" data-color="${c}" style="--c:${c}" title="${i + 1}"></button>`).join('') +
    `<label class="custom" title="Custom color"><input type="color"></label>`;
  fadesPop.innerHTML = FADE_OPTIONS.map((s) =>
    `<button class="opt" data-seconds="${s}">${s === 0 ? 'Off' : s + ' s'}</button>`).join('');

  // ---------- rendering state -> UI ----------
  const K = (action) => state.keys[action].toUpperCase();
  function render() {
    $$('.mode').forEach((b) => b.classList.toggle('on', b.dataset.mode === state.mode));
    $('.mode[data-mode="rect"]').title = `Rectangle (${K('rect')})`;
    $('.mode[data-mode="circle"]').title = `Circle (${K('circle')})`;
    $('.mode[data-mode="free"]').title = `Freehand (${K('free')})`;
    $('.fade').title = `Auto-erase after a few seconds (${K('fade')})`;
    $('.collapse').title = `Collapse (${K('collapse')})`;
    $('.close').title = `Exit Showmark (${K('exit')} or Esc Esc)`;
    bar.style.setProperty('--color', state.color);
    $$('.swatch').forEach((b) => b.classList.toggle('on', b.dataset.color === state.color));
    $('.custom input').value = toHex(state.color);
    const fadeBtn = $('.fade');
    fadeBtn.classList.toggle('on', state.fadeEnabled);
    $('.fade-label').textContent = state.fadeEnabled ? `${state.fadeSeconds}s` : 'off';
    $$('.opt').forEach((b) => b.classList.toggle('on',
      state.fadeEnabled ? +b.dataset.seconds === state.fadeSeconds : +b.dataset.seconds === 0));
    bar.classList.toggle('collapsed', state.collapsed);
    $('.mini').innerHTML = icon(state.mode);
    $('.mini').title = `Expand toolbar (${K('collapse')}) · ${state.mode}`;
    placeBar();
  }

  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    const m = c.match(/\d+/g) || [255, 0, 0];
    return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
  }

  function placeBar() {
    if (!state.toolbarPos) { bar.classList.remove('placed'); bar.style.left = bar.style.top = ''; return; }
    bar.classList.add('placed');
    const r = bar.getBoundingClientRect();
    const left = clamp(state.toolbarPos.left, 4, Math.max(4, innerWidth - r.width - 4));
    const top = clamp(state.toolbarPos.top, 4, Math.max(4, innerHeight - r.height - 4));
    bar.style.left = left + 'px';
    bar.style.top = top + 'px';
  }
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ---------- popovers ----------
  // Opened declaratively via popovertarget (top layer + light dismiss); positioned by CSS anchor positioning.
  const popOpen = (pop) => pop.matches(':popover-open');
  const closePops = () => { for (const p of [colorsPop, fadesPop]) if (popOpen(p)) p.hidePopover(); };

  // ---------- settings mutations ----------
  // `via` says what the user touched ('toolbar' | 'key' | ...); pass null to change without tracking.
  function setMode(m, via = 'toolbar') {
    if (via && state.mode !== m) track('drawing_tool_selected', { tool: m, via });
    state.mode = m; render(); saveSoon();
  }
  function setColor(c, via = 'toolbar') {
    if (via && state.color !== c) track('color_changed', { color: c, is_preset: PRESETS.includes(c), via });
    state.color = c; render(); saveSoon();
  }
  function setFade(seconds, via = 'toolbar') {
    const changed = seconds === 0 ? state.fadeEnabled : !state.fadeEnabled || state.fadeSeconds !== seconds;
    if (seconds === 0) state.fadeEnabled = false;
    else { state.fadeEnabled = true; state.fadeSeconds = seconds; }
    if (via && changed) track('auto_erase_changed', { ...fadeProps(), via });
    render(); saveSoon();
  }
  function toggleFade(via = 'key') {
    state.fadeEnabled = !state.fadeEnabled;
    track('auto_erase_changed', { ...fadeProps(), via });
    render(); saveSoon();
  }
  function toggleCollapsed(via = 'toolbar') {
    state.collapsed = !state.collapsed;
    track('toolbar_toggled', { collapsed: state.collapsed, via });
    closePops(); render(); saveSoon();
  }

  // ---------- toolbar events ----------
  bar.addEventListener('click', (e) => e.target.closest('button')?.blur()); // keep Enter/Space from re-firing
  $$('.mode').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('.clear').addEventListener('click', () => clearAll('toolbar'));
  $('.collapse').addEventListener('click', () => toggleCollapsed('toolbar'));
  $('.gear').addEventListener('click', () => {
    track('settings_opened', { via: 'toolbar' });
    try { chrome.runtime.sendMessage({ type: 'showmark:open-options' }).catch(() => {}); } catch {}
  });
  $('.close').addEventListener('click', () => deactivate('toolbar'));
  $$('.swatch').forEach((b) => b.addEventListener('click', () => { setColor(b.dataset.color); closePops(); }));
  // The picker fires `input` continuously while dragging; track once, when the user is done.
  $('.custom input').addEventListener('input', (e) => setColor(e.target.value, null));
  $('.custom input').addEventListener('change', (e) =>
    track('color_changed', { color: e.target.value, is_preset: false, via: 'custom_picker' }));
  $$('.opt').forEach((b) => b.addEventListener('click', () => { setFade(+b.dataset.seconds); closePops(); }));

  // Drag (grip when expanded, whole dot when collapsed; a tiny move counts as a click).
  function makeDraggable(handle, onClick) {
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      closePops();
      const r = bar.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, left: r.left, top: r.top };
      let moved = false;
      const move = (ev) => {
        const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        moved = true;
        bar.classList.add('dragging');
        state.toolbarPos = { left: start.left + dx, top: start.top + dy };
        placeBar();
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        bar.classList.remove('dragging');
        if (moved) { saveSoon(); track('toolbar_moved', { collapsed: state.collapsed }); } else onClick?.();
      };
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
  }
  makeDraggable($('.grip'));
  makeDraggable($('.mini'), toggleCollapsed);

  // ---------- drawing ----------
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const fadeTimers = new Map();
  let drawing = null; // { el, x0, y0, points }

  function updateLayer() {
    layer.setAttribute('transform', `translate(${-scrollX} ${-scrollY})`);
  }

  function docPoint(e) { return { x: e.clientX + scrollX, y: e.clientY + scrollY }; }

  overlay.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const p = docPoint(e);
    const tag = state.mode === 'rect' ? 'rect' : state.mode === 'circle' ? 'ellipse' : 'path';
    const el = document.createElementNS(SVG_NS, tag);
    el.classList.add('shape');
    el.setAttribute('stroke', state.color);
    if (tag === 'path') el.setAttribute('d', `M${p.x} ${p.y}`);
    layer.appendChild(el);
    drawing = { el, x0: p.x, y0: p.y, points: [p] };
    try { overlay.setPointerCapture(e.pointerId); } catch {}
    updateShape(e);
  });

  overlay.addEventListener('pointermove', (e) => { if (drawing) updateShape(e); });
  overlay.addEventListener('pointerup', finishShape);
  overlay.addEventListener('pointercancel', finishShape);

  function updateShape(e) {
    const { el, x0, y0, points } = drawing;
    const p = docPoint(e);
    if (state.mode === 'free') {
      const last = points[points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return;
      points.push(p);
      el.setAttribute('d', smoothPath(points));
      return;
    }
    let w = p.x - x0, h = p.y - y0;
    if (e.shiftKey) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * s; h = Math.sign(h || 1) * s; }
    const x = Math.min(x0, x0 + w), y = Math.min(y0, y0 + h), aw = Math.abs(w), ah = Math.abs(h);
    if (state.mode === 'rect') {
      el.setAttribute('x', x); el.setAttribute('y', y);
      el.setAttribute('width', aw); el.setAttribute('height', ah); el.setAttribute('rx', 2);
    } else {
      el.setAttribute('cx', x + aw / 2); el.setAttribute('cy', y + ah / 2);
      el.setAttribute('rx', aw / 2); el.setAttribute('ry', ah / 2);
    }
  }

  function smoothPath(pts) {
    if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${r(p.x)} ${r(p.y)}`).join('');
    let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += `Q${r(pts[i].x)} ${r(pts[i].y)} ${r(mx)} ${r(my)}`;
    }
    const l = pts[pts.length - 1];
    return d + `L${r(l.x)} ${r(l.y)}`;
  }
  const r = (n) => Math.round(n * 10) / 10;

  function finishShape(e) {
    if (!drawing) return;
    let { el } = drawing;
    const { points, x0, y0 } = drawing;
    drawing = null;
    try { overlay.releasePointerCapture(e.pointerId); } catch {}
    if (state.mode === 'free') {
      if (points.length === 1) { // a tap: draw a dot
        const p = points[0];
        el.setAttribute('d', `M${r(p.x)} ${r(p.y)}l0.1 0`);
      }
    } else {
      const size = state.mode === 'rect'
        ? Math.max(+el.getAttribute('width'), +el.getAttribute('height'))
        : Math.max(+el.getAttribute('rx'), +el.getAttribute('ry')) * 2;
      if (size < 3) { el.remove(); return; }
      // Convert to a path that starts where the user began dragging, so the
      // un-draw animation erases from the first pixel drawn.
      const path = document.createElementNS(SVG_NS, 'path');
      path.classList.add('shape');
      path.setAttribute('stroke', el.getAttribute('stroke'));
      path.setAttribute('d', state.mode === 'rect' ? rectPath(el, x0, y0) : ellipsePath(el, x0, y0));
      el.replaceWith(path);
      el = path;
    }
    scheduleFade(el);
    session.shapes += 1;
    track('shape_drawn', {
      shape: state.mode,
      ...fadeProps(),
      constrained: state.mode !== 'free' && Boolean(e.shiftKey),
      is_dot: state.mode === 'free' && points.length === 1,
    });
  }

  function rectPath(rect, x0, y0) {
    const x = +rect.getAttribute('x'), y = +rect.getAttribute('y');
    const w = +rect.getAttribute('width'), h = +rect.getAttribute('height');
    const sx = Math.abs(x0 - x) <= Math.abs(x0 - (x + w)) ? x : x + w, ox = sx === x ? x + w : x;
    const sy = Math.abs(y0 - y) <= Math.abs(y0 - (y + h)) ? y : y + h, oy = sy === y ? y + h : y;
    return `M${r(sx)} ${r(sy)}H${r(ox)}V${r(oy)}H${r(sx)}Z`;
  }
  function ellipsePath(ell, x0, y0) {
    const cx = +ell.getAttribute('cx'), cy = +ell.getAttribute('cy');
    const rx = Math.max(+ell.getAttribute('rx'), 0.5), ry = Math.max(+ell.getAttribute('ry'), 0.5);
    const a = Math.atan2((y0 - cy) / ry, (x0 - cx) / rx); // parametric angle towards the drag origin
    const sx = cx + rx * Math.cos(a), sy = cy + ry * Math.sin(a);
    const ox = cx - rx * Math.cos(a), oy = cy - ry * Math.sin(a);
    return `M${r(sx)} ${r(sy)}A${r(rx)} ${r(ry)} 0 1 1 ${r(ox)} ${r(oy)}A${r(rx)} ${r(ry)} 0 1 1 ${r(sx)} ${r(sy)}Z`;
  }

  // Erase a shape progressively from its first drawn pixel by sliding the dash gap along the stroke,
  // while fading the whole stroke out at the same time.
  function unDraw(el) {
    const kill = () => el.remove();
    if (typeof el.getTotalLength !== 'function') {
      el.classList.add('fading');
      el.addEventListener('transitionend', kill, { once: true });
      setTimeout(kill, 800);
      return;
    }
    const len = Math.max(el.getTotalLength(), 1);
    const duration = Math.min(900, Math.max(250, len * 0.4)); // longer strokes take a bit longer
    el.style.strokeDasharray = `${len} ${len}`;
    el.style.strokeDashoffset = '0';
    const anim = el.animate(
      [{ strokeDashoffset: 0, opacity: 1 }, { strokeDashoffset: -len, opacity: 0 }],
      { duration, easing: 'ease-in', fill: 'forwards' },
    );
    anim.onfinish = kill;
    setTimeout(kill, duration + 300); // safety net
  }

  function scheduleFade(el) {
    if (!state.fadeEnabled) return;
    const t = setTimeout(() => {
      fadeTimers.delete(el);
      unDraw(el);
    }, state.fadeSeconds * 1000);
    fadeTimers.set(el, t);
  }

  function clearAll(via) {
    const count = layer.childElementCount;
    fadeTimers.forEach((t) => clearTimeout(t));
    fadeTimers.clear();
    if (drawing) { drawing.el.remove(); drawing = null; }
    layer.replaceChildren();
    if (via) { session.clears += 1; track('canvas_cleared', { via, shapes_cleared: count }); }
  }

  // ---------- keyboard ----------
  const DOUBLE_ESC_MS = 400;
  let lastEsc = 0;
  function onEscape() {
    const now = Date.now();
    if (now - lastEsc < DOUBLE_ESC_MS) { lastEsc = 0; deactivate('double_escape'); return; } // double tap: exit
    lastEsc = now;
    if (popOpen(colorsPop) || popOpen(fadesPop)) closePops();
    else clearAll('escape');
  }
  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.composedPath()[0];
    if (t instanceof HTMLInputElement) return; // color picker input
    const k = e.key.toLowerCase();
    const action = k === 'escape' ? 'escape' : Object.keys(state.keys).find((a) => state.keys[a] === k);
    let handled = true;
    switch (action) {
      case 'escape': onEscape(); break;
      case 'rect': setMode('rect', 'key'); break;
      case 'circle': setMode('circle', 'key'); break;
      case 'free': setMode('free', 'key'); break;
      case 'fade': toggleFade('key'); break;
      case 'collapse': toggleCollapsed('key'); break;
      case 'exit': deactivate('exit_key'); break;
      default:
        if (/^[1-6]$/.test(k)) setColor(PRESETS[+k - 1], 'key');
        else handled = false;
    }
    if (handled) { e.preventDefault(); e.stopPropagation(); }
  }

  // ---------- lifecycle ----------
  let loaded = false;
  async function activate() {
    if (state.active) return;
    if (!loaded) { await store.load(); loaded = true; }
    state.active = true;
    if (!host.isConnected) document.documentElement.appendChild(host);
    host.hidden = false;
    try { document.activeElement?.blur(); } catch {}
    updateLayer();
    render();
    session.startedAt = Date.now(); session.shapes = 0; session.clears = 0;
    track('overlay_activated', {
      tool: state.mode, ...fadeProps(), toolbar_collapsed: state.collapsed, toolbar_moved: Boolean(state.toolbarPos),
    });
    addEventListener('keydown', onKey, true);
    addEventListener('scroll', updateLayer, { passive: true });
    addEventListener('resize', onResize);
  }
  // `via`: 'toolbar' | 'exit_key' | 'double_escape' | 'launcher' (icon or shortcut) | 'reload'.
  // Nothing fires when the tab closes or navigates, so durations only cover explicit exits.
  function deactivate(via = 'launcher') {
    if (!state.active) return;
    state.active = false;
    track('overlay_deactivated', {
      via,
      duration_seconds: Math.round((Date.now() - session.startedAt) / 1000),
      shapes_drawn: session.shapes,
      clears: session.clears,
    });
    clearAll();
    closePops();
    host.hidden = true;
    removeEventListener('keydown', onKey, true);
    removeEventListener('scroll', updateLayer);
    removeEventListener('resize', onResize);
  }
  function onResize() { updateLayer(); placeBar(); }
  function toggle() { return state.active ? deactivate() : activate(); }
  function destroy() { deactivate('reload'); host.remove(); }

  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === 'showmark:toggle') { toggle(); sendResponse({ ok: true }); }
    });
  } catch {}

  window.__showmark = { toggle, destroy };
})();
