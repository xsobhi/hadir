import { Link } from "react-router-dom";
import { AiSection } from "../components/case/AiSection";
import { CertList } from "../components/case/CertList";
import { labels } from "../components/case/labels";
import { PmSection } from "../components/case/PmSection";
import { UxSection } from "../components/case/UxSection";
import { WebsiteSection } from "../components/case/WebsiteSection";
import { websiteAr } from "../content/case-study/ar/website";
import { websiteEn } from "../content/case-study/en/website";
import { Printer } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { PublicBar } from "../components/public/PublicBar";
import { caseStudy } from "../content/case-study";
import { useLang } from "../i18n";
import { useRef } from "react";
import { useReveal } from "../motion/useReveal";
import { useTitle } from "../ssr/context";

export default function CaseStudy() {
  const { lang, t } = useLang();
  const cs = caseStudy[lang];
  const l = labels[lang];
  const website = lang === "ar" ? websiteAr : websiteEn;
  useTitle(`${cs.title} · ${t.product}`);
  const main = useRef<HTMLElement>(null);
  useReveal(main);
  return (
    <div className="public">
      <PublicBar />
      <main className="case" ref={main}>
        <header className="cs-head" data-reveal>
          <h1>{cs.title}</h1>
          <p className="cs-lead">{cs.lead}</p>
          <p className="cs-author"><Avatar seed="sobhi-al-firani" gender="m" size={44} /><span><strong>{cs.author.name}</strong> · {cs.author.line}</span></p>
          <nav className="cs-toc" aria-label={cs.title}>
            <a href="#website-h" className="link">{website.title}</a>
            <a href="#architecture-h" className="link">{website.architectureTitle}</a>
            <a href="#iteration-h" className="link">{website.iterationTitle}</a>
            <a href="#certs-h" className="link">{l.certs}</a>
            <a href="#ux-h" className="link">{l.ux}</a>
            <a href="#pm-h" className="link">{l.pm}</a>
            <a href="#ai-h" className="link">{l.ai}</a>
          </nav>
          <button className="btn no-print" type="button" onClick={() => window.print()}><Printer aria-hidden="true" />{lang === "ar" ? "طباعة / حفظ PDF" : "Print / save PDF"}</button>
        </header>
        <WebsiteSection study={website} />
        <CertList cs={cs} l={l} />
        <UxSection cs={cs} l={l} />
        <PmSection cs={cs} l={l} />
        <AiSection cs={cs} l={l} />
        <footer className="cs-foot">
          <Link to="/" className="cs-foot-name">{t.product}</Link>
          <span className="muted">{cs.author.name} · 2026</span>
        </footer>
      </main>
    </div>
  );
}
