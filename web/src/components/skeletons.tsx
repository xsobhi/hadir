// Loading placeholders shaped like the page that is coming, so nothing jumps when the data lands.
// The server renders pages with their data, so these show only while navigating inside the app.
type Kind = "overview" | "course" | "list" | "profile" | "live";

const Line = ({ w = "100%", h = 14 }: { w?: string; h?: number }) => <span className="sk sk-line" style={{ width: w, height: h }} />;
const Circle = ({ s = 40 }: { s?: number }) => <span className="sk sk-circle" style={{ width: s, height: s }} />;

function PersonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="sk-rows">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="sk-row"><Circle /><div className="sk-stack"><Line w="40%" /><Line w="24%" h={10} /></div><Line w="22%" h={10} /></div>
      ))}
    </div>
  );
}

function Stats() {
  return (
    <div className="stats">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="stat"><span className="sk sk-tile" /><div className="sk-stack"><Line w="60%" h={12} /><Line w="40%" h={26} /></div></div>
      ))}
    </div>
  );
}

const Card = ({ children, h }: { children?: React.ReactNode; h?: number }) => <div className="card sk-card" style={h ? { minHeight: h } : undefined}>{children}</div>;
const Head = () => <div className="page-head sk-head"><div className="sk-stack"><Line w="280px" h={30} /><Line w="200px" /></div></div>;

export function PageSkeleton({ kind }: { kind: Kind }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-label="…">
      {kind === "overview" && (<><Head /><span className="sk sk-hero" /><Stats />
        <div className="grid cols-main"><Card><Line w="40%" h={20} /><PersonRows n={6} /></Card><Card h={360}><Line w="50%" h={20} /></Card></div></>)}
      {kind === "course" && (<><Head /><span className="sk sk-tabs" /><Stats /><Card h={220}><Line w="30%" h={20} /></Card><Card><PersonRows n={7} /></Card></>)}
      {kind === "list" && (<><Head /><div className="sk-toolbar"><Line w="320px" h={46} /><Line w="260px" h={46} /></div><Card><PersonRows n={9} /></Card></>)}
      {kind === "profile" && (<><div className="card sk-profile"><Circle s={96} /><div className="sk-stack"><Line w="260px" h={30} /><Line w="200px" /></div></div>
        <div className="grid cols-main"><Card h={320}><Line w="40%" h={20} /><PersonRows n={3} /></Card><Card h={320}><Line w="50%" h={20} /></Card></div></>)}
      {kind === "live" && (<><Head /><div className="grid live-grid"><Card><span className="sk sk-viewport" /><Line h={52} /></Card>
        <div className="stack"><Card h={120} /><Card h={150}><Circle s={110} /></Card><Card><PersonRows n={6} /></Card></div></div></>)}
    </div>
  );
}
