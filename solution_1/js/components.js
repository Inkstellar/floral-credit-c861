// InkBuddy component registry — shared by the landing page and the Studio.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => String(n || '?').trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const sel = (options, def, label) => ({ type: 'select', options, default: def, label });
const txt = (def, label) => ({ type: 'text', default: def, label });
const bool = (def, label) => ({ type: 'boolean', default: def, label });
const num = (def, min, max, step = 1, label) => ({ type: 'number', default: def, min, max, step, label });

const alertIcon = { success: 'circle-check', danger: 'circle-x', warning: 'triangle-alert', info: 'info' };

export const categories = ['Actions', 'Forms', 'Display', 'Layout', 'Overlay', 'Feedback'];

export const components = {
  button: {
    name: 'Button', icon: 'mouse-pointer-click', category: 'Actions', pkg: '@radix-ui/react-slot',
    desc: 'Action triggers with five variants, three sizes, icon and loading states.',
    props: {
      variant: sel(['primary', 'secondary', 'outline', 'ghost', 'danger'], 'primary'),
      size: sel(['sm', 'md', 'lg'], 'md'),
      label: txt('Deploy changes'),
      icon: sel(['none', 'rocket', 'arrow-right', 'download', 'plus'], 'rocket'),
      loading: bool(false), disabled: bool(false), fullWidth: bool(false, 'full width'),
    },
    render: (p) => {
      const ic = p.loading ? '<span class="ib-spin"></span>' : p.icon !== 'none' ? `<i data-lucide="${p.icon}"></i>` : '';
      return `<button class="ib-btn ib-btn-${p.variant} ib-btn-${p.size} ${p.fullWidth ? 'ib-btn-full' : ''}" ${p.disabled || p.loading ? 'disabled' : ''} style="${p.fullWidth ? 'width:320px' : ''}">${ic}${esc(p.label)}</button>`;
    },
  },
  input: {
    name: 'Input', icon: 'text-cursor-input', category: 'Forms', pkg: '@radix-ui/react-label',
    desc: 'Labelled text fields with hints, validation state and focus rings.',
    props: {
      label: txt('Email address'), placeholder: txt('you@company.com'),
      type: sel(['text', 'email', 'password'], 'email'),
      hint: txt("We'll never share your email."),
      error: bool(false, 'error state'), disabled: bool(false),
    },
    render: (p) => `<div class="ib-field-wrap">
      ${p.label ? `<label class="ib-label">${esc(p.label)}</label>` : ''}
      <input class="ib-input ${p.error ? 'err' : ''}" type="${esc(p.type)}" placeholder="${esc(p.placeholder)}" ${p.disabled ? 'disabled' : ''}>
      ${p.error ? '<span class="ib-hint err">Please enter a valid value.</span>' : p.hint ? `<span class="ib-hint">${esc(p.hint)}</span>` : ''}
    </div>`,
  },
  checkbox: {
    name: 'Checkbox', icon: 'square-check', category: 'Forms', pkg: '@radix-ui/react-checkbox',
    desc: 'Accessible binary choice with keyboard support and label binding.',
    props: { label: txt('Accept terms and conditions'), checked: bool(true) },
    render: (p) => `<label class="ib-check-row" data-ib-toggle>
      <span class="ib-check ${p.checked ? 'on' : ''}" data-ib-target role="checkbox" aria-checked="${p.checked}"><i data-lucide="check" style="stroke-width:3"></i></span>${esc(p.label)}</label>`,
  },
  switch: {
    name: 'Switch', icon: 'toggle-right', category: 'Forms', pkg: '@radix-ui/react-switch',
    desc: 'Toggle between on and off states instantly.',
    props: { label: txt('Enable notifications'), checked: bool(true), size: sel(['sm', 'md'], 'md') },
    render: (p) => `<label class="ib-check-row" data-ib-toggle>
      <span class="ib-switch ${p.size === 'sm' ? 'sm' : ''} ${p.checked ? 'on' : ''}" data-ib-target role="switch"></span>${esc(p.label)}</label>`,
  },
  slider: {
    name: 'Slider', icon: 'sliders-horizontal', category: 'Forms', pkg: '@radix-ui/react-slider',
    desc: 'Select a value from a continuous range.',
    props: { label: txt('Volume'), value: num(60, 0, 100), showValue: bool(true, 'show value') },
    render: (p) => `<div class="ib-slider">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px"><span class="ib-label">${esc(p.label)}</span>${p.showValue ? `<span class="ib-hint mono" data-ib-out>${p.value}</span>` : ''}</div>
      <input type="range" min="0" max="100" value="${p.value}" data-ib-range></div>`,
  },
  badge: {
    name: 'Badge', icon: 'tag', category: 'Display', pkg: '@inkbuddy/primitives',
    desc: 'Compact status indicators for semantic labelling.',
    props: { text: txt('Operational'), variant: sel(['success', 'warning', 'danger', 'info', 'neutral'], 'success'), size: sel(['sm', 'md'], 'md'), dot: bool(true) },
    render: (p) => `<span class="ib-badge ib-badge-${p.variant} ib-badge-${p.size}">${p.dot ? '<span class="dot"></span>' : ''}${esc(p.text)}</span>`,
  },
  avatar: {
    name: 'Avatar', icon: 'circle-user', category: 'Display', pkg: '@radix-ui/react-avatar',
    desc: 'User representation with initials fallback, status and grouping.',
    props: { name: txt('Ada Lovelace'), size: num(48, 28, 80, 4), shape: sel(['circle', 'square'], 'circle'), status: bool(true, 'online status'), group: bool(false, 'show group') },
    render: (p) => {
      const one = (n) => `<span class="ib-avatar ${p.shape === 'square' ? 'square' : ''}" style="width:${p.size}px;height:${p.size}px;font-size:${Math.round(p.size * 0.36)}px">${initials(n)}${p.status && !p.group ? '<span class="status"></span>' : ''}</span>`;
      return p.group ? `<div class="ib-avatar-group">${[p.name, 'Grace Hopper', 'Alan Turing', 'Linus T'].map(one).join('')}</div>` : one(p.name);
    },
  },
  card: {
    name: 'Card', icon: 'square-dashed', category: 'Layout', pkg: '@inkbuddy/primitives',
    desc: 'Surface container for modular content with optional media and actions.',
    props: { title: txt('Token pipeline'), body: txt('Sync your Figma variables and ship typed React components in a single command.'), media: bool(true), actions: bool(true) },
    render: (p) => `<div class="ib-card">
      ${p.media ? '<div class="ib-card-media"><i data-lucide="layers"></i></div>' : ''}
      <div class="ib-card-body"><div class="ib-card-title">${esc(p.title)}</div><div class="ib-card-text">${esc(p.body)}</div></div>
      ${p.actions ? '<div class="ib-card-foot"><button class="ib-btn ib-btn-primary ib-btn-sm">Open</button><button class="ib-btn ib-btn-ghost ib-btn-sm">Dismiss</button></div>' : ''}
    </div>`,
  },
  tabs: {
    name: 'Tabs', icon: 'panels-top-left', category: 'Layout', pkg: '@radix-ui/react-tabs',
    desc: 'Organise related content into switchable panels.',
    props: { style: sel(['underline', 'pill'], 'underline'), active: sel(['Account', 'Security', 'Billing'], 'Account', 'default tab') },
    render: (p) => {
      const panels = { Account: 'Manage your profile, display name and connected accounts.', Security: 'Update your password and enable two-factor authentication.', Billing: 'Review invoices and update your payment method.' };
      return `<div class="ib-tabs" data-ib-tabs><div class="ib-tabs-list ${p.style === 'pill' ? 'pill' : ''}" role="tablist">
        ${Object.keys(panels).map((t) => `<button class="ib-tab ${t === p.active ? 'on' : ''}" data-ib-tab="${t}" data-text="${esc(panels[t])}">${t}</button>`).join('')}
      </div><div class="ib-tab-panel" data-ib-panel>${panels[p.active]}</div></div>`;
    },
  },
  accordion: {
    name: 'Accordion', icon: 'list-collapse', category: 'Layout', pkg: '@radix-ui/react-accordion',
    desc: 'Vertically stacked, collapsible sections.',
    props: { items: num(3, 1, 4, 1), openFirst: bool(true, 'first open'), multiple: bool(false, 'allow multiple') },
    render: (p) => {
      const qa = [['What is InkBuddy?', 'A CLI that turns design tokens into accessible, production-ready React components.'], ['Does it support Radix?', 'Yes — every primitive is built on Radix UI for correct ARIA and keyboard behaviour.'], ['Can AI agents use it?', 'InkBuddy ships an MCP server so agents can list templates and generate components.'], ['Is it open source?', 'Yes, it is MIT licensed and contributions are welcome.']];
      return `<div class="ib-accordion" data-ib-acc ${p.multiple ? 'data-multi' : ''}>${qa.slice(0, p.items).map(([q, a], i) => `<div class="ib-acc-item ${i === 0 && p.openFirst ? 'open' : ''}"><button class="ib-acc-trigger">${q}<i data-lucide="chevron-down"></i></button><div class="ib-acc-content">${a}</div></div>`).join('')}</div>`;
    },
  },
  dialog: {
    name: 'Dialog', icon: 'app-window', category: 'Overlay', pkg: '@radix-ui/react-dialog',
    desc: 'Modal dialogs with focus trapping and escape-to-close.',
    props: { title: txt('Delete project?'), body: txt('This permanently removes the project and all generated components. This action cannot be undone.'), size: sel(['sm', 'md', 'lg'], 'md'), destructive: bool(true) },
    render: (p) => `<div class="ib-dialog-backdrop"><div class="ib-dialog ib-dialog-${p.size}" role="dialog">
      <button class="ib-dialog-x"><i data-lucide="x"></i></button>
      <div class="ib-dialog-title">${esc(p.title)}</div><div class="ib-dialog-text">${esc(p.body)}</div>
      <div class="ib-dialog-actions"><button class="ib-btn ib-btn-outline ib-btn-sm">Cancel</button><button class="ib-btn ${p.destructive ? 'ib-btn-danger' : 'ib-btn-primary'} ib-btn-sm">${p.destructive ? 'Delete' : 'Confirm'}</button></div>
    </div></div>`,
  },
  tooltip: {
    name: 'Tooltip', icon: 'message-square', category: 'Overlay', pkg: '@radix-ui/react-tooltip',
    desc: 'Contextual hints that appear on hover or focus.',
    props: { content: txt('Copy to clipboard'), side: sel(['top', 'bottom'], 'top') },
    render: (p) => `<div class="ib-tooltip-wrap"><span class="ib-tooltip ${p.side}">${esc(p.content)}</span><button class="ib-btn ib-btn-outline ib-btn-md"><i data-lucide="copy"></i>Copy</button></div>`,
  },
  alert: {
    name: 'Alert', icon: 'triangle-alert', category: 'Feedback', pkg: '@inkbuddy/primitives',
    desc: 'Inline callouts for important, contextual messages.',
    props: { variant: sel(['success', 'info', 'warning', 'danger'], 'info'), title: txt('New version available'), body: txt('InkBuddy 2.0 adds Vue templates and token theming.') },
    render: (p) => `<div class="ib-alert ib-alert-${p.variant}" role="alert"><i data-lucide="${alertIcon[p.variant]}"></i><div><div class="ib-alert-title">${esc(p.title)}</div><div class="ib-alert-text">${esc(p.body)}</div></div></div>`,
  },
  progress: {
    name: 'Progress', icon: 'loader', category: 'Feedback', pkg: '@radix-ui/react-progress',
    desc: 'Show completion status of a long-running task.',
    props: { value: num(64, 0, 100), label: txt('Generating components'), thin: bool(false), indeterminate: bool(false) },
    render: (p) => `<div class="ib-progress"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span class="ib-label">${esc(p.label)}</span>${p.indeterminate ? '' : `<span class="ib-hint mono">${p.value}%</span>`}</div>
      <div class="ib-progress-track ${p.thin ? 'sm' : ''}"><div class="ib-progress-bar ${p.indeterminate ? 'ind' : ''}" style="width:${p.value}%"></div></div></div>`,
  },
  loader: {
    name: 'Loader', icon: 'loader-circle', category: 'Feedback', pkg: '@inkbuddy/primitives',
    desc: 'Motion-tokenised loading indicators.',
    props: { kind: sel(['spinner', 'dots'], 'spinner'), size: num(32, 16, 64, 4) },
    render: (p) => p.kind === 'dots' ? '<div class="ib-dots"><span></span><span></span><span></span></div>' : `<div class="ib-loader" style="width:${p.size}px;height:${p.size}px;border-width:${Math.max(2, Math.round(p.size / 10))}px"></div>`,
  },
};

export const defaultsFor = (id) => Object.fromEntries(Object.entries(components[id].props).map(([k, c]) => [k, c.default]));

// ---------- Code generation ----------
const pascal = (s) => s.replace(/(^|[-_\s])(\w)/g, (_, __, c) => c.toUpperCase());

export function usageCode(id, props) {
  const c = components[id];
  const defs = defaultsFor(id);
  const parts = Object.entries(props)
    .filter(([k, v]) => v !== defs[k] || ['label', 'text', 'title', 'variant'].includes(k))
    .map(([k, v]) => {
      if (typeof v === 'boolean') return v ? `<span class="tok-a">${k}</span>` : `<span class="tok-a">${k}</span>={<span class="tok-k">false</span>}`;
      if (typeof v === 'number') return `<span class="tok-a">${k}</span>={<span class="tok-t">${v}</span>}`;
      return `<span class="tok-a">${k}</span>=<span class="tok-s">"${esc(v)}"</span>`;
    });
  const name = pascal(c.name);
  const imp = `<span class="tok-k">import</span> { ${name} } <span class="tok-k">from</span> <span class="tok-s">"@/components/${id}"</span>;\n\n`;
  const body = parts.length > 2 ? `&lt;<span class="tok-t">${name}</span>\n  ${parts.join('\n  ')}\n/&gt;` : `&lt;<span class="tok-t">${name}</span> ${parts.join(' ')} /&gt;`;
  return imp + body;
}

export function sourceCode(id) {
  const c = components[id];
  const name = pascal(c.name);
  const types = Object.entries(c.props).map(([k, cfg]) => {
    const t = cfg.type === 'select' ? cfg.options.map((o) => `<span class="tok-s">"${o}"</span>`).join(' | ') : cfg.type === 'boolean' ? '<span class="tok-t">boolean</span>' : cfg.type === 'number' ? '<span class="tok-t">number</span>' : '<span class="tok-t">string</span>';
    return `  <span class="tok-a">${k}</span>?: ${t};`;
  }).join('\n');
  const defaults = Object.entries(c.props).map(([k, cfg]) => `${k} = ${typeof cfg.default === 'string' ? `<span class="tok-s">"${esc(cfg.default)}"</span>` : `<span class="tok-t">${cfg.default}</span>`}`).join(', ');
  return `<span class="tok-c">// Generated by InkBuddy CLI · template: ${id}</span>
<span class="tok-k">import</span> * <span class="tok-k">as</span> React <span class="tok-k">from</span> <span class="tok-s">"react"</span>;
<span class="tok-k">import</span> { cn } <span class="tok-k">from</span> <span class="tok-s">"@/lib/utils"</span>;
<span class="tok-c">// primitive: ${c.pkg}</span>

<span class="tok-k">export interface</span> <span class="tok-t">${name}Props</span> {
${types}
  <span class="tok-a">className</span>?: <span class="tok-t">string</span>;
}

<span class="tok-k">export const</span> <span class="tok-t">${name}</span> = React.forwardRef&lt;<span class="tok-t">HTMLElement</span>, <span class="tok-t">${name}Props</span>&gt;(
  ({ ${defaults}, className, ...rest }, ref) =&gt; (
    &lt;<span class="tok-t">div</span>
      <span class="tok-a">ref</span>={ref}
      <span class="tok-a">className</span>={cn(<span class="tok-s">"ib-${id}"</span>, className)}
      {...rest}
    /&gt;
  )
);
<span class="tok-t">${name}</span>.displayName = <span class="tok-s">"${name}"</span>;`;
}

export const stripTags = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };

// ---------- Interactivity inside rendered previews ----------
export function bindInteractive(root) {
  root.addEventListener('click', (e) => {
    const tog = e.target.closest('[data-ib-toggle]');
    if (tog) { e.preventDefault(); tog.querySelector('[data-ib-target]')?.classList.toggle('on'); return; }
    const tab = e.target.closest('[data-ib-tab]');
    if (tab) {
      const wrap = tab.closest('[data-ib-tabs]');
      wrap.querySelectorAll('[data-ib-tab]').forEach((t) => t.classList.toggle('on', t === tab));
      wrap.querySelector('[data-ib-panel]').textContent = tab.dataset.text;
      return;
    }
    const trig = e.target.closest('.ib-acc-trigger');
    if (trig) {
      const item = trig.parentElement, acc = item.closest('[data-ib-acc]');
      const willOpen = !item.classList.contains('open');
      if (!acc.hasAttribute('data-multi')) acc.querySelectorAll('.ib-acc-item').forEach((i) => i.classList.remove('open'));
      item.classList.toggle('open', willOpen);
    }
  });
  root.addEventListener('input', (e) => {
    if (e.target.matches('[data-ib-range]')) {
      const out = e.target.closest('.ib-slider').querySelector('[data-ib-out]');
      if (out) out.textContent = e.target.value;
    }
  });
}

// ---------- Theme tokens ----------
export const DEFAULT_THEME = { name: 'InkBuddy Default', accent: '#4ade80', radius: 8, font: 'Inter', mode: 'dark' };
const fonts = { Inter: "'Inter', sans-serif", System: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", Mono: "'JetBrains Mono', monospace", Serif: "Georgia, 'Times New Roman', serif" };
export const FONT_OPTIONS = Object.keys(fonts);

function readableOn(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0a0a0a' : '#ffffff';
}

export function applyTheme(el, t) {
  el.style.setProperty('--ib-accent', t.accent);
  el.style.setProperty('--ib-accent-fg', readableOn(t.accent));
  el.style.setProperty('--ib-radius', t.radius + 'px');
  el.style.setProperty('--ib-font', fonts[t.font] || fonts.Inter);
  el.classList.toggle('light', t.mode === 'light');
}

export function themeToTokens(t) {
  return {
    colors: {
      brand: { primary: t.accent, 'primary-muted': t.accent + '1a', secondary: '#a1a1aa', accent: t.accent },
      background: t.mode === 'light' ? { main: '#ffffff', surface: '#fafafa', card: '#ffffff' } : { main: '#09090b', surface: '#0f0f12', card: '#141418' },
      ui: t.mode === 'light' ? { border: '#e4e4e7', 'text-main': '#09090b', 'text-secondary': '#71717a' } : { border: '#26262b', 'text-main': '#fafafa', 'text-secondary': '#a1a1aa' },
    },
    radius: { sm: Math.round(t.radius / 2) + 'px', md: t.radius + 'px', lg: Math.round(t.radius * 1.5) + 'px', full: '9999px' },
    typography: { fontFamily: { sans: fonts[t.font], mono: fonts.Mono } },
  };
}
