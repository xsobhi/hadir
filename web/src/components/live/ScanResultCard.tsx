import { CircleAlert, CircleCheck, Clock, Copy } from "lucide-react";
import type { ScanResult } from "../../api/types";
import { useLang } from "../../i18n";
import { time } from "../../i18n/format";

/** The last scan, large enough to read from across the desk: icon + words + tone, never colour alone. */
export function ScanResultCard({ result }: { result: Omit<ScanResult, "state"> | { result: "closed" } | null }) {
  const { t, pick } = useLang();
  if (!result) return <p className="scan-card scan-idle">{t.live.noScans}</p>;
  if (result.result === "closed") return <p className="scan-card scan-problem"><CircleAlert aria-hidden="true" />{t.live.result.closed}</p>;
  const r = result as Omit<ScanResult, "state">;
  const name = r.student ? pick(r.student.nameAr, r.student.nameEn) : "";
  let tone = "problem", Icon = CircleAlert, head = "", sub = "";
  if (r.result === "ok") {
    tone = r.status === "late" ? "late" : "ok";
    Icon = r.status === "late" ? Clock : CircleCheck;
    head = r.status === "late" ? t.live.result.late : t.live.result.present;
    sub = r.markedAt ? time(r.markedAt) : "";
  } else if (r.result === "duplicate") {
    tone = "dup"; Icon = Copy; head = t.live.result.duplicate; sub = r.markedAt ? t.live.result.duplicateAt(time(r.markedAt)) : "";
  } else if (r.result === "not_enrolled") {
    head = t.live.result.not_enrolled; sub = t.live.result.not_enrolledHint;
  } else {
    head = t.live.result.unknown; sub = t.live.result.unknownHint(r.code ?? "");
  }
  return (
    <div className={`scan-card scan-${tone}`} role="status" aria-live="assertive">
      <Icon aria-hidden="true" className="scan-icon" />
      <div className="scan-text">
        <p className="scan-head">{head}{name && <span className="scan-name">{name}</span>}</p>
        <p className="scan-sub num">{r.student?.number ? <span className="ltr">{r.student.number}</span> : null}{r.student?.number && sub ? " · " : ""}{sub}</p>
      </div>
    </div>
  );
}
