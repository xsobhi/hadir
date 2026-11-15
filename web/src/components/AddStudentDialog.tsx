import { UserPlus } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { useLang } from "../i18n";
import { avatarUrl } from "./Avatar";
import { useToast } from "./ui/Toast";

type CourseOption = { id: number; code: string; nameAr: string; nameEn: string };
type Result = { id: number; existing: boolean; alreadyEnrolled: boolean };
const BLANK = { number: "", nameAr: "", nameEn: "", major: "", year: 1, gender: "" };

/** Add one student to a course. Fixed to a course on the course page; on the Students page you pick the course.
 * Errors are said next to the field, success is said in a toast and the caller highlights the new row. */
export function AddStudentDialog({ open, onClose, courses, courseId, majors, onAdded }: {
  open: boolean; onClose: () => void; courses: CourseOption[]; courseId?: number; majors: string[];
  onAdded: (studentId: number, courseId: number) => void;
}) {
  const { t, pick } = useLang();
  const a = t.add;
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const [v, setV] = useState(BLANK);
  const [target, setTarget] = useState<number>(courseId ?? courses[0]?.id ?? 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) { setV(BLANK); setError(""); setTarget(courseId ?? courses[0]?.id ?? 0); d.showModal(); }
    if (!open && d.open) d.close();
  }, [open, courseId, courses]);
  const set = (k: keyof typeof BLANK, value: string | number) => setV((o) => ({ ...o, [k]: value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (v.number.replace(/[^\p{L}\p{N}]/gu, "").length < 3) return setError(a.badNumber);
    if (v.nameAr.trim().length < 2) return setError(a.needName);
    setBusy(true);
    setError("");
    try {
      const r = await api.post<Result>(`/api/courses/${target}/students`, v);
      const course = courses.find((c) => c.id === target);
      const name = v.nameAr.trim();
      const where = course ? pick(course.nameAr, course.nameEn) : "";
      toast(r.alreadyEnrolled ? a.already(name) : r.existing ? a.existing(name, where) : a.added(name, where), r.alreadyEnrolled ? "info" : "success");
      onAdded(r.id, target);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.code === "bad_number" ? a.badNumber : a.failed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <dialog ref={dialog} className="dialog" onClose={onClose} onCancel={onClose} aria-labelledby="add-title" data-lenis-prevent>
      <form className="dialog-body form-grid" onSubmit={submit} noValidate>
        <div className="dialog-head span-2">
          <img src={avatarUrl(v.number || "new", v.gender)} alt="" width={56} height={56} className="avatar" />
          <h2 id="add-title"><UserPlus aria-hidden="true" />{a.title}</h2>
        </div>
        {!courseId && (
          <div className="field span-2"><label htmlFor="as-course">{a.course}</label>
            <select id="as-course" className="input" value={target} onChange={(e) => setTarget(Number(e.target.value))}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {pick(c.nameAr, c.nameEn)}</option>)}
            </select></div>
        )}
        <div className="field span-2"><label htmlFor="as-number">{a.number}</label>
          <input id="as-number" className="input num" dir="ltr" inputMode="numeric" autoComplete="off" value={v.number}
            onChange={(e) => set("number", e.target.value)} aria-describedby="as-number-hint" autoFocus />
          <p id="as-number-hint" className="muted small">{a.numberHint}</p></div>
        <div className="field"><label htmlFor="as-ar">{a.nameAr}</label>
          <input id="as-ar" className="input" dir="rtl" value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} /></div>
        <div className="field"><label htmlFor="as-en">{a.nameEn}</label>
          <input id="as-en" className="input" dir="ltr" value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></div>
        <div className="field"><label htmlFor="as-major">{a.major}</label>
          <input id="as-major" className="input" list="as-majors" value={v.major} onChange={(e) => set("major", e.target.value)} />
          <datalist id="as-majors">{majors.map((m) => <option key={m} value={m} />)}</datalist></div>
        <div className="field"><label htmlFor="as-year">{a.year}</label>
          <select id="as-year" className="input" value={v.year} onChange={(e) => set("year", Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{t.filters.year(y)}</option>)}
          </select></div>
        <fieldset className="field span-2 seg-field"><legend>{a.gender}</legend>
          <div className="seg">
            {([["f", a.female], ["m", a.male]] as const).map(([g, label]) => (
              <label key={g} className="seg-opt"><input type="radio" name="as-gender" checked={v.gender === g} onChange={() => set("gender", g)} /><span>{label}</span></label>
            ))}
          </div></fieldset>
        {error && <p className="error-text span-2" role="alert">{error}</p>}
        <div className="form-foot span-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{a.cancel}</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !target}>{a.submit}</button>
        </div>
      </form>
    </dialog>
  );
}
