import type { CaseStudy } from "../../content/case-study";
import type { Labels } from "./labels";

export function UxSection({ cs, l }: { cs: CaseStudy; l: Labels }) {
  const ux = cs.ux;
  return (
    <section className="cs-section" aria-labelledby="ux-h">
      <h2 id="ux-h">{l.ux}</h2>
      <div className="cs-split">
        <h3>{l.problem}</h3>
        <p className="cs-statement">{ux.problem}</p>
      </div>
      <h3 className="cs-sub">{l.personas}</h3>
      <div className="personas">
        {ux.personas.map((p) => (
          <article key={p.name} className="persona">
            <p className="persona-name">{p.name}</p>
            <p className="muted small">{p.role}</p>
            <p className="persona-context">{p.context}</p>
            <p className="persona-label">{l.goals}</p>
            <ul className="cs-list">{p.goals.map((g) => <li key={g}>{g}</li>)}</ul>
            <p className="persona-label">{l.frustrations}</p>
            <ul className="cs-list">{p.frustrations.map((g) => <li key={g}>{g}</li>)}</ul>
          </article>
        ))}
      </div>
      <h3 className="cs-sub">{l.journey}</h3>
      <div className="cs-table-wrap">
        <table className="cs-table">
          <thead><tr><th>{l.stage}</th><th>{l.doing}</th><th>{l.feeling}</th><th>{l.opportunity}</th></tr></thead>
          <tbody>
            {ux.journey.map((j) => (
              <tr key={j.stage}><th scope="row">{j.stage}</th><td>{j.doing}</td><td>{j.feeling}</td><td>{j.opportunity}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cs-columns">
        <div>
          <h3 className="cs-sub">{l.hmw}</h3>
          <ul className="cs-list">{ux.hmw.map((h) => <li key={h}>{h}</li>)}</ul>
          <h3 className="cs-sub">{l.accessibility}</h3>
          <ul className="cs-list">{ux.accessibility.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
        <div>
          <h3 className="cs-sub">{l.decisions}</h3>
          <dl className="cs-defs">
            {ux.decisions.map((d) => <div key={d.title}><dt>{d.title}</dt><dd>{d.body}</dd></div>)}
          </dl>
        </div>
      </div>
      <h3 className="cs-sub">{l.research}</h3>
      <div className="cs-columns cs-columns-3">
        <div><p className="persona-label">{l.researchGoals}</p><ul className="cs-list">{ux.researchPlan.goals.map((g) => <li key={g}>{g}</li>)}</ul></div>
        <div><p className="persona-label">{l.questions}</p><ul className="cs-list">{ux.researchPlan.questions.map((g) => <li key={g}>{g}</li>)}</ul></div>
        <div><p className="persona-label">{l.kpis}</p><ul className="cs-list">{ux.researchPlan.kpis.map((g) => <li key={g}>{g}</li>)}</ul></div>
      </div>
      <dl className="cs-defs cs-defs-inline">
        <div><dt>{l.method}</dt><dd>{ux.researchPlan.method}</dd></div>
        <div><dt>{l.participants}</dt><dd>{ux.researchPlan.participants}</dd></div>
      </dl>
    </section>
  );
}
