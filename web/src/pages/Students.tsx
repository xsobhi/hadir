import { Users } from "kubai-icons-react";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Level, StudentRow } from "../api/types";
import { useData } from "../api/useData";
import { AddStudentDialog } from "../components/AddStudentDialog";
import { Person } from "../components/Person";
import { Shell } from "../components/Shell";
import { PageSkeleton } from "../components/skeletons";
import { LoadError } from "../components/States";
import { Pagination } from "../components/students/Pagination";
import { StudentFilters, type Filters } from "../components/students/StudentFilters";
import { AbsenceBar, LevelChip } from "../components/ui/Status";
import { Tile } from "../components/ui/Tile";
import { useLang } from "../i18n";

type Row = StudentRow & { courseId: number; courseCode: string };
type Data = { rows: Row[]; courses: { id: number; code: string; nameAr: string; nameEn: string }[] };
const RANK: Record<Level, number> = { over: 0, warning: 1, watch: 2, ok: 3 };
const KEYS: (keyof Filters)[] = ["q", "course", "level", "major", "year", "sort"];

const SORTERS: Record<string, (a: Row, b: Row) => number> = {
  risk: (a, b) => RANK[a.level] - RANK[b.level] || b.absent - a.absent || a.nameEn.localeCompare(b.nameEn),
  name: (a, b) => a.nameAr.localeCompare(b.nameAr, "ar"),
  number: (a, b) => a.number.localeCompare(b.number),
  late: (a, b) => b.late - a.late || b.absent - a.absent,
  excused: (a, b) => b.excused - a.excused || b.absent - a.absent,
};

export default function Students() {
  const { t } = useLang();
  // Every filter and the page live in the URL, so the server renders the same view and links can be shared.
  const [params, setParams] = useSearchParams();
  const f = Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])) as Filters;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const size = [10, 20, 50].includes(Number(params.get("size"))) ? Number(params.get("size")) : 20;
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  const { data, error, reload } = useData<Data>("/api/students");
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const setFilter = (key: keyof Filters | "clear", value: string) =>
    key === "clear" ? setParams(new URLSearchParams(), { replace: true }) : update({ [key]: value, page: "" });
  const majors = useMemo(() => [...new Set((data?.rows ?? []).map((r) => r.major).filter(Boolean))].sort(), [data]);
  const years = useMemo(() => [...new Set((data?.rows ?? []).map((r) => r.year))].sort(), [data]);
  const rows = useMemo(() => {
    if (!data) return [];
    const needle = f.q.trim().toLowerCase();
    const sorter = SORTERS[f.sort] ?? SORTERS.risk;
    return data.rows
      .filter((r) => !f.course || String(r.courseId) === f.course)
      .filter((r) => !f.level || RANK[r.level] <= RANK[f.level as Level])
      .filter((r) => !f.major || r.major === f.major)
      .filter((r) => !f.year || String(r.year) === f.year)
      .filter((r) => !needle || r.number.includes(needle) || r.nameEn.toLowerCase().includes(needle) || r.nameAr.includes(f.q.trim()))
      .sort((a, b) => (a.id === fresh ? -1 : b.id === fresh ? 1 : 0) || sorter(a, b));
  }, [data, f.q, f.course, f.level, f.major, f.year, f.sort, fresh]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * size, current * size);
  const people = data ? new Set(data.rows.map((r) => r.id)).size : 0;
  if (!data && !error) return <Shell title={t.students.title}><PageSkeleton kind="list" /></Shell>;
  return (
    <Shell title={t.students.title}>
      <div data-reveal className="page-head">
        <div className="card-title" data-kubai-trigger><Tile icon={Users} tone="violet" size={52} /><div><h1>{t.students.title}</h1><p className="lead">{data ? t.students.count(people) : " "}</p></div></div>
        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)} disabled={!data?.courses.length}><UserPlus aria-hidden="true" />{t.add.open}</button>
        </div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      <StudentFilters f={f} set={setFilter} courses={data?.courses ?? []} majors={majors} years={years} />
      <section data-reveal className="card table-card">
        {shown.length === 0 ? <p className="empty">{t.students.empty}</p> : (
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
              {shown.map((r) => (
                <tr key={`${r.courseId}-${r.id}`} className={r.id === fresh ? "row-new" : undefined}>
                  <td><Link to={`/app/students/${r.id}`}><Person nameAr={r.nameAr} nameEn={r.nameEn} number={r.number} gender={r.gender} sub={`${r.number}${r.major ? ` · ${r.major}` : ""}`} /></Link></td>
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
        <Pagination page={current} size={size} total={rows.length} onPage={(p) => update({ page: p > 1 ? String(p) : "" })}
          onSize={(s) => update({ size: s === 20 ? "" : String(s), page: "" })} />
      </section>
      <AddStudentDialog open={adding} onClose={() => setAdding(false)} courses={data?.courses ?? []} majors={majors}
        onAdded={(id) => { setFresh(id); update({ page: "", sort: "", q: "", level: "" }); void reload(); }} />
    </Shell>
  );
}
