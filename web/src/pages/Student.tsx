import { useParams } from "react-router-dom";
import type { Level, Status } from "../api/types";
import { useData } from "../api/useData";
import { AllowanceTrack } from "../components/AllowanceTrack";
import { Mark } from "../components/course/Register";
import { IdCardView } from "../components/IdCardView";
import { LevelPill } from "../components/LevelPill";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { useLang } from "../i18n";
import { day, shortDay, time } from "../i18n/format";

type History = { sessionId: number; startsAt: string; topic: string; status: Status | null; markedAt: string | null; note: string };
type StudentRecord = {
  student: { id: number; number: string; nameAr: string; nameEn: string; major: string; year: number };
  courses: { courseId: number; code: string; nameAr: string; nameEn: string; allowed: number; absent: number; late: number;
    excused: number; present: number; level: Level; history: History[] }[];
  notices: { id: number; level: Level; body: string; createdAt: string; code: string }[];
};
const LETTER: Record<Status, string> = { present: "P", late: "L", absent: "A", excused: "E" };

export default function Student() {
  const { id } = useParams();
  const { t, lang, pick } = useLang();
  const { data, error, reload } = useData<StudentRecord>(`/api/students/${id}`);
  const s = data?.student;
  const name = s ? pick(s.nameAr, s.nameEn) : t.student;
  return (
    <Shell title={name}>
      <div className="title-row">
        <div>
          <h1>{name}</h1>
          <p className="muted">{s ? <><span className="ltr num">{s.number}</span> · {s.major} · {t.record.year(s.year)}</> : " "}</p>
        </div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {!data || !s ? <Skeleton rows={6} /> : (
        <div className="grid-12">
          <div className="col-8 stack">
            {data.courses.map((c) => {
              const left = c.allowed - c.absent;
              return (
                <section key={c.courseId} className="panel" aria-labelledby={`c-${c.courseId}`}>
                  <div className="panel-head">
                    <h2 id={`c-${c.courseId}`}>{pick(c.nameAr, c.nameEn)} <span className="muted ltr">{c.code}</span></h2>
                    <LevelPill level={c.level} />
                  </div>
                  <div className="student-course-line">
                    <AllowanceTrack used={c.absent} allowed={c.allowed} />
                    <span className={left < 0 ? "track-over" : "muted"}>{left < 0 ? t.record.over(-left) : t.record.remaining(left)}</span>
                    <span className="muted num">{t.status.late} {c.late} · {t.status.excused} {c.excused}</span>
                  </div>
                  <h3 className="sub-h">{t.record.history}</h3>
                  <ol className="history">
                    {c.history.map((h) => (
                      <li key={h.sessionId} title={`${day(h.startsAt, lang, true)} · ${h.topic}`}
                        className={h.status === "absent" || h.status === "excused" ? "history-item history-flag" : "history-item"}>
                        <Mark code={h.status ? LETTER[h.status] : "-"} />
                        <span className="num">{shortDay(h.startsAt)}</span>
                        {h.status === "late" && h.markedAt && <span className="num muted small">{time(h.markedAt)}</span>}
                        {h.note && <span className="muted small">{h.note}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
          <div className="col-4 stack">
            <section className="panel" aria-labelledby="card-h">
              <h2 id="card-h">{t.record.card}</h2>
              <IdCardView student={s} />
            </section>
            <section className="panel" aria-labelledby="notices-h">
              <h2 id="notices-h">{t.record.notices}</h2>
              {data.notices.length === 0 ? <p className="empty-line">{t.record.noNotices}</p> : (
                <ul className="rows">
                  {data.notices.map((n) => (
                    <li key={n.id} className="notice-item">
                      <p className="muted small"><span className="ltr">{n.code}</span> · {day(n.createdAt, lang)}</p>
                      <p className="notice-body" dir="auto">{n.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </Shell>
  );
}
