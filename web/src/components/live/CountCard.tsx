import type { LiveState } from "../../api/types";
import { useLang } from "../../i18n";

/** How many are here: a ring that fills as students arrive, and the split by status beside it. */
export function CountCard({ state }: { state: LiveState }) {
  const { t } = useLang();
  const here = state.counts.present + state.counts.late;
  const total = Math.max(state.enrolled, 1);
  const r = 52, c = 2 * Math.PI * r;
  const presentLen = (state.counts.present / total) * c, lateLen = (state.counts.late / total) * c;
  const closed = state.session.status === "closed";
  const items = [
    ["present", t.status.present, state.counts.present],
    ["late", t.status.late, state.counts.late],
    [closed ? "absent" : "waiting", closed ? t.status.absent : t.live.waiting, closed ? state.counts.absent : state.waiting],
    ["excused", t.status.excused, state.counts.excused],
  ] as const;
  return (
    <section data-reveal className="card count-card" aria-label={`${here} / ${state.enrolled}`}>
      <svg className="ring" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={r} className="ring-track" />
        <circle cx="64" cy="64" r={r} className="ring-present" strokeDasharray={`${presentLen} ${c}`} />
        <circle cx="64" cy="64" r={r} className="ring-late" strokeDasharray={`${lateLen} ${c}`} strokeDashoffset={-presentLen} />
      </svg>
      <div className="ring-center"><span className="num">{here}</span><small className="num">/ {state.enrolled}</small></div>
      <div className="count-text">
        <p className="count-title">{t.live.present} <span className="muted">{t.live.ofEnrolled(state.enrolled)}</span></p>
        <ul className="count-list">
          {items.map(([key, label, n]) => (
            <li key={key} className={`count-item ci-${key}`}><span className="ci-dot" />{label}<strong className="num">{n}</strong></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
