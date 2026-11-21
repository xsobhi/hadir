import type { WebsiteStudy } from "../../content/case-study/website-types";

export function WebsiteSection({ study }: { study: WebsiteStudy }) {
  return <>
    <section className="cs-section" aria-labelledby="website-h">
      <h2 id="website-h">{study.title}</h2>
      <p className="cs-statement">{study.summary}</p>
      <div className="card stack"><p>{study.status}</p><p className="muted">{study.role}</p></div>
      <h3 className="cs-sub">{study.flowTitle}</h3>
      <ol className="cs-journey">{study.flow.map((step, i) => <li key={step}><span className="chip chip-code">{i + 1}</span>{step}</li>)}</ol>
      <h3 className="cs-sub">{study.screensTitle}</h3>
      <div className="cs-columns">{study.screens.map((screen) => <article className="card stack" key={screen.name}>
        <h4>{screen.name}</h4><code className="cs-route" dir="ltr">{screen.route}</code>
        <p>{screen.purpose}</p><p className="muted">{screen.decision}</p>
      </article>)}</div>
    </section>
    {[{ id: "architecture-h", title: study.architectureTitle, items: study.architecture },
      { id: "iteration-h", title: study.iterationTitle, items: study.iterations }].map((section) =>
      <section className="cs-section" key={section.id} aria-labelledby={section.id}>
        <h2 id={section.id}>{section.title}</h2><dl className="cs-defs cs-defs-inline">{section.items.map((item) =>
          <div key={item.title}><dt>{item.title}</dt><dd>{item.body}</dd></div>)}</dl>
      </section>)}
    <section className="cs-section" aria-labelledby="evidence-h">
      <h2 id="evidence-h">{study.evidenceTitle}</h2>
      <ul className="cs-list">{study.evidence.map((s) => <li key={s}>{s}</li>)}</ul>
      <h3 className="cs-sub">{study.limitsTitle}</h3>
      <ul className="cs-list">{study.limits.map((s) => <li key={s}>{s}</li>)}</ul>
    </section>
  </>;
}
