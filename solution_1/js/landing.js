import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';
import { components, categories, defaultsFor, esc } from './components.js';

const $ = (s) => document.querySelector(s);
const refreshIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.75 } });

// ---------- Toast & copy ----------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.querySelector('span').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copy(text, msg = 'Copied to clipboard') {
  try { await navigator.clipboard.writeText(text); } catch { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); }
  toast(msg);
}
$('#copy-install').onclick = () => copy('npm i -g inkbuddy-cli');
$('#copy-mcp').onclick = () => copy($('#mcp-code').textContent);

// ---------- Interactive terminal ----------
const term = $('#term');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let busy = false, runId = 0;
const history = []; let hIdx = 0;

function line(html, cls = '') { const d = document.createElement('div'); d.className = 'term-line ' + cls; d.innerHTML = html; term.insertBefore(d, inputRow); term.scrollTop = term.scrollHeight; return d; }

const inputRow = document.createElement('div');
inputRow.className = 'term-line flex';
inputRow.innerHTML = '<span class="text-[#4ade80] mr-2">❯</span><span id="term-input" class="outline-none flex-1 text-white" contenteditable="true" spellcheck="false"></span>';
term.appendChild(inputRow);
const input = inputRow.querySelector('#term-input');
term.addEventListener('click', () => { if (!busy) input.focus(); });

const ok = (t) => `<span class="text-[#4ade80]">✓</span> <span class="text-[#d4d4d8]">${t}</span>`;
const dim = (t) => `<span class="text-[#63636b]">${t}</span>`;

const commands = {
  help: async () => {
    line(dim('Usage: inkbuddy &lt;command&gt; [options]'));
    [['setup', 'Inject design tokens & global styles'], ['list', 'List available templates'], ['generate --type=&lt;name&gt;', 'Scaffold a component'], ['tokens', 'Print current design tokens'], ['mcp', 'Start the MCP server'], ['clear', 'Clear the terminal']]
      .forEach(([c, d]) => line(`  <span class="text-white">${c.padEnd(24).replace(/ /g, '&nbsp;')}</span>${dim(d)}`));
  },
  setup: async (id) => {
    line(dim('Reading tokens.json…')); await sleep(350); if (id !== runId) return;
    line(ok('Parsed 24 tokens <span class="text-[#63636b]">(colors, spacing, radius, type)</span>')); await sleep(250);
    line(ok('Wrote <span class="text-white">src/styles/tokens.css</span>')); await sleep(200);
    line(ok('Configured <span class="text-white">tailwind.config.ts</span>'));
  },
  list: async () => {
    const byCat = {};
    Object.entries(components).forEach(([k, c]) => (byCat[c.category] ||= []).push(k));
    Object.entries(byCat).forEach(([cat, ks]) => line(`<span class="text-[#63636b]">${cat.padEnd(9).replace(/ /g, '&nbsp;')}</span> <span class="text-[#d4d4d8]">${ks.join(', ')}</span>`));
  },
  tokens: async () => {
    line(`<span class="text-[#c084fc]">brand.primary</span>   <span class="inline-block w-2.5 h-2.5 rounded-sm bg-[#4ade80] align-middle"></span> #4ade80`);
    line(`<span class="text-[#c084fc]">bg.main</span>         <span class="inline-block w-2.5 h-2.5 rounded-sm bg-[#050505] border border-[#333] align-middle"></span> #050505`);
    line(`<span class="text-[#c084fc]">radius.md</span>       8px`);
    line(`<span class="text-[#c084fc]">font.sans</span>       Inter`);
  },
  mcp: async (id) => {
    line(dim('Starting MCP server on stdio…')); await sleep(400); if (id !== runId) return;
    line(ok('Registered tools: list_templates, generate_component, setup_design_system'));
    line(`<span class="text-[#fbbf24]">●</span> ${dim('Waiting for agent connection')}`);
  },
  generate: async (id, args) => {
    const m = args.match(/--type[= ](\S+)/);
    const type = m?.[1];
    if (!type || !components[type]) { line(`<span class="text-[#f87171]">✗ Unknown or missing --type.</span> ${dim('Try: inkbuddy generate --type=button')}`); return; }
    const name = components[type].name.replace(/\s/g, '');
    line(dim(`Scaffolding ${name} from template "${type}"…`)); await sleep(380); if (id !== runId) return;
    line(ok(`<span class="text-white">src/components/${type}/${name}.tsx</span>`)); await sleep(140);
    line(ok(`<span class="text-white">src/components/${type}/${name}.test.tsx</span>`)); await sleep(140);
    line(ok(`<span class="text-white">src/components/${type}/index.ts</span>`));
    line(dim(`Done in ${18 + Math.floor(Math.random() * 20)}ms · a11y checks passed`));
  },
};

async function run(raw, typed = false) {
  const id = ++runId;
  const cmd = raw.trim();
  if (!cmd) return;
  busy = true; input.contentEditable = 'false';
  if (typed) {
    input.textContent = '';
    for (const ch of cmd) { if (id !== runId) return; input.textContent += ch; await sleep(28 + Math.random() * 30); }
    await sleep(200);
  }
  input.textContent = '';
  line(`<span class="text-[#4ade80] mr-2">❯</span><span class="text-white">${esc(cmd)}</span>`);
  history.push(cmd); hIdx = history.length;
  const parts = cmd.replace(/^inkbuddy\s*/, '').split(/\s+/);
  const name = parts[0] || 'help';
  if (cmd === 'clear') { [...term.querySelectorAll('.term-line')].forEach((n) => n !== inputRow && n.remove()); }
  else if (!cmd.startsWith('inkbuddy') && cmd !== 'help') line(`<span class="text-[#f87171]">zsh: command not found: ${esc(cmd.split(' ')[0])}</span> ${dim("— try 'inkbuddy help'")}`);
  else if (commands[name]) await commands[name](id, parts.slice(1).join(' '));
  else line(`<span class="text-[#f87171]">✗ Unknown command "${esc(name)}".</span> ${dim("Run 'inkbuddy help'.")}`);
  if (id !== runId) return;
  line('&nbsp;');
  busy = false; input.contentEditable = 'true';
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); if (!busy) run(input.textContent); }
  else if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); input.textContent = history[hIdx]; }
  else if (e.key === 'ArrowDown' && history.length) { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); input.textContent = history[hIdx] || ''; }
});

const chips = ['inkbuddy help', 'inkbuddy list', 'inkbuddy generate --type=dialog', 'inkbuddy tokens', 'inkbuddy mcp'];
$('#term-chips').innerHTML = chips.map((c) => `<button class="mono text-[11px] px-2 py-1 rounded-md border border-[#222227] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors">${c.replace('inkbuddy ', '')}</button>`).join('');
$('#term-chips').querySelectorAll('button').forEach((b, i) => b.onclick = () => run(chips[i], true));

async function demo() {
  const id = ++runId; busy = false;
  [...term.querySelectorAll('.term-line')].forEach((n) => n !== inputRow && n.remove());
  line(dim('InkBuddy CLI v2.0.0 — type a command or pick one below.'));
  line('&nbsp;');
  await sleep(500); if (id !== runId) return;
  await run('inkbuddy setup', true);
  const after = runId;
  await sleep(300); if (runId !== id + 1 || after !== runId || busy) return;
  await run('inkbuddy generate --type=button', true);
}
$('#term-replay').onclick = demo;

// ---------- Component grid ----------
let activeCat = 'All';
function renderFilter() {
  $('#cat-filter').innerHTML = ['All', ...categories].map((c) => `<button data-c="${c}" class="text-[12px] px-3 h-7 rounded-md transition-colors whitespace-nowrap ${c === activeCat ? 'bg-[#1c1c20] text-white' : 'text-[#a1a1aa] hover:text-white'}">${c}</button>`).join('');
  $('#cat-filter').querySelectorAll('button').forEach((b) => b.onclick = () => { activeCat = b.dataset.c; renderFilter(); renderGrid(); });
}
function renderGrid() {
  const list = Object.entries(components).filter(([, c]) => activeCat === 'All' || c.category === activeCat);
  $('#comp-grid').innerHTML = list.map(([id, c]) => `
    <a href="studio.html#${id}" class="comp-card group rounded-xl border border-[#1c1c20] overflow-hidden flex flex-col">
      <div class="comp-stage dot-grid h-44 flex items-center justify-center border-b border-[#1c1c20] overflow-hidden px-4"><div class="ib-root">${c.render(defaultsFor(id))}</div></div>
      <div class="p-4 flex-1">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 text-[14px] font-medium"><i data-lucide="${c.icon}" class="w-4 h-4 text-[#a1a1aa]"></i>${c.name}</div>
          <i data-lucide="arrow-up-right" class="w-4 h-4 text-[#3f3f46] group-hover:text-white transition-colors"></i>
        </div>
        <p class="text-[13px] text-[#63636b] leading-relaxed">${c.desc}</p>
      </div>
    </a>`).join('');
  refreshIcons();
}

// ---------- Steps ----------
const steps = [
  { n: '01', icon: 'download', title: 'Install', text: 'Add the CLI globally or run it with npx.', cmd: 'npm i -g inkbuddy-cli' },
  { n: '02', icon: 'palette', title: 'Set up tokens', text: 'Point it at your tokens.json and inject styles.', cmd: 'inkbuddy setup' },
  { n: '03', icon: 'boxes', title: 'Generate', text: 'Scaffold typed, accessible components on demand.', cmd: 'inkbuddy generate --type=button' },
];
$('#steps').innerHTML = steps.map((s) => `
  <div class="rounded-xl border border-[#1c1c20] p-6 flex flex-col">
    <div class="flex items-center justify-between mb-8"><span class="w-9 h-9 rounded-lg border border-[#26262b] flex items-center justify-center"><i data-lucide="${s.icon}" class="w-4 h-4"></i></span><span class="mono text-[12px] text-[#3f3f46]">${s.n}</span></div>
    <h3 class="font-medium mb-1.5">${s.title}</h3>
    <p class="text-[13px] text-[#63636b] mb-6 flex-1">${s.text}</p>
    <button data-cmd="${s.cmd}" class="group flex items-center justify-between gap-3 h-9 px-3 rounded-lg bg-[#0f0f12] border border-[#1c1c20] mono text-[12px] text-left hover:border-[#3f3f46] transition-colors">
      <span class="truncate"><span class="text-[#63636b]">$</span> ${s.cmd}</span><i data-lucide="copy" class="w-3.5 h-3.5 text-[#63636b] group-hover:text-white shrink-0"></i>
    </button>
  </div>`).join('');
$('#steps').querySelectorAll('[data-cmd]').forEach((b) => b.onclick = () => copy(b.dataset.cmd));

// ---------- Flow canvas ----------
const nodes = [
  { id: 'tokens', x: 40, y: 190, icon: 'pen-tool', label: 'Source of truth', title: 'Design tokens', desc: 'Colors, spacing, radius and typography exported from Figma as JSON.', meta: ['tokens.json', '24 tokens'] },
  { id: 'cli', x: 320, y: 190, icon: 'terminal', label: 'Orchestration', title: 'InkBuddy CLI', desc: 'The engine that parses tokens and renders component templates.', meta: ['Node 18+', '< 40ms'] },
  { id: 'mcp', x: 600, y: 60, icon: 'bot', label: 'AI integration', title: 'MCP server', desc: 'Exposes CLI capabilities as tools for AI agents like Claude and Cursor.', meta: ['stdio', '3 tools'] },
  { id: 'react', x: 600, y: 320, icon: 'atom', label: 'Implementation', title: 'React components', desc: 'Typed, accessible primitives built on Radix UI and bound to your tokens.', meta: ['TSX', 'Radix UI'] },
  { id: 'ship', x: 880, y: 190, icon: 'rocket', label: 'Delivery', title: 'Production', desc: 'Ship-ready code with tests and accessibility documentation included.', meta: ['Jest', 'WCAG AA'] },
];
const edges = [['tokens', 'cli'], ['cli', 'mcp'], ['cli', 'react'], ['mcp', 'ship'], ['react', 'ship'], ['mcp', 'react']];

const flow = $('#flow'), layer = $('#flow-layer'), svg = $('#flow-svg');
const view = { x: 0, y: 0, k: 1 };
const els = {};
let selected = 'cli';

nodes.forEach((n) => {
  const el = document.createElement('div');
  el.className = 'node';
  el.innerHTML = `<span class="handle l"></span><span class="handle r"></span>
    <div class="flex items-center gap-2 mb-2"><span class="w-6 h-6 rounded-md bg-[#1c1c20] flex items-center justify-center"><i data-lucide="${n.icon}" class="w-3.5 h-3.5"></i></span><span class="label-xs">${n.label}</span></div>
    <div class="text-[14px] font-medium">${n.title}</div>`;
  layer.appendChild(el);
  els[n.id] = el;
  let start = null, moved = false;
  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); el.setPointerCapture(e.pointerId);
    start = { px: e.clientX, py: e.clientY, x: n.x, y: n.y }; moved = false; el.classList.add('drag');
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = (e.clientX - start.px) / view.k, dy = (e.clientY - start.py) / view.k;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    n.x = start.x + dx; n.y = start.y + dy; place(n); drawEdges();
  });
  el.addEventListener('pointerup', () => { start = null; el.classList.remove('drag'); if (!moved) select(n.id); });
});

function place(n) { els[n.id].style.left = n.x + 'px'; els[n.id].style.top = n.y + 'px'; }
function drawEdges() {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  svg.innerHTML = edges.map(([a, b]) => {
    const A = byId[a], B = byId[b], ea = els[a], eb = els[b];
    let x1 = A.x + ea.offsetWidth, y1 = A.y + ea.offsetHeight / 2, x2 = B.x, y2 = B.y + eb.offsetHeight / 2;
    if (a === 'mcp' && b === 'react') { x1 = A.x + ea.offsetWidth / 2; y1 = A.y + ea.offsetHeight; x2 = B.x + eb.offsetWidth / 2; y2 = B.y; return `<path class="edge" d="M${x1} ${y1} L${x2} ${y2}" stroke-dasharray="3 4"/>`; }
    const c = Math.max(40, Math.abs(x2 - x1) / 2);
    const d = `M${x1} ${y1} C${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`;
    const active = a === selected || b === selected;
    return `<path class="edge" d="${d}" ${active ? 'style="stroke:#3f3f46"' : ''}/>${active ? `<path class="edge-flow" d="${d}"/>` : ''}`;
  }).join('');
}
function applyView() {
  layer.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
  $('#zoom-label').textContent = Math.round(view.k * 100) + '%';
}
function fit() {
  const w = flow.clientWidth, h = flow.clientHeight;
  const k = Math.min(1, (w - 40) / 1110, (h - 40) / 420);
  view.k = k; view.x = (w - 1090 * k) / 2; view.y = (h - 400 * k) / 2 - 10 * k;
  applyView();
}
function zoom(f, cx = flow.clientWidth / 2, cy = flow.clientHeight / 2) {
  const k = Math.min(2, Math.max(0.4, view.k * f));
  view.x = cx - (cx - view.x) * (k / view.k); view.y = cy - (cy - view.y) * (k / view.k); view.k = k; applyView();
}
function select(id) {
  selected = id;
  Object.entries(els).forEach(([k, el]) => el.classList.toggle('sel', k === id));
  const n = nodes.find((x) => x.id === id);
  const inbound = edges.filter(([, b]) => b === id).map(([a]) => nodes.find((x) => x.id === a).title);
  const outbound = edges.filter(([a]) => a === id).map(([, b]) => nodes.find((x) => x.id === b).title);
  $('#node-info').innerHTML = `
    <span class="w-10 h-10 rounded-lg bg-[#4ade80]/10 text-[#4ade80] flex items-center justify-center mb-4"><i data-lucide="${n.icon}" class="w-5 h-5"></i></span>
    <div class="label-xs mb-1">${n.label}</div>
    <h3 class="text-lg font-semibold mb-2">${n.title}</h3>
    <p class="text-[13px] text-[#a1a1aa] leading-relaxed mb-5">${n.desc}</p>
    <div class="flex flex-wrap gap-1.5 mb-6">${n.meta.map((m) => `<span class="mono text-[11px] px-2 py-0.5 rounded border border-[#26262b] text-[#a1a1aa]">${m}</span>`).join('')}</div>
    <div class="space-y-3 text-[13px]">
      <div><div class="label-xs mb-1.5">Inputs</div><div class="text-[#d4d4d8]">${inbound.join(', ') || '<span class="text-[#63636b]">—</span>'}</div></div>
      <div><div class="label-xs mb-1.5">Outputs</div><div class="text-[#d4d4d8]">${outbound.join(', ') || '<span class="text-[#63636b]">—</span>'}</div></div>
    </div>`;
  refreshIcons();
  drawEdges();
}

let pan = null;
flow.addEventListener('pointerdown', (e) => { pan = { px: e.clientX, py: e.clientY, x: view.x, y: view.y }; flow.classList.add('panning'); flow.setPointerCapture(e.pointerId); });
flow.addEventListener('pointermove', (e) => { if (!pan) return; view.x = pan.x + e.clientX - pan.px; view.y = pan.y + e.clientY - pan.py; applyView(); });
flow.addEventListener('pointerup', () => { pan = null; flow.classList.remove('panning'); });
flow.addEventListener('wheel', (e) => { e.preventDefault(); const r = flow.getBoundingClientRect(); zoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
$('#z-in').onclick = () => zoom(1.2);
$('#z-out').onclick = () => zoom(1 / 1.2);
$('#z-fit').onclick = fit;
window.addEventListener('resize', fit);

// ---------- Init ----------
nodes.forEach(place);
renderFilter();
renderGrid();
refreshIcons();
select('cli');
fit();
demo();
