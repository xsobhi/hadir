import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../../api/client";
import type { StudentRow } from "../../api/types";
import { useLang } from "../../i18n";

export type StudentInfo = Pick<StudentRow, "id" | "number" | "nameAr" | "nameEn" | "major" | "year" | "gender">;

export function EditStudentDialog({ student, onClose, onSaved }: {
  student: StudentInfo; onClose: () => void; onSaved: () => void;
}) {
  const { t } = useLang();
  const prefix = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [v, setV] = useState({ ...student, gender: student.gender ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (v.number.replace(/[^\p{L}\p{N}]/gu, "").length < 3) return setError(t.add.badNumber);
    if (v.nameAr.trim().length < 2) return setError(t.add.needName);
    setBusy(true); setError("");
    try { await api.patch(`/api/students/${student.id}`, v); onSaved(); onClose(); }
    catch (err) { setError(err instanceof ApiError && err.code === "student_number_exists" ? t.manageStudent.duplicate : t.manageStudent.failed); }
    finally { setBusy(false); }
  };
  const field = (key: "number" | "nameAr" | "nameEn" | "major", label: string, max: number, dir?: "ltr" | "rtl") => (
    <div className="field"><label htmlFor={`${prefix}-${key}`}>{label}</label>
      <input id={`${prefix}-${key}`} className="input" dir={dir} value={v[key]} maxLength={max}
        required={key === "number" || key === "nameAr"} autoFocus={key === "number"}
        onChange={(e) => setV({ ...v, [key]: e.target.value })} /></div>
  );
  return (
    <dialog ref={dialog} className="dialog" aria-labelledby={`${prefix}-title`} onCancel={(e) => { if (busy) e.preventDefault(); else onClose(); }}>
      <form className="dialog-body form-grid" onSubmit={submit}>
        <h2 className="span-2" id={`${prefix}-title`}>{t.manageStudent.edit}</h2>
        <p className="muted span-2">{t.manageStudent.editHint}</p>
        {field("number", t.add.number, 32, "ltr")}
        {field("major", t.add.major, 80)}
        {field("nameAr", t.add.nameAr, 80, "rtl")}
        {field("nameEn", t.add.nameEn, 80, "ltr")}
        <div className="field"><label htmlFor={`${prefix}-year`}>{t.add.year}</label>
          <select id={`${prefix}-year`} className="input" value={v.year} onChange={(e) => setV({ ...v, year: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 7].map((y) => <option key={y} value={y}>{t.filters.year(y)}</option>)}
          </select></div>
        <div className="field"><label htmlFor={`${prefix}-gender`}>{t.add.gender}</label>
          <select id={`${prefix}-gender`} className="input" value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value })}>
            <option value="">{t.manageStudent.defaultPicture}</option><option value="f">{t.add.female}</option><option value="m">{t.add.male}</option>
          </select></div>
        {error && <p className="error-text span-2" role="alert">{error}</p>}
        <div className="form-foot span-2">
          <button type="button" className="btn" disabled={busy} onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-primary" type="submit" disabled={busy}>{t.save}</button>
        </div>
      </form>
    </dialog>
  );
}
