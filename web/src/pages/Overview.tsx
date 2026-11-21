import { CalendarCheck, ChartBar, TriangleAlert, Users } from "kubai-icons-react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Overview as Data } from "../api/types";
import { useData } from "../api/useData";
import { EmptyWorkspace } from "../components/overview/EmptyWorkspace";
import { NextClassHero } from "../components/overview/NextClassHero";
import { Person } from "../components/Person";
import { Shell } from "../components/Shell";
import { PageSkeleton } from "../components/skeletons";
import { LoadError, Skeleton } from "../components/States";
import { AbsenceBar, LevelChip } from "../components/ui/Status";
import { StatCard } from "../components/ui/StatCard";
import { Tile } from "../components/ui/Tile";
import { WeeklyChart } from "../components/WeeklyChart";
import { RateRing } from "../motion/RateRing";
import { useAuth } from "../auth/AuthContext";
import { useLang } from "../i18n";
import { day, pct } from "../i18n/format";

export default function Overview() {
  const { t, lang, pick } = useLang();
  const { user } = useAuth();
  const { data, error, reload } = useData<Data>("/api/overview");
  const marked = data?.weekly.reduce((n, w) => n + w.marked, 0) ?? 0;
  const attended = data?.weekly.reduce((n, w) => n + w.attended, 0) ?? 0;
  const held = data?.courses.reduce((n, c) => n + c.summary.held, 0) ?? 0;
  const planned = data?.courses.reduce((n, c) => n + c.summary.planned, 0) ?? 0;
  const risky = data?.atRisk.filter((s) => s.level === "warning" || s.level === "over") ?? [];
  const over = data?.atRisk.filter((s) => s.level === "over").length ?? 0;
  const subline = data ? [day(data.today, lang, true), data.termWeek && data.termWeeks ? t.week(Math.min(data.termWeek, data.termWeeks), data.termWeeks) : ""].filter(Boolean).join(" · ") : "";
  if (!data && !error) return <Shell title={t.overview.title}><PageSkeleton kind="overview" /></Shell>;
  return (
    <Shell title={t.overview.title}>
      <div data-reveal className="page-head">
        <div>
          <h1>{user ? t.overview.greeting(user.name) : t.overview.title}</h1>
          <p className="lead">{subline || " "}</p>
        </div>
        <Link className="btn btn-primary" to="/app/courses/new"><Plus aria-hidden="true" />{t.overview.addCourse}</Link>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {data && data.courses.length === 0 ? <EmptyWorkspace /> : <>
      {!data ? <Skeleton rows={1} height={220} /> : <NextClassHero next={data.next} />}
      <div className="stats">
        <StatCard icon={Users} tone="violet" label={t.overview.statStudents} value={data?.studentCount ?? "—"} hint={data && t.overview.statStudentsHint(data.courses.length)} />
        <StatCard icon={ChartBar} tone="brand" label={t.overview.statRate} value={marked ? pct(attended / marked) : "—"} hint={t.overview.statRateHint} />
        <StatCard icon={TriangleAlert} tone="amber" label={t.overview.statRisk} value={data ? risky.length : "—"} hint={data && t.overview.statRiskHint(over)} />
        <StatCard icon={CalendarCheck} tone="blue" label={t.overview.statHeld} value={data ? held : "—"} hint={data && t.overview.statHeldHint(planned)} />
      </div>
      <div className="grid cols-main">
        <section data-reveal className="card" aria-labelledby="risk-h">
          <div className="card-head">
            <div className="card-title" data-kubai-trigger><Tile icon={TriangleAlert} tone="amber" size={40} /><div><h2 id="risk-h">{t.overview.nearLimit}</h2><p>{t.overview.nearLimitNote}</p></div></div>
            {data && data.atRisk.length > 7 && <Link className="btn btn-soft" to="/app/students?level=watch">{t.viewAll} ({data.atRisk.length})</Link>}
          </div>
          {!data ? <Skeleton rows={6} height={56} /> : data.atRisk.length === 0 ? <p className="empty">{t.overview.nearLimitNone}</p> : (
            <ul className="rows">
              {data.atRisk.slice(0, 7).map((s) => (
                <li key={`${s.courseId}-${s.id}`} data-reveal>
                  <Link className="row risk-row" to={`/app/students/${s.id}`}>
                    <Person nameAr={s.nameAr} nameEn={s.nameEn} number={s.number} gender={s.gender} />
                    <span className="chip chip-code">{s.courseCode}</span>
                    <AbsenceBar used={s.absent} allowed={s.allowed} />
                    <LevelChip level={s.level} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="stack">
          <section data-reveal className="card" aria-labelledby="courses-h">
            <div className="card-head"><h2 id="courses-h">{t.overview.yourCourses}</h2></div>
            {!data ? <Skeleton rows={3} height={64} /> : (
              <ul className="rows">
                {data.courses.map((c) => (
                  <li key={c.id} data-reveal>
                    <Link className="row course-row" to={`/app/courses/${c.id}`}>
                      <span className="course-row-name">
                        <strong>{pick(c.nameAr, c.nameEn)}</strong>
                        <span className="muted small">{c.code} · {t.overview.held(c.summary.held, c.summary.planned)}</span>
                      </span>
                      <RateRing rate={c.summary.rate} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section data-reveal className="card" aria-labelledby="week-h">
            <div className="card-head"><div className="card-title"><div><h2 id="week-h">{t.overview.byWeek}</h2><p>{t.overview.byWeekNote}</p></div></div></div>
            {data ? <WeeklyChart weeks={data.weekly} totalWeeks={data.termWeeks ?? 16} currentWeek={data.termWeek} height={190} /> : <Skeleton rows={1} height={190} />}
          </section>
        </div>
      </div>
      </>}
    </Shell>
  );
}
