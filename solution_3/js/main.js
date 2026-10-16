/* ---------- Pipeline data (externalized in assets/data/pipeline.json) ---------- */
let PIPELINE = null;
let DATA = {};
let startupLogs = [];
let STAGE_COUNT = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const levelClass = (level) => (level === 'SUCCESS' ? 'log-level-success' : 'log-level-info');
const nowTime = () => new Date().toTimeString().slice(0, 8);

async function loadPipeline() {
    const res = await fetch('assets/data/pipeline.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load assets/data/pipeline.json (HTTP ' + res.status + ')');
    PIPELINE = await res.json();
    DATA = PIPELINE.stages;
    startupLogs = PIPELINE.startupLogs || [];
    STAGE_COUNT = (PIPELINE.simulation && PIPELINE.simulation.stages.length) || Object.keys(DATA).length;
}

function highlight(code) {
    return code
        .replace(/("[^"]*")/g, '<span class="c-str">$1</span>')
        .replace(/\b(export|const|await|return|true|false|process|env|on|jobs|runs-on|uses|run|with|steps|source|platforms|strategy|regions)\b/g, '<span class="c-key">$1</span>')
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="c-num">$1</span>');
}

function renderWorkspace(step) {
    const d = DATA[step];
    document.getElementById("ws-crumb").textContent = d.title;

    const logicHtml = d.logic.map((s, i) => `
        <div class="map-step">
            <div class="map-node ${i === 0 ? 'active' : ''}">${s[0]}</div>
            <span>${s}</span>
        </div>
    `).join('<div class="map-arrow">→</div>');

    const stepsHtml = d.steps.map((s, i) => `
        <div class="detail-item">
            <div class="num">${i+1}</div>
            <div class="text"><h5>${s.h}</h5><p>${s.p}</p></div>
        </div>
    `).join("");

    const metricsHtml = d.metrics.map(m => `
        <div class="io-pill" style="text-align:center; border-left:none">
            <span style="font-size:16px; color:var(--accent); font-weight:800">${m.v}</span><br>
            <span style="font-size:9px; color:var(--text-sec)">${m.l}</span>
        </div>
    `).join("");

    const ioHtml = `
        <div class="io-zone"><span>Input</span>${d.io.in.map(x => `<div class="io-pill">${x}</div>`).join("")}</div>
        <div class="io-zone"><span>Output</span>${d.io.out.map(x => `<div class="io-pill out">${x}</div>`).join("")}</div>
    `;

    document.getElementById("ws-content").innerHTML = `
        <div class="hero-section">
            <div class="hero-ico-lg">${d.icon}</div>
            <div class="hero-title">
                <div class="role">${d.role}</div>
                <h2>${d.title}</h2>
            </div>
        </div>

        <p style="font-size:18px; line-height:1.6; color:var(--text-sec); margin-bottom:48px; max-width:800px">${d.overview}</p>

        <div class="grid-layout">
            <div class="col">
                <div class="blueprint-card">
                    <h3>Internal Logic Map</h3>
                    <div class="logic-map">${logicHtml}</div>
                    <div class="section-label">Execution Sequence</div>
                    <div class="detail-list">${stepsHtml}</div>
                </div>
                <div class="blueprint-card" style="margin-top:24px">
                    <h3>Reference Implementation</h3>
                    <div class="code-block">
                        <div class="code-bar"><span>${d.code.file}</span><span>TS/JS</span></div>
                        <div class="code-content">${highlight(d.code.lines.join("\n"))}</div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="blueprint-card">
                    <h3>System Specs</h3>
                    <div class="io-grid">${ioHtml}</div>
                    <div class="section-label" style="margin-top:24px">Performance</div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">${metricsHtml}</div>
                </div>
                <div class="blueprint-card" style="margin-top:24px">
                    <h3>Technical Stack</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:8px">
                        ${d.tech.map(t => `<span class="io-pill" style="margin:0">${t}</span>`).join("")}
                    </div>
                </div>
                <div class="impact-card">
                    <div class="impact-icon">⚡</div>
                    <div class="impact-text">
                        <h4>Business Impact</h4>
                        <p>${d.impact}</p>
                    </div>
                </div>
                <button class="sim-btn" onclick="simulateStep('${step}')">
                    <span>Run Simulation</span> <span>⚡</span>
                </button>
            </div>
        </div>
    `;
}

function simulateStep(step) {
    const entry = PIPELINE && PIPELINE.simulation
        ? PIPELINE.simulation.stages.find((s) => s.stage === String(step))
        : null;
    if (!entry) return;
    entry.events.forEach((e, i) => {
        setTimeout(() => addLog(nowTime(), e.level, e.msg, levelClass(e.level)), i * 420);
    });
}

function addLog(time, level, msg, cls) {
    const body = document.getElementById('terminal-body');
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-time">${time}</span><span class="${cls}">[${level}]</span><span class="log-msg">${msg}</span>`;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
}

/* ---------- Flow bridge (React Flow lives in the module script) ---------- */
async function waitForFlow(timeout = 6000) {
    const start = Date.now();
    while (!window.flowControl && Date.now() - start < timeout) await sleep(50);
    return !!window.flowControl;
}
const setFlowActive = (n) => { if (window.flowControl) window.flowControl.setActive(n); };

let flowQueue = Promise.resolve();
function playFlow(opts = {}) {
    const run = async () => {
        const { startAt = 0, resetFirst = false, onStage = null } = opts;
        if (resetFirst) setFlowActive(-1);
        for (let i = startAt; i < STAGE_COUNT; i++) {
            setFlowActive(i);
            if (onStage) await onStage(i);
            await sleep(900);
        }
    };
    flowQueue = flowQueue.then(run, run);
    return flowQueue;
}

/* ---------- Main Orchestration ---------- */
async function typeLog() {
    for (const log of startupLogs) {
        addLog(log.time, log.level, log.msg, levelClass(log.level));
        await sleep(600);
    }
}

function animateMetrics() {
    return new Promise((resolve) => {
        const m1 = document.getElementById('metric-1');
        const m2 = document.getElementById('metric-2');
        let s1 = 0;
        m2.textContent = '0';
        const t1 = setInterval(() => {
            s1++;
            m1.textContent = s1 + 'h';
            if (s1 >= 11) { clearInterval(t1); resolve(); }
        }, 50);
    });
}

function openWorkspace(step) {
    renderWorkspace(step);
    document.getElementById("view-main").classList.add("dimmed");
    document.getElementById("workspace").classList.add("open");
}

/* ---------- Hero simulation (replayed from data/pipeline.json) ---------- */
let simRunning = false;
async function runSimulation() {
    if (simRunning || !PIPELINE) return;
    simRunning = true;
    const btn = document.getElementById('hero-sim');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = 'Running Simulation...';

    document.getElementById('flow-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);

    const meta = PIPELINE.meta || {};
    addLog(nowTime(), 'INFO', `Triggering ${meta.trigger || 'pipeline'} \u2014 run "${meta.runLabel || 'sync'}"`, levelClass('INFO'));

    await playFlow({
        startAt: 0,
        resetFirst: true,
        onStage: async (i) => {
            const stage = PIPELINE.simulation.stages[i];
            if (!stage) return;
            for (const e of stage.events) {
                addLog(nowTime(), e.level, e.msg, levelClass(e.level));
                await sleep(360);
            }
        },
    });

    addLog(nowTime(), 'SUCCESS', 'Pipeline run complete \u2014 all stages green.', levelClass('SUCCESS'));
    await animateMetrics();

    btn.disabled = false;
    btn.innerHTML = original;
    simRunning = false;
}

window.onload = async () => {
    try {
        await loadPipeline();
    } catch (err) {
        addLog(nowTime(), 'ERROR', 'Could not load pipeline data: ' + err.message, 'log-level-info');
        return;
    }

    document.getElementById('hero-explore').addEventListener('click', () => {
        document.getElementById('flow-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('hero-sim').addEventListener('click', runSimulation);

    document.getElementById('close-ws').addEventListener('click', () => {
        document.getElementById("workspace").classList.remove("open");
        document.getElementById("view-main").classList.remove("dimmed");
    });

    await waitForFlow();
    typeLog();
    await playFlow({ startAt: 1 });
    animateMetrics();
};
