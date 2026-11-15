import { Check, Clock3, FileText, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { LiveState, Status } from "../../api/types";
import { useLang } from "../../i18n";
import { time } from "../../i18n/format";
import { Person } from "../Person";
import { StatusChip } from "../ui/Status";

type Tab = "waiting" | "here" | "all";

/** Everyone on the roster, with one-tap marking for a student who forgot their card. */
export function RosterPanel({ state, onMark }: { state: LiveState; onMark: (id: number, s: Status | null) => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("waiting");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = state.roster
      .filter((p) => (tab === "all" ? true : tab === "waiting" ? !p.status : p.status === "present" || p.status === "late"))
      .filter((p) => !needle || p.number.includes(needle) || p.nameEn.toLowerCase().includes(needle) || p.nameAr.includes(q.trim()));
    return tab === "here" ? [...list].sort((a, b) => (b.markedAt ?? "").localeCompare(a.markedAt ?? "")) : list;
  }, [state.roster, tab, q]);
  const counts = { waiting: state.waiting, here: state.counts.present + state.counts.late, all: state.enrolled };
  const closed = state.session.status === "closed";
  const act = (label: string, cls: string, Icon: typeof Check, onClick: () => void) => (
    <button type="button" className={`act ${cls}`} onClick={onClick} title={label} aria-label={label}><Icon aria-hidden="true" strokeWidth={2.4} /></button>
  );
  return (
    <section className="card roster-card" aria-label={t.course.roster}>
      <div className="roster-tools">
        <div className="tabs" role="tablist">
          {(["waiting", "here", "all"] as Tab[]).map((k) => (
            <button key={k} role="tab" type="button" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>
              {t.live.tabs[k]} <span className="count num">{counts[k]}</span>
            </button>
          ))}
        </div>
        <label className="input-icon roster-search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t.live.searchRoster}</span>
          <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.live.searchRoster} />
        </label>
      </div>
      {rows.length === 0 ? <p className="empty">{t.live.noScans}</p> : (
        <ul className="rows roster-rows">
          {rows.map((p) => (
            <li key={p.id} className="row roster-row">
              <Person nameAr={p.nameAr} nameEn={p.nameEn} number={p.number} gender={p.gender} />
              <StatusChip status={p.status} time={p.markedAt && (p.status === "present" || p.status === "late") ? time(p.markedAt) : null} />
              <span className="roster-actions">
                {p.status !== "present" && act(t.live.markPresent, "act-present", Check, () => onMark(p.id, "present"))}
                {p.status !== "late" && act(t.live.markLate, "act-late", Clock3, () => onMark(p.id, "late"))}
                {p.status !== "excused" && act(t.live.markExcused, "act-excused", FileText, () => onMark(p.id, "excused"))}
                {p.status && !closed && act(t.live.undo, "act-undo", RotateCcw, () => onMark(p.id, null))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
