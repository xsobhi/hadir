import type { CaseStudy } from "../../content/case-study";
import { useLang } from "../../i18n";
import { day } from "../../i18n/format";
import type { Labels } from "./labels";

/** Each certificate beside the concrete places it shows up in Hadir. */
export function CertList({ cs, l }: { cs: CaseStudy; l: Labels }) {
  const { lang } = useLang();
  return (
    <section className="cs-section" aria-labelledby="certs-h">
      <h2 id="certs-h">{l.certs}</h2>
      <ol className="cert-list">
        {cs.certs.map((c) => (
          <li key={c.verifyUrl} className="cert">
            <div className="cert-head">
              <p className="cert-issuer">{c.issuer} · <span className="num">{day(c.date, lang)}</span></p>
              <h3>{c.name}</h3>
              <a className="link small" href={c.verifyUrl} target="_blank" rel="noreferrer">{l.verify}</a>
            </div>
            <ul className="cs-list">{c.applied.map((a) => <li key={a}>{a}</li>)}</ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
