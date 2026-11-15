import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { LiveState, ScanResult, Status } from "../api/types";
import { useData } from "../api/useData";
import { RosterPanel } from "../components/live/RosterPanel";
import { ScanPanel } from "../components/live/ScanPanel";
import { ScanResultCard } from "../components/live/ScanResultCard";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { useLang } from "../i18n";
import { time } from "../i18n/format";
import { feedback } from "../scanner/feedback";

type Last = Omit<ScanResult, "state"> | { result: "closed" } | null;

function lateLine(startsAt: string, minutes: number): string {
  const [h, m] = time(startsAt).split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function Live() {
  const { id } = useParams();
  const { t, pick } = useLang();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useData<LiveState>(`/api/sessions/${id}`);
  const [last, setLast] = useState<Last>(null);
  const [sound, setSound] = useState(() => localStorage.getItem("hadir.sound") !== "off");
  const busy = useRef(false);
  useEffect(() => {
    localStorage.setItem("hadir.sound", sound ? "on" : "off");
  }, [sound]);

  const onCode = useCallback(async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const r = await api.post<ScanResult>(`/api/sessions/${id}/scan`, { code });
      const { state, ...rest } = r;
      setData(state);
      setLast(rest);
      feedback(r.result === "ok" ? (r.status === "late" ? "late" : "present") : "problem", sound);
    } catch (e) {
      if (e instanceof ApiError && e.code === "session_closed") setLast({ result: "closed" });
      feedback("problem", sound);
    } finally {
      busy.current = false;
    }
  }, [id, setData, sound]);

  const mark = async (studentId: number, status: Status | null) => {
    setData(await api.post<LiveState>(`/api/sessions/${id}/mark`, { studentId, status }));
  };
  const close = async () => {
    if (!data || !window.confirm(t.live.finishConfirm(data.waiting))) return;
    setData(await api.post<LiveState>(`/api/sessions/${id}/close`));
  };
  const discard = async () => {
    if (!data || !window.confirm(t.live.discardConfirm)) return;
    await api.del(`/api/sessions/${id}`);
    navigate(`/app/courses/${data.course.id}`);
  };

  const closed = data?.session.status === "closed";
  const here = data ? data.counts.present + data.counts.late : 0;
  const title = data ? pick(data.course.nameAr, data.course.nameEn) : t.live.title;
  return (
    <Shell title={title}>
      <div className="title-row">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            {data ? <>{closed ? t.live.closedTitle : t.live.title} · <span className="ltr">{data.course.code}</span> · {t.live.started} <span className="num">{time(data.session.startsAt)}</span> · {t.live.lateAfter(lateLine(data.session.startsAt, data.course.lateAfterMin))}</> : " "}
          </p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => setSound((s) => !s)} aria-pressed={sound} aria-label={t.live.sound}>
            {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>
          {data && !closed && <button type="button" className="btn btn-ghost btn-danger" onClick={() => void discard()}>{t.live.discard}</button>}
          {data && !closed && <button type="button" className="btn btn-primary" onClick={() => void close()}>{t.live.finish}</button>}
          {data && closed && <Link className="btn btn-primary" to={`/app/courses/${data.course.id}`}>{t.live.backToCourse}</Link>}
        </div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {!data ? <Skeleton rows={6} height={56} /> : (
        <div className="grid-12 live-grid">
          <div className="col-5 stack">
            {closed ? (
              <section className="panel closed-panel">
                <h2>{t.live.closedTitle}</h2>
                <p className="closed-summary num">{t.live.closedSummary(data.counts.present, data.counts.late, data.counts.absent)}</p>
              </section>
            ) : <ScanPanel onCode={(c) => void onCode(c)} disabled={closed} />}
            {!closed && <ScanResultCard result={last} />}
          </div>
          <div className="col-7 stack">
            <section className="panel count-panel" aria-label={t.live.present}>
              <p className="count-line">
                <span className="count-big num">{here}</span>
                <span className="count-of">{t.live.present} <span className="num">{t.live.ofEnrolled(data.enrolled)}</span></span>
              </p>
              <div className="count-bar" role="img" aria-label={`${here} / ${data.enrolled}`}>
                <span style={{ width: `${(data.counts.present / Math.max(data.enrolled, 1)) * 100}%` }} className="seg seg-present" />
                <span style={{ width: `${(data.counts.late / Math.max(data.enrolled, 1)) * 100}%` }} className="seg seg-late" />
              </div>
              <dl className="count-legend">
                <div><dt><span className="dot dot-present" />{t.status.present}</dt><dd className="num">{data.counts.present}</dd></div>
                <div><dt><span className="dot dot-late" />{t.status.late}</dt><dd className="num">{data.counts.late}</dd></div>
                <div><dt><span className="dot dot-wait" />{closed ? t.status.absent : t.live.waiting}</dt><dd className="num">{closed ? data.counts.absent : data.waiting}</dd></div>
                {data.counts.excused > 0 && <div><dt><span className="dot dot-exc" />{t.status.excused}</dt><dd className="num">{data.counts.excused}</dd></div>}
              </dl>
            </section>
            <RosterPanel state={data} onMark={(sid, s) => void mark(sid, s)} />
          </div>
        </div>
      )}
    </Shell>
  );
}
