import { BotSparkle, ScanBarcode, TriangleAlert } from "kubai-icons-react";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { PabbelButton } from "../components/public/PabbelButton";
import { PublicBar } from "../components/public/PublicBar";
import { ScanFragment } from "../components/public/ScanFragment";
import { Tile, type Tone } from "../components/ui/Tile";
import { useLang } from "../i18n";

const POINTS: { icon: typeof ScanBarcode; tone: Tone }[] = [
  { icon: ScanBarcode, tone: "brand" }, { icon: TriangleAlert, tone: "amber" }, { icon: BotSparkle, tone: "violet" },
];

export default function Welcome() {
  const { t, lang } = useLang();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const demo = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const r = await api.post<{ user: User }>("/api/auth/demo", { lang });
      setUser(r.user);
      navigate("/app");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const w = t.auth.welcome;
  return (
    <div className="public">
      <PublicBar />
      <main className="welcome">
        <section className="welcome-hero">
          <div className="welcome-copy">
            <h1>{w.title}</h1>
            <p className="welcome-lead">{w.lead}</p>
            <div className="welcome-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => void demo()} disabled={busy}><Sparkles aria-hidden="true" />{w.tryDemo}</button>
              <PabbelButton />
            </div>
            <p className="muted small">{failed ? <span className="error-text">{t.auth.demoFailed}</span> : w.tryDemoNote}</p>
          </div>
          <ScanFragment />
        </section>
        <section className="welcome-points" aria-label={w.title}>
          {w.points.map((p, i) => (
            <article key={p.title} className="point card" data-kubai-trigger>
              <Tile icon={POINTS[i].icon} tone={POINTS[i].tone} size={56} />
              <h2>{p.title}</h2>
              <p>{p.body}</p>
            </article>
          ))}
        </section>
        <footer className="public-foot">
          <span>{w.by}</span>
          <Link to="/about" className="link">{w.howBuilt}</Link>
        </footer>
      </main>
    </div>
  );
}
