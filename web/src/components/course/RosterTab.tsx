import { ClipboardPaste, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { CourseDetail } from "../../api/types";
import { useLang } from "../../i18n";
import { AddStudentDialog } from "../AddStudentDialog";
import { Person } from "../Person";
import { useToast } from "../ui/Toast";
import { StudentActions } from "../students/StudentActions";

/** Who takes the course: add one student (dialog), paste a list from a spreadsheet, or remove someone.
 * A student just added is shown first and highlighted, so the professor sees it worked. */
export function RosterTab({ detail, onChange }: { detail: CourseDetail; onChange: () => void }) {
  const { t, pick } = useLang();
  const toast = useToast();
  const course = detail.course;
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);
  const [paste, setPaste] = useState("");
  useEffect(() => {
    if (fresh === null) return;
    document.getElementById(`roster-${fresh}`)?.scrollIntoView({ block: "center", behavior: "auto" });
  }, [fresh, detail]);
  const addMany = async (e: FormEvent) => {
    e.preventDefault();
    const r = await api.post<{ added: number; skippedLines: number[] }>(`/api/courses/${course.id}/students/paste`, { text: paste });
    toast(t.course.pasteDone(r.added, r.skippedLines.length), r.skippedLines.length ? "info" : "success");
    setPaste("");
    onChange();
  };
  const remove = async (sid: number, name: string) => {
    if (!window.confirm(t.course.removeConfirm(name))) return;
    await api.del(`/api/courses/${course.id}/students/${sid}`);
    onChange();
  };
  const students = [...detail.students].sort((a, b) =>
    (a.id === fresh ? -1 : b.id === fresh ? 1 : 0) || pick(a.nameAr, a.nameEn).localeCompare(pick(b.nameAr, b.nameEn)));
  const majors = [...new Set(detail.students.map((s) => s.major).filter(Boolean))];
  return (
    <div className="grid cols-main">
      <section data-reveal className="card" aria-labelledby="roster-h">
        <div className="card-head">
          <h2 id="roster-h">{t.course.roster} <span className="muted num">{students.length}</span></h2>
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}><UserPlus aria-hidden="true" />{t.add.open}</button>
        </div>
        <ul className="rows">
          {students.map((s) => (
            <li key={s.id} id={`roster-${s.id}`} className={s.id === fresh ? "row roster-list-row row-new" : "row roster-list-row"}>
              <Link to={`/app/students/${s.id}`}><Person nameAr={s.nameAr} nameEn={s.nameEn} number={s.number} gender={s.gender} /></Link>
              <span className="muted small">{s.major}</span>
              <div className="student-actions"><StudentActions student={s} compact onChange={onChange} />
                <button type="button" className="btn btn-ghost" onClick={() => void remove(s.id, pick(s.nameAr, s.nameEn))}>{t.manageStudent.unenroll}</button></div>
            </li>
          ))}
        </ul>
      </section>
      <form data-reveal className="card field" onSubmit={addMany}>
        <h2><label htmlFor="paste"><ClipboardPaste aria-hidden="true" className="inline-icon" />{t.course.pasteTitle}</label></h2>
        <textarea id="paste" className="input num" rows={7} dir="auto" value={paste} onChange={(e) => setPaste(e.target.value)} aria-describedby="paste-hint" />
        <p id="paste-hint" className="muted small">{t.course.pasteHint}</p>
        <div className="form-foot"><button type="submit" className="btn" disabled={!paste.trim()}>{t.course.pasteSubmit}</button></div>
      </form>
      <AddStudentDialog open={adding} onClose={() => setAdding(false)} courses={[course]} courseId={course.id} majors={majors}
        onAdded={(id) => { setFresh(id); onChange(); }} />
    </div>
  );
}
