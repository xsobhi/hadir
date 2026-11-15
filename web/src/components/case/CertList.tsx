import { CertificateCheck } from "kubai-icons-react";
import { BadgeCheck, ExternalLink } from "lucide-react";
import type { CaseStudy } from "../../content/case-study";
import { Tile } from "../ui/Tile";
import SpotlightCard from "../../vendor/reactbits/SpotlightCard";
import { useLang } from "../../i18n";
import { day } from "../../i18n/format";
import type { Labels } from "./labels";

/** Each certificate beside the concrete places it shows up in Hadir. */
export function CertList({ cs, l }: { cs: CaseStudy; l: Labels }) {
  const { lang } = useLang();
  return (
    <section className="cs-section" aria-labelledby="certs-h">
      <h2 id="certs-h" data-kubai-trigger><Tile icon={CertificateCheck} tone="brand" size={52} />{l.certs}</h2>
      <ol className="cert-list">
        {cs.certs.map((c) => (
          <li key={c.verifyUrl} data-reveal>
            <SpotlightCard className="cert" theme="light" spotlightColor="#0e8a6a" intensity={0.45}>
            <div className="cert-head">
              <p className="cert-issuer"><BadgeCheck aria-hidden="true" size={18} />{c.issuer} · <span className="num">{day(c.date, lang)}</span></p>
              <h3>{c.name}</h3>
              <a className="link small" href={c.verifyUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" size={15} />{l.verify}</a>
            </div>
            <ul className="cs-list">{c.applied.map((a) => <li key={a}>{a}</li>)}</ul>
            </SpotlightCard>
          </li>
        ))}
      </ol>
    </section>
  );
}
