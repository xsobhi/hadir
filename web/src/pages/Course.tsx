import { CalendarCheck, ChartBar, ShieldAlert, TriangleAlert } from "kubai-icons-react";
import { ClipboardCheck, Settings, Users } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { CourseDetail } from "../api/types";
import { useData } from "../api/useData";
import { CourseForm } from "../components/course/CourseForm";
import { CourseHeader } from "../components/course/CourseHeader";
import { DeleteCourseButton } from "../components/course/DeleteCourseButton";
import { Register } from "../components/course/Register";
import { RosterTab } from "../components/course/RosterTab";
import { SessionBars } from "../components/course/SessionBars";
import { Shell } from "../components/Shell";
import { PageSkeleton } from "../components/skeletons";
import { LoadError, Skeleton } from "../components/States";
import { StatCard } from "../components/ui/StatCard";
import { useLang } from "../i18n";
import { pct } from "../i18n/format";

type Tab = "register" | "roster" | "settings";
const TAB_ICON = { register: ClipboardCheck, roster: Users, settings: Settings };

export default function Course() {
  const { id } = useParams();
  const { t, pick } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "register";
  const { data, error, reload } = useData<CourseDetail>(`/api/courses/${id}`);
  const start = async () => {
    const sid = data?.openSessionId ?? (await api.post<{ id: number }>(`/api/courses/${id}/sessions`, {})).id;
    navigate(`/app/live/${sid}`);
  };
  const c = data?.course;
  const s = data?.summary;
  const atRisk = s ? s.levels.watch + s.levels.warning + s.levels.over : 0;
  if (!data && !error) return <Shell title={c ? pick(c.nameAr, c.nameEn) : t.nav.courses}><PageSkeleton kind="course" /></Shell>;
  return (
    <Shell title={c ? pick(c.nameAr, c.nameEn) : t.nav.courses}>
      {error ? <LoadError onRetry={reload} /> : null}
      {data ? <CourseHeader data={data} onStart={() => void start()} /> : <Skeleton rows={2} height={48} />}
      <div className="tabs page-tabs" role="tablist">
        {(["register", "roster", "settings"] as Tab[]).map((k) => {
          const Icon = TAB_ICON[k];
          return (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab"
              onClick={() => setParams(k === "register" ? {} : { tab: k }, { replace: true })}>
              <Icon aria-hidden="true" />{t.course[k]}
              {k === "roster" && data ? <span className="count num">{data.students.length}</span> : null}
            </button>
          );
        })}
      </div>
      {!data || !c || !s ? <Skeleton rows={8} /> : tab === "roster" ? <RosterTab detail={data} onChange={reload} /> : tab === "settings" ? (
        <div className="grid cols-main">
          <section data-reveal className="card" aria-labelledby="set-h">
            <div className="card-head"><h2 id="set-h">{t.course.settingsTitle}</h2></div>
            <CourseForm key={c.id} initial={c} submitLabel={t.save} onSubmit={async (v) => {
              await api.patch(`/api/courses/${c.id}`, v); await reload();
              window.dispatchEvent(new Event("hadir:courses-changed"));
            }} />
          </section>
          <section data-reveal className="card danger-zone">
            <h2>{t.course.deleteCourse}</h2>
            <p className="muted">{t.course.deleteConfirm(c.code)}</p>
            <DeleteCourseButton course={c} />
          </section>
        </div>
      ) : (
        <div className="stack">
          <div className="stats">
            <StatCard icon={ChartBar} tone="brand" label={t.course.rate} value={pct(s.rate)} hint={t.overview.statRateHint} />
            <StatCard icon={CalendarCheck} tone="blue" label={t.course.classesHeld} value={<>{s.held}<small> / {s.planned}</small></>} hint={t.overview.statHeldHint(s.planned)} />
            <StatCard icon={ShieldAlert} tone="violet" label={t.course.allowance} value={s.allowed} hint={t.course.allowanceNote(c.absenceLimitPct, s.planned)} />
            <StatCard icon={TriangleAlert} tone="amber" label={t.course.atRisk} value={atRisk} hint={t.overview.statRiskHint(s.levels.over)} />
          </div>
          <section data-reveal className="card" aria-labelledby="bars-h">
            <div className="card-head"><h2 id="bars-h">{t.course.perClass}</h2></div>
            <SessionBars sessions={data.sessions} />
          </section>
          <Register detail={data} />
        </div>
      )}
    </Shell>
  );
}
