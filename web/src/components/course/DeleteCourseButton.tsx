import { Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../api/client";
import type { Course } from "../../api/types";
import { useLang } from "../../i18n";
import { DeleteDialog } from "../DeleteDialog";

export function DeleteCourseButton({ course }: { course: Course }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}><Trash2 aria-hidden="true" />{t.course.deleteCourse}</button>
    {open && <DeleteDialog title={t.course.deleteCourse} description={t.course.deleteConfirm(course.code)} onClose={() => setOpen(false)}
      onDelete={async () => { await api.del(`/api/courses/${course.id}`); window.location.assign("/app"); }} />}
  </>;
}
