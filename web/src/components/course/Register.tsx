import { Link } from "react-router-dom";
import type { CourseDetail } from "../../api/types";
import { useLang } from "../../i18n";
import { day, shortDay } from "../../i18n/format";
import { AllowanceTrack } from "../AllowanceTrack";

const KIND: Record<string, string> = { P: "present", L: "late", A: "absent", E: "excused", "-": "none" };

export function Mark({ code }: { code: string }) {
  return <span className={`mk mk-${KIND[code] ?? "none"}`} aria-hidden="true" />;
}

/** The roll-call sheet: a row per student, a column per class (oldest at the start), the latest class in blue. */
export function Register({ detail }: { detail: CourseDetail }) {
  const { t, lang, pick } = useLang();
  const { sessions, students } = detail;
  const latest = sessions.length - 1;
  const legend = [["P", t.course.legendPresent], ["L", t.course.legendLate], ["A", t.course.legendAbsent], ["E", t.course.legendExcused]];
  return (
    <section className="panel register-panel" aria-labelledby="reg-h">
      <div className="panel-head">
        <h2 id="reg-h">{t.course.register}</h2>
        <ul className="legend">
          {legend.map(([code, label]) => <li key={code}><Mark code={code} />{label}</li>)}
        </ul>
      </div>
      {sessions.length === 0 ? <p className="empty-line">{t.course.noSessions}</p> : (
        <div className="register-scroll" tabIndex={0} aria-label={t.course.registerNote}>
          <table className="register">
            <thead>
              <tr>
                <th scope="col" className="reg-name">{t.student}</th>
                {sessions.map((s, i) => (
                  <th key={s.id} scope="col" className={i === latest ? "reg-day reg-latest" : "reg-day"} title={`${day(s.startsAt, lang, true)} · ${s.topic}`}>
                    <span className="num" dir="ltr">{shortDay(s.startsAt)}</span>
                  </th>
                ))}
                <th scope="col" className="reg-fig">{t.course.absentCol}</th>
                <th scope="col" className="reg-fig">{t.course.lateCol}</th>
                <th scope="col" className="reg-track">{t.course.allowanceCol}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className={`lvl-${s.level}`}>
                  <th scope="row" className="reg-name">
                    <span className="reg-name-in">
                      <Link to={`/app/students/${s.id}`}>{pick(s.nameAr, s.nameEn)}</Link>
                      <span className="num muted">{s.number}</span>
                    </span>
                  </th>
                  {[...s.register].map((code, i) => (
                    <td key={i} className={i === latest ? "reg-cell reg-latest" : "reg-cell"}
                      title={`${day(sessions[i].startsAt, lang)}: ${t.status[KIND[code] as "present"] ?? "—"}`}>
                      <Mark code={code} />
                    </td>
                  ))}
                  <td className="reg-fig num">{s.absent}</td>
                  <td className="reg-fig num muted">{s.late}</td>
                  <td className="reg-track"><AllowanceTrack used={s.absent} allowed={s.allowed} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small reg-note">{t.course.registerNote}</p>
    </section>
  );
}
