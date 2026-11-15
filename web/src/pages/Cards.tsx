import { Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import type { CourseDetail } from "../api/types";
import { useData } from "../api/useData";
import { IdCardView } from "../components/IdCardView";
import { Shell } from "../components/Shell";
import { LoadError, Skeleton } from "../components/States";
import { useLang } from "../i18n";

export default function Cards() {
  const { id } = useParams();
  const { t, pick } = useLang();
  const { data, error, reload } = useData<CourseDetail>(`/api/courses/${id}`);
  const students = data ? [...data.students].sort((a, b) => a.nameEn.localeCompare(b.nameEn)) : [];
  return (
    <Shell title={t.cards.title}>
      <div className="page-head no-print">
        <div>
          <h1>{t.cards.title}</h1>
          <p className="lead">{data ? <>{pick(data.course.nameAr, data.course.nameEn)} · <span className="ltr">{data.course.code}</span> · {t.cards.lead}</> : " "}</p>
        </div>
        <div className="actions"><button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer aria-hidden="true" />{t.cards.print}</button></div>
      </div>
      {error ? <LoadError onRetry={reload} /> : null}
      {!data ? <Skeleton rows={6} height={120} /> : (
        <div className="card-sheet">
          {students.map((s) => <IdCardView key={s.id} student={s} />)}
        </div>
      )}
    </Shell>
  );
}
