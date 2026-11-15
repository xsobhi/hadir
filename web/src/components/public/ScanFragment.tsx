import { CircleCheck } from "lucide-react";
import { useLang } from "../../i18n";
import { Avatar } from "../Avatar";
import { StatusChip } from "../ui/Status";

const ROWS = [
  { ar: "ليان الشوا", en: "Layan Al-Shawwa", n: "120236118", g: "f", at: "08:02", s: "present" },
  { ar: "حمزة أبو عودة", en: "Hamza Abu Odeh", n: "120241907", g: "m", at: "08:04", s: "present" },
  { ar: "آية سكيك", en: "Aya Skaik", n: "120229344", g: "f", at: "08:13", s: "late" },
] as const;

/** A real piece of the live screen, built from the app's own components, for the welcome page. */
export function ScanFragment() {
  const { t, pick } = useLang();
  return (
    <div className="fragment" data-ui aria-hidden="true">
      <div className="fragment-top">
        <span className="chip chip-present live-chip">{t.live.title}</span>
        <span className="fragment-course">{t.auth.welcome.fragmentCourse}</span>
      </div>
      <div className="result result-ok fragment-result">
        <Avatar seed={ROWS[1].n} gender={ROWS[1].g} size={58} />
        <div className="result-text">
          <p className="result-head"><CircleCheck aria-hidden="true" />{t.live.result.present}</p>
          <p className="result-name">{pick(ROWS[1].ar, ROWS[1].en)}</p>
          <p className="result-sub num"><span dir="ltr">{ROWS[1].n}</span> · {ROWS[1].at}</p>
        </div>
      </div>
      <div className="fragment-count"><strong className="num">31</strong><span>{t.live.present} {t.live.ofEnrolled(38)}</span></div>
      <div className="fragment-bar"><span style={{ width: "76%" }} /><span className="late" style={{ width: "5%" }} /></div>
      <ul className="rows">
        {ROWS.map((r) => (
          <li key={r.n} className="row fragment-row">
            <span className="person"><Avatar seed={r.n} gender={r.g} size={36} /><span className="person-text"><span className="person-name">{pick(r.ar, r.en)}</span><span className="person-sub num">{r.n}</span></span></span>
            <StatusChip status={r.s} time={r.at} />
          </li>
        ))}
      </ul>
    </div>
  );
}
