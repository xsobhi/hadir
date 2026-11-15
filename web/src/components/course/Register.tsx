import { Link } from "react-router-dom";
import type { CourseDetail, Status } from "../../api/types";
import { useLang } from "../../i18n";
import { day, shortDay } from "../../i18n/format";
import { Avatar } from "../Avatar";
import { AbsenceBar, StatusDot } from "../ui/Status";

const KIND: Record<string, Status | null> = { P: "present", L: "late", A: "absent", E: "excused", "-": null };

/** The roll-call sheet: a row per student, a column per class (oldest first), each mark an icon badge. */
export function Register({ detail }: { detail: CourseDetail }) {
  const { t, lang, pick } = useLang();
  const { sessions, students } = detail;
  const latest = sessions.length - 1;
  const legend: Status[] = ["present", "late", "absent", "excused"];
  return (
    <section className="card register-card" aria-labelledby="reg-h">
      <div className="card-head">
        <div className="card-title"><div><h2 id="reg-h">{t.course.register}</h2><p>{t.course.registerNote}</p></div></div>
        <ul className="legend">
          {legend.map((s) => <li key={s}><StatusDot status={s} />{t.status[s]}</li>)}
        </ul>
      </div>
      {sessions.length === 0 ? <p className="empty">{t.course.noSessions}</p> : (
        <div className="register-scroll" tabIndex={0} aria-label={t.course.register}>
          <table className="register">
            <thead>
              <tr>
                <th scope="col" className="reg-name">{t.student}</th>
                {sessions.map((s, i) => (
                  <th key={s.id} scope="col" className={i === latest ? "reg-day reg-latest" : "reg-day"} title={`${day(s.startsAt, lang, true)} · ${s.topic}`}>
                    <span className="num" dir="ltr">{shortDay(s.startsAt)}</span>
                  </th>
                ))}
                <th scope="col" className="reg-sum">{t.course.allowanceCol}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="reg-name">
                    <Link to={`/app/students/${s.id}`} className="person">
                      <Avatar seed={s.number} gender={s.gender} size={34} />
                      <span className="person-text"><span className="person-name">{pick(s.nameAr, s.nameEn)}</span><span className="person-sub num">{s.number}</span></span>
                    </Link>
                  </th>
                  {[...s.register].map((code, i) => (
                    <td key={i} className={i === latest ? "reg-cell reg-latest" : "reg-cell"}>
                      <StatusDot status={KIND[code] ?? null} title={`${day(sessions[i].startsAt, lang)}: ${KIND[code] ? t.status[KIND[code]!] : "—"}`} />
                    </td>
                  ))}
                  <td className="reg-sum"><AbsenceBar used={s.absent} allowed={s.allowed} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
