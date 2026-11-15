import { useLang } from "../i18n";

/** The absence allowance as a track: one cell per allowed absence, used cells in ink, overrun past the end in red. */
export function AllowanceTrack({ used, allowed, compact = false }: { used: number; allowed: number; compact?: boolean }) {
  const { t } = useLang();
  const over = Math.max(used - allowed, 0);
  const cells = Array.from({ length: allowed }, (_, i) => i < used);
  const label = `${used} ${t.of} ${allowed} ${t.absences}`;
  return (
    <span className={`track${compact ? " track-compact" : ""}`} role="img" aria-label={label}>
      <span className="track-cells">
        {cells.map((filled, i) => <span key={i} className={filled ? "cell cell-used" : "cell"} />)}
        {Array.from({ length: Math.min(over, 6) }, (_, i) => <span key={`o${i}`} className="cell cell-over" />)}
      </span>
      <span className={`track-figure num${over ? " track-over" : ""}`}>
        {used}<span className="muted">/{allowed}</span>
      </span>
    </span>
  );
}
