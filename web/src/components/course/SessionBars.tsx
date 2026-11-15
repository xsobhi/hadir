import type { SessionRate } from "../../api/types";
import { useLang } from "../../i18n";
import { day, pct, shortDay } from "../../i18n/format";
import { useWidth } from "../useWidth";

/** Attendance per class on a 0-100% scale; the latest class in the data hue. Mirrors in Arabic. */
export function SessionBars({ sessions }: { sessions: SessionRate[] }) {
  const { lang } = useLang();
  const rtl = lang === "ar";
  const { ref, width: W } = useWidth<HTMLDivElement>();
  const H = 170, top = 8, bottom = 24, axis = 40;
  const plotW = W - axis - 8, plotH = H - top - bottom;
  const n = Math.max(sessions.length, 1);
  const slot = plotW / n, bar = Math.min(16, slot * 0.6);
  const x = (i: number) => { const v = axis + i * slot + (slot - bar) / 2; return rtl ? W - v - bar : v; };
  const y = (r: number) => top + plotH * (1 - r);
  const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(W / 90))));
  return (
    <div ref={ref}>
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img"
      aria-label={sessions.map((s) => `${day(s.startsAt, lang)}: ${pct(s.rate)}`).join(", ")}>
      {[0, 0.25, 0.5, 0.75, 1].map((tk) => (
        <g key={tk}>
          <line x1={rtl ? 8 : axis} x2={rtl ? W - axis : W - 8} y1={y(tk)} y2={y(tk)} className={tk === 0 ? "chart-base" : "chart-grid"} />
          <text x={rtl ? W - 4 : 4} y={y(tk) + 4} className="chart-tick" textAnchor={rtl ? "end" : "start"}>{pct(tk)}</text>
        </g>
      ))}
      {sessions.map((s, i) => (
        <rect key={s.id} x={x(i)} y={y(s.rate)} width={bar} height={plotH * s.rate}
          className={i === sessions.length - 1 ? "bar bar-data" : "bar"}>
          <title>{`${day(s.startsAt, lang)} · ${s.topic} · ${pct(s.rate)}`}</title>
        </rect>
      ))}
      {sessions.map((s, i) => (i % step === 0 ? (
        <text key={s.id} x={x(i) + bar / 2} y={H - 6} className="chart-tick" textAnchor="middle">{shortDay(s.startsAt)}</text>
      ) : null))}
    </svg>
    </div>
  );
}
