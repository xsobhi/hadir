import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../api/client";
import { useLang } from "../../i18n";
import { DeleteDialog } from "../DeleteDialog";
import { useToast } from "../ui/Toast";
import { EditStudentDialog, type StudentInfo } from "./EditStudentDialog";

export function StudentActions({ student, onChange, onDeleted, compact = false }: {
  student: StudentInfo; onChange: () => void; onDeleted?: () => void; compact?: boolean;
}) {
  const { t, pick } = useLang();
  const toast = useToast();
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  const name = pick(student.nameAr, student.nameEn);
  return (
    <div className="student-actions">
      <button type="button" className={`btn ${compact ? "btn-ghost icon-btn" : ""}`} title={t.manageStudent.edit}
        aria-label={`${t.manageStudent.edit}: ${name}`} onClick={() => setAction("edit")}><Pencil aria-hidden="true" />{!compact && t.manageStudent.edit}</button>
      <button type="button" className={`btn ${compact ? "btn-ghost icon-btn" : "btn-danger"}`} title={t.manageStudent.delete}
        aria-label={`${t.manageStudent.delete}: ${name}`} onClick={() => setAction("delete")}><Trash2 aria-hidden="true" />{!compact && t.manageStudent.delete}</button>
      {action === "edit" && <EditStudentDialog student={student} onClose={() => setAction(null)}
        onSaved={() => { toast(t.saved, "success"); onChange(); }} />}
      {action === "delete" && <DeleteDialog title={t.manageStudent.delete} description={t.manageStudent.deleteConfirm(name)} onClose={() => setAction(null)}
        onDelete={async () => { await api.del(`/api/students/${student.id}`); toast(t.manageStudent.deleted, "success"); (onDeleted ?? onChange)(); }} />}
    </div>
  );
}
