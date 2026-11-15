import { useLang } from "../i18n";
import type { Action } from "./types";

/** Human in the loop: the graph is paused on interrupt() until the professor answers here. */
export function ApprovalCard({ actions, onDecide, busy, decided }: {
  actions: Action[]; onDecide?: (approved: boolean) => void; busy?: boolean; decided?: boolean | null;
}) {
  const { t } = useLang();
  const label: Record<string, string> = {
    student_number: t.assistant.argStudent, course_code: t.assistant.argCourse, class_date: t.assistant.argDate,
    reason: t.assistant.argReason, notice: t.assistant.argNotice,
  };
  return (
    <section className={`approval${decided === undefined ? "" : " approval-done"}`} aria-label={t.assistant.approveTitle}>
      {decided === undefined && <><h2>{t.assistant.approveTitle}</h2><p className="muted">{t.assistant.approveLead}</p></>}
      {actions.map((a) => (
        <div key={a.id} className="approval-action">
          <p className="approval-name">{t.assistant.steps[a.name] ?? a.name}</p>
          <dl className="approval-args">
            {Object.entries(a.args).filter(([k]) => k !== "notice").map(([k, v]) => (
              <div key={k}><dt>{label[k] ?? k}</dt><dd dir="auto">{String(v)}</dd></div>
            ))}
          </dl>
          {typeof a.args.notice === "string" && decided === undefined && <p className="letter" dir="auto">{a.args.notice}</p>}
        </div>
      ))}
      {decided === undefined ? (
        <div className="actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onDecide?.(true)}>{t.assistant.approve}</button>
          <button type="button" className="btn" disabled={busy} onClick={() => onDecide?.(false)}>{t.assistant.decline}</button>
        </div>
      ) : <p className={decided ? "approval-verdict" : "approval-verdict muted"}>{decided ? t.assistant.approved : t.assistant.declined}</p>}
    </section>
  );
}
