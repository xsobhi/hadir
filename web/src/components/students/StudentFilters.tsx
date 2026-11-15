import { FilterX, Search } from "lucide-react";
import type { Level } from "../../api/types";
import { useLang } from "../../i18n";

export type Filters = { q: string; course: string; level: string; major: string; year: string; sort: string };
export const SORTS = ["risk", "name", "number", "late", "excused"] as const;
type Course = { id: number; code: string; nameAr: string; nameEn: string };

/** Search, then the filters a professor actually narrows by: course, level, major, year; and the order. */
export function StudentFilters({ f, set, courses, majors, years }: {
  f: Filters; set: (key: keyof Filters, value: string) => void; courses: Course[]; majors: string[]; years: number[];
}) {
  const { t, pick } = useLang();
  const sortLabel = { risk: t.filters.sortRisk, name: t.filters.sortName, number: t.filters.sortNumber, late: t.filters.sortLate, excused: t.filters.sortExcused };
  const active = f.q || f.course || f.level || f.major || f.year || (f.sort && f.sort !== "risk");
  return (
    <div className="filters" data-reveal>
      <div className="filters-row">
        <label className="input-icon search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t.students.search}</span>
          <input className="input" type="search" placeholder={t.students.search} value={f.q} onChange={(e) => set("q", e.target.value)} />
        </label>
        <select className="input select" value={f.course} onChange={(e) => set("course", e.target.value)} aria-label={t.courseLabel}>
          <option value="">{t.students.allCourses}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {pick(c.nameAr, c.nameEn)}</option>)}
        </select>
        <select className="input select" value={f.major} onChange={(e) => set("major", e.target.value)} aria-label={t.add.major}>
          <option value="">{t.filters.allMajors}</option>
          {majors.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="input select" value={f.year} onChange={(e) => set("year", e.target.value)} aria-label={t.add.year}>
          <option value="">{t.filters.allYears}</option>
          {years.map((y) => <option key={y} value={y}>{t.filters.year(y)}</option>)}
        </select>
        <select className="input select" value={f.sort || "risk"} onChange={(e) => set("sort", e.target.value)} aria-label={t.filters.sort}>
          {SORTS.map((s) => <option key={s} value={s}>{t.filters.sort}: {sortLabel[s]}</option>)}
        </select>
      </div>
      <div className="filters-row">
        <div className="tabs" role="tablist" aria-label={t.students.colLevel}>
          {(["", "watch", "warning", "over"] as (Level | "")[]).map((l) => (
            <button key={l || "all"} type="button" role="tab" className="tab" aria-selected={f.level === l} onClick={() => set("level", l)}>
              {l ? t.levels[l] : t.students.allLevels}
            </button>
          ))}
        </div>
        {active && <button type="button" className="btn btn-ghost" onClick={() => set("clear" as keyof Filters, "")}><FilterX aria-hidden="true" />{t.filters.clear}</button>}
      </div>
    </div>
  );
}
