import React, { useState, useEffect } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import {
    ReactFlow, Background, Controls, Handle, Position, MarkerType,
    useNodesState, useEdgesState
} from 'https://esm.sh/@xyflow/react@12?deps=react@18.3.1,react-dom@18.3.1';

const html = htm.bind(React.createElement);
const ACCENT = '#CCFF00';
const LINE = '#2A2A2E';

const STAGES = [
    { id: '1', x: 0,   icon: '\uD83C\uDFA8', title: 'Figma Tokens',     desc: 'Ingestion Layer' },
    { id: '2', x: 320, icon: '\u2699\uFE0F', title: 'Style Dictionary', desc: 'Transformation' },
    { id: '3', x: 640, icon: '\uD83D\uDC19', title: 'GitHub',           desc: 'Version Control' },
    { id: '4', x: 960, icon: '\uD83D\uDE80', title: 'Production',       desc: 'Deployment' },
];

function openStage(step) {
    if (window.openWorkspace) window.openWorkspace(step);
}

function StageNode({ data }) {
    return html`
        <div className=${'plugin-node' + (data.active ? ' active' : '')}
             onClick=${() => openStage(data.step)}>
            <${Handle} type="target" position=${Position.Left} className="rf-handle" />
            <div className="plugin-icon">${data.icon}</div>
            <div className="plugin-title">${data.title}</div>
            <div className="plugin-desc">${data.desc}</div>
            <${Handle} type="source" position=${Position.Right} className="rf-handle" />
        </div>
    `;
}

const nodeTypes = { stage: StageNode };

const buildNodes = () => STAGES.map((s, i) => ({
    id: s.id,
    type: 'stage',
    position: { x: s.x, y: 0 },
    data: { step: s.id, icon: s.icon, title: s.title, desc: s.desc, active: i === 0 },
}));

const buildEdges = () => STAGES.slice(0, -1).map((s, i) => ({
    id: `e${s.id}-${STAGES[i + 1].id}`,
    source: s.id,
    target: STAGES[i + 1].id,
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: LINE },
    style: { stroke: LINE, strokeWidth: 2 },
}));

function FlowApp() {
    const [active, setActive] = useState(0);
    const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

    useEffect(() => {
        window.flowControl = { setActive: (n) => setActive(n) };
        return () => { delete window.flowControl; };
    }, []);

    useEffect(() => {
        setNodes(nds => nds.map((n, i) => ({ ...n, data: { ...n.data, active: i <= active } })));
        setEdges(eds => eds.map((e, i) => ({
            ...e,
            style: { stroke: i < active ? ACCENT : LINE, strokeWidth: i < active ? 2.5 : 2 },
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: i < active ? ACCENT : LINE },
        })));
    }, [active, setNodes, setEdges]);

    return html`
        <${ReactFlow}
            nodes=${nodes}
            edges=${edges}
            onNodesChange=${onNodesChange}
            onEdgesChange=${onEdgesChange}
            nodeTypes=${nodeTypes}
            fitView
            fitViewOptions=${{ padding: 0.25 }}
            minZoom=${0.4}
            maxZoom=${1.6}
            nodesConnectable=${false}
            deleteKeyCode=${null}
            zoomOnScroll=${false}
            zoomOnPinch=${false}
            zoomOnDoubleClick=${false}
            preventScrolling=${false}
        >
            <${Background} variant="dots" gap=${22} size=${1} color="#1F1F22" />
            <${Controls} showInteractive=${false} showZoom=${false} />
        <//>
    `;
}

createRoot(document.getElementById('flow-root')).render(html`<${FlowApp} />`);
