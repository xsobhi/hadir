import { CircleCheck, Clock } from "lucide-react";
import { useLang } from "../../i18n";

/** A real piece of the live screen, drawn with the app's own styles, for the welcome page. */
export function ScanFragment() {
  const { t, lang } = useLang();
  const rows = lang === "ar"
    ? [["ليان الشوا", "120236118", "08:02", "present"], ["حمزة أبو عودة", "120241907", "08:04", "present"], ["آية سكيك", "120229344", "08:13", "late"]]
    : [["Layan Al-Shawwa", "120236118", "08:02", "present"], ["Hamza Abu Odeh", "120241907", "08:04", "present"], ["Aya Skaik", "120229344", "08:13", "late"]];
  return (
    <div className="fragment" data-ui aria-hidden="true">
      <p className="fragment-course">{t.auth.welcome.fragmentCourse}</p>
      <p className="count-line"><span className="count-big num">31</span><span className="count-of">{t.live.present} <span className="num">{t.live.ofEnrolled(38)}</span></span></p>
      <div className="count-bar"><span className="seg seg-present" style={{ width: "76%" }} /><span className="seg seg-late" style={{ width: "5%" }} /></div>
      <div className="scan-card scan-ok">
        <CircleCheck className="scan-icon" />
        <div className="scan-text">
          <p className="scan-head">{t.live.result.present}<span className="scan-name">{rows[1][0]}</span></p>
          <p className="scan-sub num"><span className="ltr">{rows[1][1]}</span> · {rows[1][2]}</p>
        </div>
      </div>
      <ul className="rows">
        {rows.map(([name, num, at, st]) => (
          <li key={num} className="row fragment-row">
            <span className="person-text"><span className="person-name">{name}</span><span className="person-sub num">{num}</span></span>
            <span className={st === "late" ? "status-late" : ""}>{st === "late" ? <Clock className="inline-icon" /> : null}{t.status[st as "present"]} <span className="num muted">{at}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
