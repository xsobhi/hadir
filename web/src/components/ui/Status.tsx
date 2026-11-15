import { Check, Clock3, FileText, Hourglass, X } from "lucide-react";
import type { Level, Status } from "../../api/types";
import { useLang } from "../../i18n";

const ICON = { present: Check, late: Clock3, absent: X, excused: FileText, waiting: Hourglass };

/** A status as icon + word, in its own colour. Never colour alone. */
export function StatusChip({ status, time }: { status: Status | null; time?: string | null }) {
  const { t } = useLang();
  const key = status ?? "waiting";
  const Icon = ICON[key];
  return (
    <span className={`chip chip-${key}`}>
      <Icon aria-hidden="true" strokeWidth={2.4} />
      {t.status[key]}
      {time ? <span className="chip-time num">{time}</span> : null}
    </span>
  );
}

/** The register's cell: a small round badge with the status icon. */
export function StatusDot({ status, title }: { status: Status | null; title?: string }) {
  if (!status) return <span className="dot-cell dot-none" title={title} />;
  const Icon = ICON[status];
  return <span className={`dot-cell dot-${status}`} title={title}><Icon aria-hidden="true" strokeWidth={3} /></span>;
}

const LEVEL_TONE: Record<Level, string> = { ok: "ok", watch: "excused", warning: "late", over: "absent" };

export function LevelChip({ level }: { level: Level }) {
  const { t } = useLang();
  return <span className={`chip chip-${LEVEL_TONE[level]} chip-level`}>{t.levels[level]}</span>;
}

/** Absences against the allowance as a rounded bar: grey when fine, then blue, amber and red as it fills. */
export function AbsenceBar({ used, allowed }: { used: number; allowed: number }) {
  const { t } = useLang();
  const ratio = allowed ? used / allowed : used ? 2 : 0;
  const tone = ratio > 1 ? "absent" : ratio >= 0.75 ? "late" : ratio >= 0.5 ? "excused" : "ok";
  return (
    <span className={`absence absence-${tone}`} role="img" aria-label={`${used} ${t.of} ${allowed} ${t.absences}`}>
      <span className="absence-track"><span style={{ width: `${Math.min(ratio, 1) * 100}%` }} /></span>
      <span className="absence-figure num">{used}<span>/{allowed}</span></span>
    </span>
  );
}
