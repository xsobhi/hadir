import { FlagCheck } from "kubai-icons-react";
import { ArrowRight, Clock3, PlayCircle, Trash2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { LiveState, ScanResult, Status } from "../api/types";
import { useData } from "../api/useData";
import { CountCard } from "../components/live/CountCard";
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
  const [sound, setSound] = useState(true);
  const busy = useRef(false);
  useEffect(() => {
    setSound(localStorage.getItem("hadir.sound") !== "off");
  }, []);
  const toggleSound = () => {
    localStorage.setItem("hadir.sound", sound ? "off" : "on");
    setSound(!sound);
  };

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
  const title = data ? pick(data.course.nameAr, data.course.nameEn) : t.live.title;
  return (
    <Shell title={title}>
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {data && (
            <div className="meta-row">
              <span className={closed ? "chip chip-waiting" : "chip chip-present live-chip"}>{closed ? t.live.closedTitle : t.live.title}</span>
              <span className="meta"><PlayCircle aria-hidden="true" />{t.live.started} <span className="num">{time(data.session.startsAt)}</span></span>
              <span className="meta"><Clock3 aria-hidden="true" />{t.live.lateAfter(lateLine(data.session.startsAt, data.course.lateAfterMin))}</span>
            </div>
          )}
        </div>
        <div className="actions">
          <button type="button" className="btn icon-btn" onClick={toggleSound} aria-pressed={sound} aria-label={t.live.sound} title={t.live.sound}>
            {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>
          {data && !closed && <button type="button" className="btn btn-ghost btn-danger" onClick={() => void discard()}><Trash2 aria-hidden="true" />{t.live.discard}</button>}
          {data && !closed && <button type="button" className="btn btn-primary" onClick={() => void close()} data-kubai-trigger><FlagCheck size={22} color="#ffffff" trigger="parent" />{t.live.finish}</button>}
          {data && closed && <Link className="btn btn-primary" to={`/app/courses/${data.course.id}`}>{t.live.backToCourse}<ArrowRight aria-hidden="true" className="flip-rtl" /></Link>}
        </div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {!data ? <Skeleton rows={6} height={60} /> : (
        <div className="grid live-grid">
          <div className="stack">
            {closed ? (
              <section className="card closed-card"><h2>{t.live.closedTitle}</h2><p className="num">{t.live.closedSummary(data.counts.present, data.counts.late, data.counts.absent)}</p></section>
            ) : <ScanPanel onCode={(c) => void onCode(c)} disabled={closed} />}
          </div>
          <div className="stack">
            {!closed && <ScanResultCard result={last} />}
            <CountCard state={data} />
            <RosterPanel state={data} onMark={(sid, s) => void mark(sid, s)} />
          </div>
        </div>
      )}
    </Shell>
  );
}
