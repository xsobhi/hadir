import { BookOpen, IdBadge, MailAlert } from "kubai-icons-react";
import { GraduationCap, Hash } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StudentActions } from "../components/students/StudentActions";
import type { Level, Status } from "../api/types";
import { useData } from "../api/useData";
import { Avatar } from "../components/Avatar";
import { IdCardView } from "../components/IdCardView";
import { Shell } from "../components/Shell";
import { PageSkeleton } from "../components/skeletons";
import { LoadError, Skeleton } from "../components/States";
import { AbsenceBar, LevelChip, StatusDot } from "../components/ui/Status";
import { Tile } from "../components/ui/Tile";
import { useLang } from "../i18n";
import { day, shortDay, time } from "../i18n/format";

type History = { sessionId: number; startsAt: string; topic: string; status: Status | null; markedAt: string | null; note: string };
type StudentRecord = {
  student: { id: number; number: string; nameAr: string; nameEn: string; major: string; year: number; gender?: string };
  courses: { courseId: number; code: string; nameAr: string; nameEn: string; allowed: number; absent: number; late: number;
    excused: number; present: number; level: Level; history: History[] }[];
  notices: { id: number; level: Level; body: string; createdAt: string; code: string }[];
};

export default function Student() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang, pick } = useLang();
  const { data, error, reload } = useData<StudentRecord>(`/api/students/${id}`);
  const s = data?.student;
  const name = s ? pick(s.nameAr, s.nameEn) : t.student;
  if (!data && !error) return <Shell title={name}><PageSkeleton kind="profile" /></Shell>;
  return (
    <Shell title={name}>
      {error ? <LoadError onRetry={reload} /> : null}
      {!data || !s ? <Skeleton rows={6} /> : (
        <>
          <section data-reveal className="profile card">
            <Avatar seed={s.number} gender={s.gender} size={96} className="profile-avatar" />
            <div className="profile-text">
              <h1>{name}</h1>
              <div className="meta-row">
                <span className="meta"><Hash aria-hidden="true" /><span className="num" dir="ltr">{s.number}</span></span>
                <span className="meta"><GraduationCap aria-hidden="true" />{s.major} · {t.record.year(s.year)}</span>
              </div>
            </div>
            <StudentActions student={s} onChange={reload} onDeleted={() => navigate("/app/students", { replace: true })} />
          </section>
          <div className="grid cols-main">
            <div className="stack">
              {data.courses.map((c) => {
                const left = c.allowed - c.absent;
                return (
                  <section key={c.courseId} data-reveal className="card" aria-labelledby={`c-${c.courseId}`}>
                    <div className="card-head">
                      <div className="card-title" data-kubai-trigger><Tile icon={BookOpen} tone="blue" size={42} /><div><h2 id={`c-${c.courseId}`}>{pick(c.nameAr, c.nameEn)}</h2><p>{c.code}</p></div></div>
                      <LevelChip level={c.level} />
                    </div>
                    <div className="course-line">
                      <AbsenceBar used={c.absent} allowed={c.allowed} />
                      <span className={left < 0 ? "chip chip-absent" : "chip chip-waiting"}>{left < 0 ? t.record.over(-left) : t.record.remaining(left)}</span>
                    </div>
                    <div className="mini-stats">
                      {(["present", "late", "absent", "excused"] as Status[]).map((k) => (
                        <span key={k} className="mini"><StatusDot status={k} />{t.status[k]}<strong className="num">{c[k]}</strong></span>
                      ))}
                    </div>
                    <h3 className="sub-h">{t.record.history}</h3>
                    <ol className="history">
                      {c.history.map((h) => (
                        <li key={h.sessionId} title={`${day(h.startsAt, lang, true)} · ${h.topic}${h.note ? ` · ${h.note}` : ""}`} className="history-item">
                          <StatusDot status={h.status} />
                          <span className="num" dir="ltr">{shortDay(h.startsAt)}</span>
                          {h.status === "late" && h.markedAt && <span className="num muted">{time(h.markedAt)}</span>}
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
            <div className="stack">
              <section data-reveal className="card" aria-labelledby="card-h">
                <div className="card-head"><div className="card-title" data-kubai-trigger><Tile icon={IdBadge} tone="violet" size={42} /><h2 id="card-h">{t.record.card}</h2></div></div>
                <IdCardView student={s} />
              </section>
              <section data-reveal className="card" aria-labelledby="notices-h">
                <div className="card-head"><div className="card-title" data-kubai-trigger><Tile icon={MailAlert} tone="amber" size={42} /><h2 id="notices-h">{t.record.notices}</h2></div></div>
                {data.notices.length === 0 ? <p className="empty">{t.record.noNotices}</p> : (
                  <ul className="rows">
                    {data.notices.map((n) => (
                      <li key={n.id} className="notice-item">
                        <p className="muted small"><span className="chip chip-code">{n.code}</span> {day(n.createdAt, lang)}</p>
                        <p className="notice-body" dir="auto">{n.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
