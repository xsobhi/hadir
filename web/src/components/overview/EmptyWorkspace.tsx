import { BookOpen, Sparkles } from "kubai-icons-react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useLang } from "../../i18n";

/** First run for an account that signed in with Pabbel: add a course, or load the sample ones to explore. */
export function EmptyWorkspace() {
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      await api.post("/api/auth/sample", { lang });
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <section data-reveal className="card empty-workspace" data-kubai-trigger>
      <span className="empty-art"><BookOpen size={72} color="#0e8a6a" trigger="parent" /></span>
      <h2>{t.auth.sampleTitle}</h2>
      <p className="muted">{t.auth.sampleLead}</p>
      <div className="actions">
        <Link className="btn btn-primary btn-lg" to="/app/courses/new"><Plus aria-hidden="true" />{t.overview.addCourse}</Link>
        <button type="button" className="btn btn-lg btn-soft" onClick={() => void load()} disabled={busy}>
          <Sparkles size={22} color="#0e8a6a" trigger="none" />{t.auth.sampleLoad}
        </button>
      </div>
    </section>
  );
}
