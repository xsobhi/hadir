import { Search } from "lucide-react";
import { Users } from "kubai-icons-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Level, StudentRow } from "../api/types";
import { useData } from "../api/useData";
import { Person } from "../components/Person";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { AbsenceBar, LevelChip } from "../components/ui/Status";
import { Tile } from "../components/ui/Tile";
import { useLang } from "../i18n";

type Row = StudentRow & { courseId: number; courseCode: string };
type Data = { rows: Row[]; courses: { id: number; code: string; nameAr: string; nameEn: string }[] };
const RANK: Record<Level, number> = { over: 0, warning: 1, watch: 2, ok: 3 };

export default function Students() {
  const { t, pick } = useLang();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const course = params.get("course") ?? "";
  const level = (params.get("level") ?? "") as Level | "";
  const { data, error, reload } = useData<Data>("/api/students");
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.rows
      .filter((r) => !course || String(r.courseId) === course)
      .filter((r) => !level || RANK[r.level] <= RANK[level])
      .filter((r) => !needle || r.number.includes(needle) || r.nameEn.toLowerCase().includes(needle) || r.nameAr.includes(q.trim()))
      .sort((a, b) => RANK[a.level] - RANK[b.level] || b.absent - a.absent || a.nameEn.localeCompare(b.nameEn));
  }, [data, q, course, level]);
  const people = data ? new Set(data.rows.map((r) => r.id)).size : 0;
  return (
    <Shell title={t.students.title}>
      <div className="page-head">
        <div className="card-title" data-kubai-trigger><Tile icon={Users} tone="violet" size={52} /><div><h1>{t.students.title}</h1><p className="lead">{data ? t.students.count(people) : "\u00a0"}</p></div></div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      <div className="toolbar">
        <label className="input-icon search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t.students.search}</span>
          <input className="input" type="search" placeholder={t.students.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="input select" value={course} onChange={(e) => setFilter("course", e.target.value)} aria-label={t.courseLabel}>
          <option value="">{t.students.allCourses}</option>
          {data?.courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {pick(c.nameAr, c.nameEn)}</option>)}
        </select>
        <div className="tabs" role="tablist" aria-label={t.students.colLevel}>
          {(["", "watch", "warning", "over"] as (Level | "")[]).map((l) => (
            <button key={l || "all"} type="button" role="tab" className="tab" aria-selected={level === l} onClick={() => setFilter("level", l)}>
              {l ? t.levels[l] : t.students.allLevels}
            </button>
          ))}
        </div>
        <span className="muted num toolbar-count">{rows.length}</span>
      </div>
      <section className="card table-card">
        {!data ? <Skeleton rows={10} /> : rows.length === 0 ? <p className="empty">{t.students.empty}</p> : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t.student}</th>
                <th scope="col">{t.courseLabel}</th>
                <th scope="col" className="num">{t.students.colAbsent}</th>
                <th scope="col" className="num">{t.students.colLate}</th>
                <th scope="col" className="num">{t.students.colExcused}</th>
                <th scope="col">{t.course.allowanceCol}</th>
                <th scope="col">{t.students.colLevel}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 300).map((r) => (
                <tr key={`${r.courseId}-${r.id}`}>
                  <td><Link to={`/app/students/${r.id}`}><Person nameAr={r.nameAr} nameEn={r.nameEn} number={r.number} gender={r.gender} /></Link></td>
                  <td><span className="chip chip-code">{r.courseCode}</span></td>
                  <td className="num">{r.absent}</td>
                  <td className="num muted">{r.late}</td>
                  <td className="num muted">{r.excused}</td>
                  <td><AbsenceBar used={r.absent} allowed={r.allowed} /></td>
                  <td><LevelChip level={r.level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
