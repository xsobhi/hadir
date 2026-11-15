import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { CourseItem, Overview as Data } from "../api/types";
import { useData } from "../api/useData";
import { AllowanceTrack } from "../components/AllowanceTrack";
import { LevelPill } from "../components/LevelPill";
import { Person } from "../components/Person";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { WeeklyChart } from "../components/WeeklyChart";
import { useLang } from "../i18n";
import { day, pct, time } from "../i18n/format";

function finding(data: Data, t: ReturnType<typeof useLang>["t"]): string {
  const over = data.atRisk.filter((s) => s.level === "over");
  if (over.length) {
    const byCourse = new Map<string, number>();
    over.forEach((s) => byCourse.set(s.courseCode, (byCourse.get(s.courseCode) ?? 0) + 1));
    const [code, n] = [...byCourse.entries()].sort((a, b) => b[1] - a[1])[0];
    return t.overview.finding(n, code);
  }
  const warn = data.atRisk.filter((s) => s.level === "warning").length;
  return warn ? t.overview.findingWarn(warn) : t.overview.findingCalm;
}

export default function Overview() {
  const { t, lang, pick } = useLang();
  const { data, error, reload } = useData<Data>("/api/overview");
  const navigate = useNavigate();
  const start = async (c: CourseItem) => {
    const id = c.openSessionId ?? (await api.post<{ id: number }>(`/api/courses/${c.id}/sessions`, {})).id;
    navigate(`/app/live/${id}`);
  };
  const subline = data
    ? [day(data.today, lang, true), data.termWeek && data.termWeeks ? t.week(Math.min(data.termWeek, data.termWeeks), data.termWeeks) : null]
        .filter(Boolean).join(" · ")
    : "";
  const next = data?.next;
  return (
    <Shell title={t.overview.title}>
      <div className="title-row">
        <div>
          <h1>{t.overview.title}</h1>
          <p className="muted">{subline || " "}</p>
        </div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {data && <p className="finding">{finding(data, t)}</p>}
      <div className="grid-12 overview-grid">
        <div className="col-7 stack">
          <section className="panel next-class" aria-labelledby="next-h">
            <h2 id="next-h">{t.overview.nextClass}</h2>
            {!data ? <Skeleton rows={3} /> : !next ? (
              <div className="empty-row"><span>{t.overview.noClasses}</span><Link className="btn" to="/app/courses/new">{t.overview.addCourse}</Link></div>
            ) : (
              <>
                <p className="next-name">{pick(next.nameAr, next.nameEn)} <span className="muted ltr">{next.code}-{next.section}</span></p>
                <p className="next-when">
                  <strong>{next.next?.isToday ? t.today : day(next.next!.startsAt, lang, true)}</strong>
                  <span className="num">{time(next.next!.startsAt)}</span>
                  <span>{t.room} {next.room}</span>
                </p>
                <dl className="kpis kpis-3">
                  <div><dt>{t.overview.enrolled}</dt><dd className="kpi-value num">{next.summary.enrolled}</dd></div>
                  <div><dt>{t.overview.attended}</dt><dd className="kpi-value num">{pct(next.summary.rate)}</dd></div>
                  <div><dt>{t.course.allowance}</dt><dd className="kpi-value num">{next.summary.allowed}</dd></div>
                </dl>
                <div className="actions">
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => void start(next)}>
                    {next.openSessionId ? t.overview.resume : t.overview.startNow}
                  </button>
                  <Link className="btn btn-secondary btn-lg" to={`/app/cards/${next.id}`}>{t.overview.printCards}</Link>
                </div>
              </>
            )}
          </section>
          <section className="panel" aria-labelledby="risk-h">
            <div className="panel-head">
              <h2 id="risk-h">{t.overview.nearLimit}</h2>
              {data && data.atRisk.length > 6 && <Link className="link small" to="/app/students?level=watch">{t.viewAll} ({data.atRisk.length})</Link>}
            </div>
            {!data ? <Skeleton rows={6} /> : data.atRisk.length === 0 ? <p className="empty-line">{t.overview.nearLimitNone}</p> : (
              <ul className="rows">
                {data.atRisk.slice(0, 6).map((s) => (
                  <li key={`${s.courseId}-${s.id}`}>
                    <Link className="row risk-row" to={`/app/students/${s.id}`}>
                      <Person nameAr={s.nameAr} nameEn={s.nameEn} number={s.number} />
                      <span className="row-code ltr">{s.courseCode}</span>
                      <AllowanceTrack used={s.absent} allowed={s.allowed} />
                      <LevelPill level={s.level} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="col-5 stack">
          <section className="panel" aria-labelledby="courses-h">
            <h2 id="courses-h">{t.overview.yourCourses}</h2>
            {!data ? <Skeleton rows={3} height={56} /> : (
              <ul className="rows">
                {data.courses.map((c) => (
                  <li key={c.id}>
                    <Link className="row course-row" to={`/app/courses/${c.id}`}>
                      <span className="course-row-name">
                        <span>{pick(c.nameAr, c.nameEn)}</span>
                        <span className="muted small">{c.code} · {t.overview.held(c.summary.held, c.summary.planned)}</span>
                      </span>
                      <span className="course-row-rate num">{pct(c.summary.rate)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="panel" aria-labelledby="week-h">
            <div className="panel-head"><h2 id="week-h">{t.overview.byWeek}</h2></div>
            <p className="muted small chart-note">{t.overview.byWeekNote}</p>
            {data ? <WeeklyChart weeks={data.weekly} totalWeeks={data.termWeeks ?? 16} currentWeek={data.termWeek} /> : <Skeleton rows={1} height={196} />}
          </section>
        </div>
      </div>
    </Shell>
  );
}
