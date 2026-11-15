import { api } from "../api/client";
import { CourseForm } from "../components/course/CourseForm";
import { Shell } from "../components/Shell";
import { useLang } from "../i18n";

export default function NewCourse() {
  const { t } = useLang();
  return (
    <Shell title={t.course.newTitle}>
      <div className="page-head"><div><h1>{t.course.newTitle}</h1></div></div>
      <section className="card new-course" aria-label={t.course.newTitle}>
        <CourseForm submitLabel={t.course.create} onSubmit={async (v) => {
          const r = await api.post<{ id: number }>("/api/courses", v);
          window.location.assign(`/app/courses/${r.id}?tab=roster`);
        }} />
      </section>
    </Shell>
  );
}
