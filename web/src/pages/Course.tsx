import { Download, IdCard } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { CourseDetail } from "../api/types";
import { useData } from "../api/useData";
import { CourseForm } from "../components/course/CourseForm";
import { Register } from "../components/course/Register";
import { RosterTab } from "../components/course/RosterTab";
import { SessionBars } from "../components/course/SessionBars";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { useLang } from "../i18n";
import { day, pct, time } from "../i18n/format";

type Tab = "register" | "roster" | "settings";

export default function Course() {
  const { id } = useParams();
  const { t, lang, pick } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "register";
  const { data, error, reload } = useData<CourseDetail>(`/api/courses/${id}`);
  const start = async () => {
    const sid = data?.openSessionId ?? (await api.post<{ id: number }>(`/api/courses/${id}/sessions`, {})).id;
    navigate(`/app/live/${sid}`);
  };
  const remove = async () => {
    if (!data || !window.confirm(t.course.deleteConfirm(data.course.code))) return;
    await api.del(`/api/courses/${id}`);
    window.location.assign("/app");
  };
  const c = data?.course;
  const s = data?.summary;
  const title = c ? pick(c.nameAr, c.nameEn) : t.nav.courses;
  const schedule = c ? `${c.days.map((d) => t.weekdays[d]).join("، ")} · ${c.startTime} · ${t.room} ${c.room}` : "";
  const atRisk = s ? s.levels.watch + s.levels.warning + s.levels.over : 0;
  return (
    <Shell title={title}>
      <div className="title-row">
        <div>
          <h1>{title}</h1>
          <p className="muted">{c ? <><span className="ltr">{c.code}-{c.section}</span> · {schedule}</> : " "}</p>
        </div>
        {c && (
          <div className="actions">
            <a className="btn" href={`/api/courses/${c.id}/students/export.csv`}><Download aria-hidden="true" />{t.course.export}</a>
            <Link className="btn" to={`/app/cards/${c.id}`}><IdCard aria-hidden="true" />{t.overview.printCards}</Link>
            <button type="button" className="btn btn-primary" onClick={() => void start()}>
              {data?.openSessionId ? t.overview.resume : t.overview.startNow}
            </button>
          </div>
        )}
      </div>
      {data?.next && !data.openSessionId && (
        <p className="finding small-finding">
          {t.overview.nextClass}: {data.next.isToday ? t.today : day(data.next.startsAt, lang, true)} <span className="num">{time(data.next.startsAt)}</span>
        </p>
      )}
      {error ? <LoadError onRetry={reload} /> : null}
      <div className="tabs page-tabs" role="tablist">
        {(["register", "roster", "settings"] as Tab[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab"
            onClick={() => setParams(k === "register" ? {} : { tab: k }, { replace: true })}>{t.course[k]}</button>
        ))}
      </div>
      {!data || !c || !s ? <Skeleton rows={8} /> : tab === "roster" ? <RosterTab detail={data} onChange={reload} /> : tab === "settings" ? (
        <div className="grid-12">
          <section className="panel col-8" aria-labelledby="set-h">
            <h2 id="set-h">{t.course.settingsTitle}</h2>
            <CourseForm initial={c} submitLabel={t.save} onSubmit={async (v) => { await api.patch(`/api/courses/${c.id}`, v); await reload(); }} />
          </section>
          <section className="panel col-4 danger-zone">
            <h2>{t.course.deleteCourse}</h2>
            <p className="muted">{t.course.deleteConfirm(c.code)}</p>
            <button type="button" className="btn btn-danger" onClick={() => void remove()}>{t.course.deleteCourse}</button>
          </section>
        </div>
      ) : (
        <div className="stack">
          <div className="grid-12">
            <dl className="kpis kpis-4 col-7 kpi-panel">
              <div><dt>{t.course.rate}</dt><dd className="kpi-value num">{pct(s.rate)}</dd></div>
              <div><dt>{t.course.classesHeld}</dt><dd className="kpi-value num">{s.held}<span className="kpi-unit"> / {s.planned}</span></dd></div>
              <div><dt>{t.course.allowance}</dt><dd className="kpi-value num">{s.allowed}</dd><dd className="kpi-sub">{t.course.allowanceNote(c.absenceLimitPct, s.planned)}</dd></div>
              <div><dt>{t.course.atRisk}</dt><dd className="kpi-value num">{atRisk}</dd><dd className="kpi-sub">{s.levels.over} {t.levels.over}</dd></div>
            </dl>
            <section className="panel col-5 bars-panel" aria-label={t.course.perClass}>
              <h2 className="sr-only">{t.course.perClass}</h2>
              <SessionBars sessions={data.sessions} />
            </section>
          </div>
          <Register detail={data} />
        </div>
      )}
    </Shell>
  );
}
