import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { CourseDetail } from "../../api/types";
import { useLang } from "../../i18n";
import { Person } from "../Person";

/** Who takes the course: add one student, paste a list from a spreadsheet, or remove someone. */
export function RosterTab({ detail, onChange }: { detail: CourseDetail; onChange: () => void }) {
  const { t, pick } = useLang();
  const id = detail.course.id;
  const [one, setOne] = useState({ number: "", nameAr: "", nameEn: "", major: "" });
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState("");
  const addOne = async (e: FormEvent) => {
    e.preventDefault();
    await api.post(`/api/courses/${id}/students`, { ...one, year: 1 });
    setOne({ number: "", nameAr: "", nameEn: "", major: "" });
    onChange();
  };
  const addMany = async (e: FormEvent) => {
    e.preventDefault();
    const r = await api.post<{ added: number; skippedLines: number[] }>(`/api/courses/${id}/students/paste`, { text: paste });
    setNote(t.course.pasteDone(r.added, r.skippedLines.length));
    setPaste("");
    onChange();
  };
  const remove = async (sid: number, name: string) => {
    if (!window.confirm(t.course.removeConfirm(name))) return;
    await api.del(`/api/courses/${id}/students/${sid}`);
    onChange();
  };
  const students = [...detail.students].sort((a, b) => pick(a.nameAr, a.nameEn).localeCompare(pick(b.nameAr, b.nameEn)));
  return (
    <div className="grid cols-main">
      <section className="card" aria-labelledby="roster-h">
        <div className="card-head"><h2 id="roster-h">{t.course.roster}</h2><span className="muted num">{students.length}</span></div>
        <ul className="rows">
          {students.map((s) => (
            <li key={s.id} className="row roster-list-row">
              <Link to={`/app/students/${s.id}`}><Person nameAr={s.nameAr} nameEn={s.nameEn} number={s.number} gender={s.gender} /></Link>
              <span className="muted small">{s.major}</span>
              <button type="button" className="btn btn-ghost" onClick={() => void remove(s.id, pick(s.nameAr, s.nameEn))}>{t.remove}</button>
            </li>
          ))}
        </ul>
      </section>
      <div className="stack">
        <form className="card form-grid" onSubmit={addOne} aria-labelledby="add-h">
          <h2 id="add-h" className="span-2">{t.course.addStudent}</h2>
          <div className="field"><label htmlFor="sn">{t.number}</label>
            <input id="sn" className="input num" dir="ltr" value={one.number} onChange={(e) => setOne({ ...one, number: e.target.value })} required minLength={3} /></div>
          <div className="field"><label htmlFor="sm">{t.course.major}</label>
            <input id="sm" className="input" value={one.major} onChange={(e) => setOne({ ...one, major: e.target.value })} /></div>
          <div className="field"><label htmlFor="sa">{t.course.nameAr}</label>
            <input id="sa" className="input" dir="rtl" value={one.nameAr} onChange={(e) => setOne({ ...one, nameAr: e.target.value })} required minLength={2} /></div>
          <div className="field"><label htmlFor="se">{t.course.nameEn}</label>
            <input id="se" className="input" dir="ltr" value={one.nameEn} onChange={(e) => setOne({ ...one, nameEn: e.target.value })} /></div>
          <div className="span-2 form-foot"><button type="submit" className="btn">{t.course.addStudent}</button></div>
        </form>
        <form className="card field" onSubmit={addMany}>
          <h2><label htmlFor="paste">{t.course.pasteTitle}</label></h2>
          <textarea id="paste" className="input num" rows={5} dir="auto" value={paste} onChange={(e) => setPaste(e.target.value)} aria-describedby="paste-hint" />
          <p id="paste-hint" className="muted small">{t.course.pasteHint}</p>
          <div className="form-foot">{note && <span className="muted">{note}</span>}<button type="submit" className="btn" disabled={!paste.trim()}>{t.course.pasteSubmit}</button></div>
        </form>
      </div>
    </div>
  );
}
