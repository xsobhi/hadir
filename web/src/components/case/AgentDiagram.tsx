type Node = { id: string; x: number; y: number; w?: number; label: string; tone?: "gate" | "end" };
type Edge = { from: [number, number]; to: [number, number]; label?: string; lx?: number; ly?: number; curve?: number };

function Flow({ nodes, edges, height, title }: { nodes: Node[]; edges: Edge[]; height: number; title: string }) {
  return (
    <svg className="flow" viewBox={`0 0 680 ${height}`} role="img" aria-label={title}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="flow-head" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const [x1, y1] = e.from, [x2, y2] = e.to;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (e.curve ?? 0);
        return (
          <g key={i}>
            <path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} className="flow-edge" markerEnd="url(#arrow)" />
            {e.label && <text x={e.lx ?? mx} y={e.ly ?? my - 6} className="flow-label" textAnchor="middle">{e.label}</text>}
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <rect x={n.x} y={n.y} width={n.w ?? 112} height={40} rx={n.tone === "end" ? 20 : 6} className={`flow-node flow-${n.tone ?? "node"}`} />
          <text x={n.x + (n.w ?? 112) / 2} y={n.y + 25} className="flow-text" textAnchor="middle">{n.label}</text>
        </g>
      ))}
    </svg>
  );
}

/** The two LangGraph state machines, drawn from the code in backend/hadir/agent/graph.py and reflection.py. */
export function AgentDiagram({ approve, decline, read, write, answer, approved, revise }: Record<string, string>) {
  return (
    <div className="flows">
      <Flow title="agent graph" height={230} nodes={[
        { id: "start", x: 8, y: 95, w: 80, label: "START", tone: "end" },
        { id: "agent", x: 150, y: 95, label: "agent" },
        { id: "tools", x: 380, y: 18, label: "tools" },
        { id: "review", x: 380, y: 172, label: "review", tone: "gate" },
        { id: "end", x: 590, y: 95, w: 80, label: "END", tone: "end" },
      ]} edges={[
        { from: [88, 115], to: [148, 115] },
        { from: [262, 105], to: [378, 40], label: read, curve: -10 },
        { from: [380, 52], to: [250, 96], curve: 18 },
        { from: [262, 125], to: [378, 190], label: write, curve: 10, ly: 172 },
        { from: [436, 172], to: [436, 60], label: approve, lx: 470, ly: 120 },
        { from: [380, 200], to: [215, 137], label: decline, curve: 30, lx: 290, ly: 214 },
        { from: [262, 115], to: [588, 115], label: answer, lx: 520, ly: 108 },
      ]} />
      <Flow title="reflection graph" height={150} nodes={[
        { id: "start", x: 8, y: 20, w: 80, label: "START", tone: "end" },
        { id: "draft", x: 140, y: 20, label: "draft" },
        { id: "critique", x: 330, y: 20, label: "critique" },
        { id: "revise", x: 330, y: 100, label: "revise" },
        { id: "end", x: 590, y: 20, w: 80, label: "END", tone: "end" },
      ]} edges={[
        { from: [88, 40], to: [138, 40] },
        { from: [252, 40], to: [328, 40] },
        { from: [442, 40], to: [588, 40], label: approved, lx: 515, ly: 32 },
        { from: [420, 60], to: [420, 98], label: revise, lx: 480, ly: 84 },
        { from: [352, 98], to: [352, 62] },
      ]} />
    </div>
  );
}
