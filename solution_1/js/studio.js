import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';
import { components, categories, defaultsFor, usageCode, sourceCode, stripTags, bindInteractive, esc, DEFAULT_THEME, FONT_OPTIONS, applyTheme, themeToTokens } from './components.js';

const $ = (s) => document.querySelector(s);
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.75 } });

const state = {
  id: null, props: {}, codeTab: 'usage', search: '',
  theme: { ...DEFAULT_THEME }, themes: [], activeThemeId: null,
  user: null,
};

// ---------- Toast / copy ----------
let tt;
function toast(msg, icon = 'check') {
  const t = $('#toast');
  t.querySelector('span').textContent = msg;
  t.querySelector('svg, i')?.remove();
  const i = document.createElement('i'); i.setAttribute('data-lucide', icon); t.prepend(i); refreshIcons();
  t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copy(text, msg = 'Copied to clipboard') {
  try { await navigator.clipboard.writeText(text); } catch { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast(msg);
}

// ---------- Sidebar ----------
function renderList() {
  const q = state.search.toLowerCase();
  let total = 0;
  $('#comp-list').innerHTML = categories.map((cat) => {
    const items = Object.entries(components).filter(([id, c]) => c.category === cat && (!q || c.name.toLowerCase().includes(q) || id.includes(q)));
    total += items.length;
    if (!items.length) return '';
    return `<div class="label-xs px-2.5 pt-4 pb-1.5">${cat}</div>` + items.map(([id, c]) =>
      `<button class="side-item ${id === state.id ? 'on' : ''}" data-id="${id}"><i data-lucide="${c.icon}"></i>${c.name}</button>`).join('');
  }).join('') || '<div class="text-[13px] text-[#63636b] text-center py-10">No matches</div>';
  $('#comp-count').textContent = `${Object.keys(components).length} components`;
  $('#comp-list').querySelectorAll('[data-id]').forEach((b) => b.onclick = () => { select(b.dataset.id); closeDrawers(); });
  refreshIcons();
}
$('#search').addEventListener('input', (e) => { state.search = e.target.value; renderList(); });
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') { e.preventDefault(); $('#search').focus(); }
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && document.activeElement === document.body) {
    const keys = Object.keys(components); const i = keys.indexOf(state.id);
    const n = keys[(i + (e.key === 'ArrowDown' ? 1 : -1) + keys.length) % keys.length];
    e.preventDefault(); select(n);
  }
});

// ---------- Selection ----------
function select(id) {
  if (!components[id]) id = 'button';
  state.id = id;
  state.props = defaultsFor(id);
  history.replaceState(null, '', '#' + id);
  const c = components[id];
  $('#comp-name').textContent = c.name;
  $('#comp-pkg').textContent = c.pkg;
  document.title = `${c.name} — InkBuddy Studio`;
  renderList(); renderProps(); renderPreview();
}

// ---------- Props panel ----------
function renderProps() {
  const c = components[state.id];
  const panel = $('#panel-props');
  panel.innerHTML = `<p class="text-[13px] text-[#a1a1aa] leading-relaxed -mt-1">${c.desc}</p>` + Object.entries(c.props).map(([k, cfg]) => {
    const label = cfg.label || k;
    const v = state.props[k];
    if (cfg.type === 'boolean') return `<div class="flex items-center justify-between"><span class="text-[13px] capitalize">${label}</span><button class="toggle ${v ? 'on' : ''}" data-k="${k}" role="switch" aria-checked="${v}"></button></div>`;
    let ctl;
    if (cfg.type === 'select' && cfg.options.length <= 3) ctl = `<div class="seg">${cfg.options.map((o) => `<button data-k="${k}" data-v="${o}" class="${o === v ? 'on' : ''}">${o}</button>`).join('')}</div>`;
    else if (cfg.type === 'select') ctl = `<select class="field" data-k="${k}">${cfg.options.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    else if (cfg.type === 'number') ctl = `<div class="flex items-center gap-3"><input type="range" class="flex-1 accent-[#4ade80]" data-k="${k}" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${v}"><span class="mono text-[12px] text-[#a1a1aa] w-8 text-right" data-out="${k}">${v}</span></div>`;
    else ctl = (v.length > 40 ? `<textarea class="field" rows="3" data-k="${k}">${esc(v)}</textarea>` : `<input class="field" data-k="${k}" value="${esc(v)}">`);
    return `<div class="space-y-2"><div class="label-xs">${label}</div>${ctl}</div>`;
  }).join('');

  panel.querySelectorAll('.toggle').forEach((b) => b.onclick = () => { state.props[b.dataset.k] = !state.props[b.dataset.k]; b.classList.toggle('on'); renderPreview(); });
  panel.querySelectorAll('.seg button').forEach((b) => b.onclick = () => {
    state.props[b.dataset.k] = b.dataset.v;
    b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); renderPreview();
  });
  panel.querySelectorAll('select').forEach((s) => s.onchange = () => { state.props[s.dataset.k] = s.value; renderPreview(); });
  panel.querySelectorAll('input[type=range]').forEach((r) => r.oninput = () => { state.props[r.dataset.k] = +r.value; panel.querySelector(`[data-out="${r.dataset.k}"]`).textContent = r.value; renderPreview(); });
  panel.querySelectorAll('input.field, textarea.field').forEach((i) => i.oninput = () => { state.props[i.dataset.k] = i.value; renderPreview(); });
}
$('#reset-props').onclick = () => { state.props = defaultsFor(state.id); renderProps(); renderPreview(); toast('Props reset', 'rotate-ccw'); };

// ---------- Preview & code ----------
function renderPreview() {
  const c = components[state.id];
  $('#render').innerHTML = c.render(state.props);
  refreshIcons();
  renderCode();
}
function codeFor(tab) {
  if (tab === 'usage') return usageCode(state.id, state.props);
  if (tab === 'source') return sourceCode(state.id);
  return `<span class="tok-c"># Scaffold this component into your project</span>
<span class="tok-t">$</span> inkbuddy generate --type=<span class="tok-s">${state.id}</span>${state.props.variant ? ` --variant=<span class="tok-s">${state.props.variant}</span>` : ''}

<span class="tok-c"># Output</span>
<span class="tok-s">✓</span> src/components/${state.id}/${components[state.id].name.replace(/\s/g, '')}.tsx
<span class="tok-s">✓</span> src/components/${state.id}/index.ts

<span class="tok-c"># Install the underlying primitive</span>
<span class="tok-t">$</span> npm i <span class="tok-s">${components[state.id].pkg}</span>`;
}
function renderCode() { $('#code').innerHTML = codeFor(state.codeTab); }
$('#code-tabs').querySelectorAll('button').forEach((b) => b.onclick = () => {
  state.codeTab = b.dataset.t;
  $('#code-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  renderCode();
  setCollapsed(false);
});
$('#copy-code').onclick = () => copy(stripTags(codeFor(state.codeTab)));
let collapsed = false;
function setCollapsed(v) {
  collapsed = v;
  $('#code').classList.toggle('hidden', v);
  $('#collapse-code').innerHTML = `<i data-lucide="${v ? 'chevron-up' : 'chevron-down'}"></i>`; refreshIcons();
}
$('#collapse-code').onclick = () => setCollapsed(!collapsed);

// Canvas controls
$('#viewport').querySelectorAll('button').forEach((b) => b.onclick = () => {
  $('#viewport').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  $('#frame').style.width = b.dataset.w;
});
$('#bg-toggle').onclick = () => {
  const light = !$('#canvas').classList.contains('light');
  $('#canvas').classList.toggle('light', light);
  $('#canvas').classList.toggle('dot-grid', !light);
  $('#canvas').classList.toggle('dot-grid-light', light);
  state.theme.mode = light ? 'light' : 'dark';
  applyTheme($('#render'), state.theme);
  $('#bg-toggle').innerHTML = `<i data-lucide="${light ? 'moon' : 'sun'}"></i>`; refreshIcons();
  renderTheme();
};

// ---------- Theme panel ----------
const ACCENTS = ['#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#2dd4bf', '#f4f4f5'];

function syncCanvasMode() {
  const light = state.theme.mode === 'light';
  $('#canvas').classList.toggle('light', light);
  $('#canvas').classList.toggle('dot-grid', !light);
  $('#canvas').classList.toggle('dot-grid-light', light);
  $('#bg-toggle').innerHTML = `<i data-lucide="${light ? 'moon' : 'sun'}"></i>`;
}

function renderTheme() {
  const t = state.theme;
  const signedIn = !!state.user;
  $('#panel-theme').innerHTML = `
    <div class="space-y-2"><div class="label-xs">Name</div><input class="field" id="th-name" value="${esc(t.name)}"></div>
    <div class="space-y-2.5"><div class="label-xs">Accent</div>
      <div class="flex flex-wrap gap-2">${ACCENTS.map((a) => `<button class="swatch ${a === t.accent.toLowerCase() ? 'on' : ''}" style="background:${a}" data-a="${a}" aria-label="${a}"></button>`).join('')}
        <label class="swatch border border-dashed border-[#3f3f46] flex items-center justify-center relative ${ACCENTS.includes(t.accent.toLowerCase()) ? '' : 'on'}" title="Custom">
          <i data-lucide="pipette" class="w-3.5 h-3.5 text-[#a1a1aa]"></i><input type="color" id="th-custom" value="${t.accent}" class="absolute inset-0 opacity-0 cursor-pointer"></label>
      </div></div>
    <div class="space-y-2"><div class="flex justify-between"><span class="label-xs">Radius</span><span class="mono text-[12px] text-[#a1a1aa]" id="th-r-out">${t.radius}px</span></div>
      <input type="range" min="0" max="20" value="${t.radius}" id="th-radius" class="w-full accent-[#4ade80]"></div>
    <div class="space-y-2"><div class="label-xs">Font</div><div class="seg">${FONT_OPTIONS.map((f) => `<button data-f="${f}" class="${f === t.font ? 'on' : ''}">${f}</button>`).join('')}</div></div>
    <div class="space-y-2"><div class="label-xs">Mode</div><div class="seg"><button data-m="dark" class="${t.mode === 'dark' ? 'on' : ''}">Dark</button><button data-m="light" class="${t.mode === 'light' ? 'on' : ''}">Light</button></div></div>

    <div class="grid grid-cols-2 gap-2">
      <button class="btn btn-ghost h-9 text-[12px]" id="th-export"><i data-lucide="file-json"></i>tokens.json</button>
      <button class="btn btn-ghost h-9 text-[12px]" id="th-reset"><i data-lucide="rotate-ccw"></i>Reset</button>
    </div>

    <div class="pt-5 border-t border-[#1c1c20] space-y-3">
      <div class="flex items-center justify-between"><span class="label-xs">Saved themes</span>${signedIn ? `<span class="text-[11px] text-[#63636b] flex items-center gap-1"><i data-lucide="cloud" class="w-3 h-3"></i>Synced</span>` : ''}</div>
      ${signedIn ? `
        <button class="btn btn-accent w-full h-9 text-[13px]" id="th-save"><i data-lucide="save"></i>${state.activeThemeId ? 'Update theme' : 'Save theme'}</button>
        ${state.activeThemeId ? '<button class="btn btn-ghost w-full h-9 text-[12px]" id="th-saveas"><i data-lucide="copy-plus"></i>Save as new</button>' : ''}
        <div class="space-y-1.5" id="th-list">${state.themes.length ? state.themes.map((x) => `
          <div class="theme-row ${x.id === state.activeThemeId ? 'on' : ''}" data-id="${x.id}">
            <span class="w-5 h-5 shrink-0" style="background:${x.accent};border-radius:${Math.min(x.radius, 10)}px"></span>
            <span class="text-[13px] flex-1 truncate">${esc(x.name)}</span>
            <span class="mono text-[10px] text-[#63636b]">${x.mode}</span>
            <button class="icon-btn w-6 h-6" data-del="${x.id}" title="Delete"><i data-lucide="trash-2" class="!w-3.5 !h-3.5"></i></button>
          </div>`).join('') : '<div class="text-[12px] text-[#63636b] py-2">No saved themes yet.</div>'}</div>`
      : `<div class="rounded-lg border border-[#1c1c20] p-4 text-center">
          <i data-lucide="cloud" class="w-5 h-5 text-[#63636b] mx-auto mb-2"></i>
          <p class="text-[12px] text-[#a1a1aa] mb-3">Sign in to save themes to your account and reuse them anywhere.</p>
          <button class="btn btn-light w-full h-8 text-[12px]" id="th-signin">Sign in to save</button></div>`}
    </div>`;
  refreshIcons();
  const P = $('#panel-theme');
  const update = () => { applyTheme($('#render'), state.theme); syncCanvasMode(); refreshIcons(); };
  P.querySelector('#th-name').oninput = (e) => { t.name = e.target.value; };
  P.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { t.accent = b.dataset.a; update(); renderTheme(); });
  P.querySelector('#th-custom').oninput = (e) => { t.accent = e.target.value; update(); };
  P.querySelector('#th-custom').onchange = () => renderTheme();
  P.querySelector('#th-radius').oninput = (e) => { t.radius = +e.target.value; P.querySelector('#th-r-out').textContent = t.radius + 'px'; update(); };
  P.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { t.font = b.dataset.f; update(); renderTheme(); });
  P.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { t.mode = b.dataset.m; update(); renderTheme(); });
  P.querySelector('#th-export').onclick = () => {
    const blob = new Blob([JSON.stringify(themeToTokens(t), null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tokens.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('tokens.json downloaded', 'download');
  };
  P.querySelector('#th-reset').onclick = () => { state.theme = { ...DEFAULT_THEME }; state.activeThemeId = null; update(); renderTheme(); };
  P.querySelector('#th-signin')?.addEventListener('click', signIn);
  P.querySelector('#th-save')?.addEventListener('click', () => saveTheme(false));
  P.querySelector('#th-saveas')?.addEventListener('click', () => saveTheme(true));
  P.querySelectorAll('.theme-row').forEach((r) => r.onclick = (e) => {
    if (e.target.closest('[data-del]')) return;
    const x = state.themes.find((y) => y.id === r.dataset.id);
    state.theme = { name: x.name, accent: x.accent, radius: x.radius, font: x.font, mode: x.mode };
    state.activeThemeId = x.id; update(); renderTheme(); toast(`Applied "${x.name}"`, 'palette');
  });
  P.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => deleteTheme(b.dataset.del));
}

$('#insp-tabs').querySelectorAll('button').forEach((b) => b.onclick = () => {
  $('#insp-tabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  $('#panel-props').classList.toggle('hidden', b.dataset.t !== 'props');
  $('#panel-theme').classList.toggle('hidden', b.dataset.t !== 'theme');
});

// ---------- Puter: auth + cloud themes ----------
const KV_KEY = 'inkbuddy_themes';

function renderAuth() {
  const a = $('#auth-area');
  if (state.user) {
    const n = state.user.username || 'You';
    a.innerHTML = `<div class="relative" id="acct">
      <button class="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-[#141418] transition-colors" id="acct-btn">
        <span class="w-6 h-6 rounded-full bg-[#4ade80]/15 text-[#4ade80] text-[11px] font-semibold flex items-center justify-center">${esc(n[0].toUpperCase())}</span>
        <span class="text-[12px] hidden sm:inline max-w-[120px] truncate">${esc(n)}</span><i data-lucide="chevron-down" class="w-3.5 h-3.5 text-[#63636b]"></i>
      </button>
      <div class="hidden absolute right-0 top-10 w-48 rounded-lg border border-[#26262b] bg-[#0f0f12] p-1 z-50" id="acct-menu">
        <div class="px-2.5 py-2 text-[12px] text-[#63636b] border-b border-[#1c1c20] mb-1">Signed in as <span class="text-white">${esc(n)}</span></div>
        <button class="side-item" id="signout"><i data-lucide="log-out"></i>Sign out</button>
      </div></div>`;
    $('#acct-btn').onclick = (e) => { e.stopPropagation(); $('#acct-menu').classList.toggle('hidden'); };
    document.addEventListener('click', () => $('#acct-menu')?.classList.add('hidden'));
    $('#signout').onclick = () => { puter.auth.signOut(); state.user = null; state.themes = []; state.activeThemeId = null; renderAuth(); renderTheme(); toast('Signed out', 'log-out'); };
  } else {
    a.innerHTML = `<button class="btn btn-ghost h-8 text-[12px]" id="signin-top"><i data-lucide="log-in"></i>Sign in</button>`;
    $('#signin-top').onclick = signIn;
  }
  refreshIcons();
}

async function signIn() {
  try {
    await puter.auth.signIn();
    await loadUser();
    toast('Signed in — themes will sync', 'cloud');
  } catch { toast('Sign-in cancelled', 'x'); }
}

async function loadUser() {
  try {
    if (!puter.auth.isSignedIn()) { state.user = null; renderAuth(); renderTheme(); return; }
    state.user = await puter.auth.getUser();
    renderAuth();
    const saved = await puter.kv.get(KV_KEY);
    state.themes = Array.isArray(saved) ? saved : (typeof saved === 'string' ? JSON.parse(saved) : []);
  } catch (e) { state.themes = []; }
  renderTheme();
}

async function persist() { await puter.kv.set(KV_KEY, state.themes); }

async function saveTheme(asNew) {
  const t = state.theme;
  if (!t.name.trim()) t.name = 'Untitled theme';
  try {
    if (state.activeThemeId && !asNew) {
      const i = state.themes.findIndex((x) => x.id === state.activeThemeId);
      if (i > -1) state.themes[i] = { ...state.themes[i], ...t, updated: Date.now() };
    } else {
      const id = Math.random().toString(36).slice(2, 10);
      state.themes.unshift({ id, ...t, name: asNew ? t.name + ' copy' : t.name, updated: Date.now() });
      state.activeThemeId = id;
      if (asNew) t.name += ' copy';
    }
    await persist(); renderTheme(); toast('Theme saved', 'cloud');
  } catch { toast('Could not save theme', 'x'); }
}

async function deleteTheme(id) {
  state.themes = state.themes.filter((x) => x.id !== id);
  if (state.activeThemeId === id) state.activeThemeId = null;
  try { await persist(); toast('Theme deleted', 'trash-2'); } catch { toast('Could not delete', 'x'); }
  renderTheme();
}

// ---------- Mobile drawers ----------
function closeDrawers() { $('#sidebar').classList.remove('open'); $('#inspector').classList.remove('open'); $('#scrim').classList.add('hidden'); }
$('#toggle-side').onclick = () => { const o = !$('#sidebar').classList.contains('open'); closeDrawers(); if (o) { $('#sidebar').classList.add('open'); $('#scrim').classList.remove('hidden'); } };
$('#toggle-insp').onclick = () => { const o = !$('#inspector').classList.contains('open'); closeDrawers(); if (o) { $('#inspector').classList.add('open'); $('#scrim').classList.remove('hidden'); } };
$('#scrim').onclick = closeDrawers;

// ---------- Init ----------
bindInteractive($('#render'));
applyTheme($('#render'), state.theme);
window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id !== state.id && components[id]) select(id); });
select(location.hash.slice(1) || 'button');
renderAuth();
renderTheme();
refreshIcons();
loadUser();
