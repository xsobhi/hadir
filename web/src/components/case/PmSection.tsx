import { ClipboardCheck } from "kubai-icons-react";
import type { CaseStudy } from "../../content/case-study";
import { Tile } from "../ui/Tile";
import { useLang } from "../../i18n";
import { day } from "../../i18n/format";
import type { Labels } from "./labels";

export function PmSection({ cs, l }: { cs: CaseStudy; l: Labels }) {
  const { lang } = useLang();
  const pm = cs.pm;
  return (
    <section className="cs-section" aria-labelledby="pm-h">
      <h2 id="pm-h" data-kubai-trigger><Tile icon={ClipboardCheck} tone="blue" size={52} />{l.pm}</h2>
      <div className="cs-split" data-reveal><h3>{l.goal}</h3><p className="cs-statement">{pm.goal}</p></div>
      <div data-reveal className="cs-columns cs-columns-4">
        <div><h3 className="cs-sub">{l.scopeIn}</h3><ul className="cs-list">{pm.scopeIn.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h3 className="cs-sub">{l.scopeOut}</h3><ul className="cs-list">{pm.scopeOut.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h3 className="cs-sub">{l.deliverables}</h3><ul className="cs-list">{pm.deliverables.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h3 className="cs-sub">{l.success}</h3><ul className="cs-list">{pm.successCriteria.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <h3 className="cs-sub">{l.milestones}</h3>
      <ol className="milestones">
        {pm.milestones.map((m) => (
          <li key={m.name} className={`milestone ms-${m.status}`} data-reveal>
            <span className="ms-dot" aria-hidden="true" />
            <span className="ms-date num">{day(m.date, lang)}</span>
            <span className="ms-name">{m.name}</span>
            <span className="ms-status">{l.status[m.status]}</span>
          </li>
        ))}
      </ol>
      <div data-reveal className="cs-columns">
        <div>
          <h3 className="cs-sub">{l.stakeholders}</h3>
          <div className="cs-table-wrap" tabIndex={0}><table className="cs-table">
            <thead><tr><th>{l.stakeholders}</th><th>{l.interest}</th><th>{l.influence}</th></tr></thead>
            <tbody>{pm.stakeholders.map((s) => <tr key={s.who}><th scope="row">{s.who}</th><td>{s.interest}</td><td>{l.level[s.influence]}</td></tr>)}</tbody>
          </table></div>
        </div>
        <div>
          <h3 className="cs-sub">{l.raci}</h3>
          <div className="cs-table-wrap" tabIndex={0}><table className="cs-table">
            <thead><tr><th>{l.task}</th><th>R</th><th>A</th><th>C</th><th>I</th></tr></thead>
            <tbody>{pm.raci.map((r) => <tr key={r.task}><th scope="row">{r.task}</th><td>{r.r}</td><td>{r.a}</td><td>{r.c}</td><td>{r.i}</td></tr>)}</tbody>
          </table></div>
        </div>
      </div>
      <h3 className="cs-sub">{l.risks}</h3>
      <div className="cs-table-wrap" data-reveal>
        <table className="cs-table">
          <thead><tr><th>{l.risk}</th><th>{l.likelihood}</th><th>{l.impact}</th><th>{l.mitigation}</th></tr></thead>
          <tbody>
            {pm.risks.map((r) => (
              <tr key={r.risk}>
                <th scope="row">{r.risk}</th>
                <td className={`lvl-text lvl-${r.likelihood}`}>{l.level[r.likelihood]}</td>
                <td className={`lvl-text lvl-${r.impact}`}>{l.level[r.impact]}</td>
                <td>{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div data-reveal className="cs-columns">
        <div><h3 className="cs-sub">{l.retro}: {l.wentWell}</h3><ul className="cs-list">{pm.retrospective.wentWell.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h3 className="cs-sub">{l.retro}: {l.improve}</h3><ul className="cs-list">{pm.retrospective.improve.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
    </section>
  );
}
