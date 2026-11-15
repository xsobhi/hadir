import { useMemo, useState } from "react";
import type { LiveState, Status } from "../../api/types";
import { useLang } from "../../i18n";
import { time } from "../../i18n/format";
import { Person } from "../Person";

type Tab = "waiting" | "here" | "all";

/** Everyone on the roster, with the hand-marking a professor needs when a card is forgotten. */
export function RosterPanel({ state, onMark }: { state: LiveState; onMark: (id: number, s: Status | null) => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("waiting");
  const rows = useMemo(() => {
    const list = state.roster.filter((p) =>
      tab === "all" ? true : tab === "waiting" ? !p.status : p.status === "present" || p.status === "late");
    return tab === "here" ? [...list].sort((a, b) => (b.markedAt ?? "").localeCompare(a.markedAt ?? "")) : list;
  }, [state.roster, tab]);
  const counts = { waiting: state.waiting, here: state.counts.present + state.counts.late, all: state.enrolled };
  const closed = state.session.status === "closed";
  return (
    <section className="panel roster-panel" aria-label={t.course.roster}>
      <div className="tabs" role="tablist">
        {(["waiting", "here", "all"] as Tab[]).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>
            {t.live.tabs[k]} <span className="num muted">{counts[k]}</span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? <p className="empty-line">{tab === "waiting" ? "—" : t.live.noScans}</p> : (
        <ul className="rows roster-rows">
          {rows.map((p) => (
            <li key={p.id} className="row roster-row">
              <Person nameAr={p.nameAr} nameEn={p.nameEn} number={p.number} />
              <span className={`roster-status status-${p.status ?? "waiting"}`}>
                {t.status[p.status ?? "waiting"]}
                {p.markedAt && (p.status === "present" || p.status === "late") ? <span className="num muted"> {time(p.markedAt)}</span> : null}
              </span>
              <span className="roster-actions">
                {p.status !== "present" && <button type="button" className="btn btn-ghost" onClick={() => onMark(p.id, "present")}>{t.live.markPresent}</button>}
                {p.status !== "late" && <button type="button" className="btn btn-ghost" onClick={() => onMark(p.id, "late")}>{t.live.markLate}</button>}
                {p.status !== "excused" && <button type="button" className="btn btn-ghost" onClick={() => onMark(p.id, "excused")}>{t.live.markExcused}</button>}
                {p.status && !closed && <button type="button" className="btn btn-ghost" onClick={() => onMark(p.id, null)}>{t.live.undo}</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
