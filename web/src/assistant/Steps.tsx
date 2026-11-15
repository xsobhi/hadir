import { Check, CircleAlert, LoaderCircle, Sparkles } from "lucide-react";
import { useLang } from "../i18n";
import type { Step } from "./types";

function argLine(args: Record<string, unknown>): string {
  const keys = ["course_code", "student_number", "query", "on_date", "class_date", "min_level"];
  return keys.filter((k) => args[k]).map((k) => String(args[k])).join(" · ");
}

/** The agent's tool calls as a quiet trace under the conversation: what it read, and the reflection loop. */
export function Steps({ steps }: { steps: Step[] }) {
  const { t } = useLang();
  return (
    <ol className="steps">
      {steps.map((s) => (
        <li key={s.callId} className="step">
          <span className="step-icon" aria-hidden="true">
            {!s.done ? <LoaderCircle className="spin" /> : s.ok ? <Check /> : <CircleAlert />}
          </span>
          <span className="step-text">
            <span>{t.assistant.steps[s.name] ?? s.name}</span>
            {argLine(s.args) && <span className="muted ltr step-args">{argLine(s.args)}</span>}
          </span>
          {s.reflection.length > 0 && (
            <ol className="reflection">
              {s.reflection.map((r, i) => (
                <li key={i}>
                  <Sparkles aria-hidden="true" />{t.assistant.reflection[r.stage] ?? r.stage}
                  {r.verdict && <span className="muted"> · {r.verdict === "approved" ? t.assistant.verdictApproved : t.assistant.verdictRevise}</span>}
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
}
