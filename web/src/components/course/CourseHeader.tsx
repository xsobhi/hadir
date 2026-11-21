import { IdBadge, ScanBarcode } from "kubai-icons-react";
import { CalendarDays, Clock3, DoorOpen, Download, Pencil, Users } from "lucide-react";
import { DeleteCourseButton } from "./DeleteCourseButton";
import { Link } from "react-router-dom";
import type { CourseDetail } from "../../api/types";
import { useLang } from "../../i18n";

/** Course name, its schedule as chips, and the three things a professor does from here. */
export function CourseHeader({ data, onStart }: { data: CourseDetail; onStart: () => void }) {
  const { t, pick } = useLang();
  const c = data.course;
  return (
    <div data-reveal className="page-head">
      <div>
        <h1>{pick(c.nameAr, c.nameEn)}</h1>
        <div className="meta-row">
          <span className="chip chip-code">{c.code}-{c.section}</span>
          <span className="meta"><CalendarDays aria-hidden="true" />{c.days.map((d) => t.weekdays[d]).join("، ")}</span>
          <span className="meta"><Clock3 aria-hidden="true" /><span className="num">{c.startTime}</span></span>
          <span className="meta"><DoorOpen aria-hidden="true" />{t.room} {c.room}</span>
          <span className="meta"><Users aria-hidden="true" />{t.overview.heroStudents(data.summary.enrolled)}</span>
        </div>
      </div>
      <div className="actions">
        <Link className="btn" to={`/app/courses/${c.id}?tab=settings`}><Pencil aria-hidden="true" />{t.course.edit}</Link>
        <DeleteCourseButton course={c} />
        <a className="btn" href={`/api/courses/${c.id}/students/export.csv`}><Download aria-hidden="true" />{t.course.export}</a>
        <Link className="btn" to={`/app/cards/${c.id}`} data-kubai-trigger><IdBadge size={20} color="#7c3aed" trigger="parent" />{t.overview.printCards}</Link>
        <button type="button" className="btn btn-primary" onClick={onStart} data-kubai-trigger>
          <ScanBarcode size={22} color="#ffffff" trigger="parent" />{data.openSessionId ? t.overview.resume : t.overview.startNow}
        </button>
      </div>
    </div>
  );
}
