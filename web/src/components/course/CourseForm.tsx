import { useState, type FormEvent } from "react";
import type { Course } from "../../api/types";
import { useLang } from "../../i18n";

export type CourseInput = Omit<Course, "id" | "termStart">;
const BLANK: CourseInput = {
  code: "", nameAr: "", nameEn: "", section: "1", room: "", days: [6, 1], startTime: "08:00", durationMin: 90,
  termWeeks: 16, absenceLimitPct: 25, lateAfterMin: 10,
};
// Sunday to Thursday first, as the week runs in Palestinian universities.
const ORDER = [6, 0, 1, 2, 3, 4, 5];

export function CourseForm({ initial, submitLabel, onSubmit }: {
  initial?: CourseInput; submitLabel: string; onSubmit: (v: CourseInput) => Promise<void>;
}) {
  const { t } = useLang();
  const [v, setV] = useState<CourseInput>(initial ?? BLANK);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const set = <K extends keyof CourseInput>(k: K, value: CourseInput[K]) => { setV((o) => ({ ...o, [k]: value })); setState("idle"); };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("saving");
    try { await onSubmit(v); setState("saved"); } catch { setState("error"); }
  };
  const num = (k: "durationMin" | "termWeeks" | "absenceLimitPct" | "lateAfterMin", label: string, min: number, max: number) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} className="input num" type="number" min={min} max={max} value={v[k]} dir="ltr"
        onChange={(e) => set(k, Number(e.target.value))} required />
    </div>
  );
  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field"><label htmlFor="code">{t.course.code}</label>
        <input id="code" className="input" dir="ltr" value={v.code} onChange={(e) => set("code", e.target.value)} required minLength={2} maxLength={16} /></div>
      <div className="field"><label htmlFor="section">{t.course.section}</label>
        <input id="section" className="input" dir="ltr" value={v.section} onChange={(e) => set("section", e.target.value)} maxLength={8} /></div>
      <div className="field span-2"><label htmlFor="nameAr">{t.course.nameAr}</label>
        <input id="nameAr" className="input" dir="rtl" value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} required minLength={2} /></div>
      <div className="field span-2"><label htmlFor="nameEn">{t.course.nameEn}</label>
        <input id="nameEn" className="input" dir="ltr" value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></div>
      <fieldset className="field span-2 days">
        <legend>{t.course.days}</legend>
        <div className="day-row">
          {ORDER.map((d) => (
            <label key={d} className="day-chip">
              <input type="checkbox" checked={v.days.includes(d)}
                onChange={(e) => set("days", e.target.checked ? [...v.days, d] : v.days.filter((x) => x !== d))} />
              <span>{t.weekdaysShort[d]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field"><label htmlFor="startTime">{t.course.startTime}</label>
        <input id="startTime" className="input num" type="time" dir="ltr" value={v.startTime} onChange={(e) => set("startTime", e.target.value)} required /></div>
      <div className="field"><label htmlFor="room">{t.room}</label>
        <input id="room" className="input" dir="ltr" value={v.room} onChange={(e) => set("room", e.target.value)} maxLength={40} /></div>
      {num("durationMin", t.course.duration, 30, 240)}
      {num("termWeeks", t.course.termWeeks, 4, 30)}
      {num("absenceLimitPct", t.course.limitPct, 5, 60)}
      {num("lateAfterMin", t.course.lateAfter, 0, 60)}
      <div className="span-2 form-foot">
        {state === "saved" && <span className="muted">{t.saved}</span>}
        {state === "error" && <span className="error-text">{t.loadFailed}</span>}
        <button type="submit" className="btn btn-primary" disabled={state === "saving" || v.days.length === 0}>{submitLabel}</button>
      </div>
    </form>
  );
}
