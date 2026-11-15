import { CircleAlert, CircleCheck, Clock3, Copy, ScanLine } from "lucide-react";
import type { ScanResult } from "../../api/types";
import { useLang } from "../../i18n";
import { time } from "../../i18n/format";
import { Avatar } from "../Avatar";

type Last = Omit<ScanResult, "state"> | { result: "closed" } | null;

/** The last scan, large enough to read from across the desk: picture, words, icon and colour together. */
export function ScanResultCard({ result }: { result: Last }) {
  const { t, pick } = useLang();
  if (!result) return <div className="result result-idle"><ScanLine aria-hidden="true" className="result-icon" /><p>{t.live.noScans}</p></div>;
  if (result.result === "closed") return <div className="result result-problem"><CircleAlert className="result-icon" aria-hidden="true" /><p className="result-head">{t.live.result.closed}</p></div>;
  const r = result as Omit<ScanResult, "state">;
  let tone = "problem", Icon = CircleAlert, head = "", sub = "";
  if (r.result === "ok") {
    tone = r.status === "late" ? "late" : "ok";
    Icon = r.status === "late" ? Clock3 : CircleCheck;
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
    <div className={`result result-${tone}`} role="status" aria-live="assertive" key={`${r.student?.id ?? r.code}-${r.markedAt ?? ""}-${r.result}`}>
      {r.student ? <Avatar seed={r.student.number} gender={r.student.gender} size={64} /> : <Icon className="result-icon" aria-hidden="true" />}
      <div className="result-text">
        <p className="result-head"><Icon aria-hidden="true" />{head}</p>
        {r.student && <p className="result-name">{pick(r.student.nameAr, r.student.nameEn)}</p>}
        <p className="result-sub num">{r.student?.number ? <span dir="ltr">{r.student.number}</span> : null}{r.student?.number && sub ? " · " : ""}{sub}</p>
      </div>
    </div>
  );
}
