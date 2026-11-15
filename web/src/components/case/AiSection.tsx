import { Link } from "react-router-dom";
import { BotSparkle } from "kubai-icons-react";
import type { CaseStudy } from "../../content/case-study";
import { Tile } from "../ui/Tile";
import { useLang } from "../../i18n";
import { AgentDiagram } from "./AgentDiagram";
import type { Labels } from "./labels";

export function AiSection({ cs, l }: { cs: CaseStudy; l: Labels }) {
  const { lang } = useLang();
  const ai = cs.ai;
  const ar = lang === "ar";
  return (
    <section className="cs-section" aria-labelledby="ai-h">
      <h2 id="ai-h" data-kubai-trigger><Tile icon={BotSparkle} tone="amber" size={52} />{l.ai}</h2>
      <div className="cs-split" data-reveal><h3>{l.graph}</h3><p className="cs-statement">{ai.summary}</p></div>
      <div data-reveal className="cs-columns cs-ai">
        <AgentDiagram read={ar ? "قراءة" : "read"} write={ar ? "تعديل" : "write"} approve={ar ? "موافقة" : "approve"}
          decline={ar ? "رفض" : "decline"} answer={ar ? "إجابة" : "answer"} approved={ar ? "معتمدة" : "approved"} revise={ar ? "تعديل" : "revise"} />
        <dl className="cs-defs">
          {ai.nodes.map((n) => <div key={n.name}><dt><code>{n.name}</code></dt><dd>{n.does}</dd></div>)}
        </dl>
      </div>
      <h3 className="cs-sub">{l.tools}</h3>
      <div className="cs-table-wrap" data-reveal>
        <table className="cs-table">
          <thead><tr><th>{l.tools}</th><th>{l.kind}</th><th /></tr></thead>
          <tbody>
            {ai.tools.map((tl) => (
              <tr key={tl.name}>
                <th scope="row"><code>{tl.name}</code></th>
                <td className={tl.kind === "write" ? "kind-write" : ""}>{l.toolKind[tl.kind]}</td>
                <td>{tl.does}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div data-reveal className="cs-columns">
        <div><h3 className="cs-sub">{l.safeguards}</h3><ul className="cs-list">{ai.safeguards.map((s) => <li key={s}>{s}</li>)}</ul></div>
        <div>
          <h3 className="cs-sub">{l.examples}</h3>
          <ul className="cs-list">{ai.examples.map((s) => <li key={s}>{s}</li>)}</ul>
          <Link to="/" className="btn btn-primary cs-cta">{l.openDemo}</Link>
        </div>
      </div>
    </section>
  );
}
