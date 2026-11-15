import { useLang } from "../i18n";
import { pct } from "../i18n/format";
import { useWidth } from "./useWidth";

type Week = { week: number; rate: number | null };
type Props = { weeks: Week[]; totalWeeks: number; currentWeek: number | null; height?: number };

/** Columns per week of term on a 0-100% scale. The latest recorded week takes the data hue; weeks still
 * to come are empty slots on the baseline. In Arabic the term runs from right to left, like the register. */
export function WeeklyChart({ weeks, totalWeeks, currentWeek, height = 180 }: Props) {
  const { lang, t } = useLang();
  const rtl = lang === "ar";
  const { ref, width: W } = useWidth<HTMLDivElement>();
  const H = height, padTop = 10, padBottom = 26, axis = 40;
  const plotW = W - axis - 8, plotH = H - padTop - padBottom;
  const slot = plotW / totalWeeks, bar = Math.min(22, slot * 0.62);
  const byWeek = new Map(weeks.map((w) => [w.week, w.rate]));
  const latest = weeks.length ? weeks[weeks.length - 1].week : null;
  const xOf = (week: number) => {
    const i = week - 1;
    const fromStart = axis + i * slot + (slot - bar) / 2;
    return rtl ? W - fromStart - bar : fromStart;
  };
  const yOf = (rate: number) => padTop + plotH * (1 - rate);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelled = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter((w) => (w - 1) % 3 === 0);
  const tickX = rtl ? W - 4 : 4;
  return (
    <div ref={ref}>
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
      aria-label={weeks.map((w) => `${t.week(w.week, totalWeeks)}: ${pct(w.rate)}`).join(", ")}>
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={rtl ? 8 : axis} x2={rtl ? W - axis : W - 8} y1={yOf(tk)} y2={yOf(tk)}
            className={tk === 0 ? "chart-base" : "chart-grid"} />
          <text x={tickX} y={yOf(tk) + 4} className="chart-tick" textAnchor={rtl ? "end" : "start"}>{pct(tk)}</text>
        </g>
      ))}
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const rate = byWeek.get(week);
        if (rate == null) return null;
        const isLatest = week === latest;
        return (
          <rect key={week} x={xOf(week)} y={yOf(rate)} width={bar} height={plotH * rate}
            className={isLatest ? "bar bar-data" : "bar"}>
            <title>{`${t.week(week, totalWeeks)} · ${pct(rate)}`}</title>
          </rect>
        );
      })}
      {currentWeek && currentWeek <= totalWeeks && (
        <line x1={xOf(currentWeek) + bar / 2} x2={xOf(currentWeek) + bar / 2} y1={padTop} y2={padTop + plotH}
          className="chart-today" />
      )}
      {labelled.map((week) => (
        <text key={week} x={xOf(week) + bar / 2} y={H - 6} className="chart-tick" textAnchor="middle">{week}</text>
      ))}
    </svg>
    </div>
  );
}
