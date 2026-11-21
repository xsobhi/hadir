import { BotSparkle, ScanBarcode, TriangleAlert } from "kubai-icons-react";
import { Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { PabbelButton } from "../components/public/PabbelButton";
import { PublicBar } from "../components/public/PublicBar";
import { ScanFragment } from "../components/public/ScanFragment";
import { Tile, type Tone } from "../components/ui/Tile";
import { useLang } from "../i18n";
import { gsap, reducedMotion, useGSAP } from "../motion/gsap";
import { useReveal } from "../motion/useReveal";
import { WordReveal } from "../motion/WordReveal";
import ClickSpark from "../vendor/reactbits/ClickSpark";
import SpotlightCard from "../vendor/reactbits/SpotlightCard";
import { useTitle } from "../ssr/context";

const POINTS: { icon: typeof ScanBarcode; tone: Tone }[] = [
  { icon: ScanBarcode, tone: "brand" }, { icon: TriangleAlert, tone: "amber" }, { icon: BotSparkle, tone: "violet" },
];

export default function Welcome() {
  const { t, lang } = useLang();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const main = useRef<HTMLElement>(null);
  useReveal(main);
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.from(".welcome-lead, .welcome-actions, .welcome-copy > .small", { opacity: 0, y: 18, duration: 0.8, stagger: 0.1, delay: 0.45, ease: "power3.out" });
    gsap.fromTo(".fragment", { opacity: 0, y: 40, rotate: 3 }, { opacity: 1, y: 0, rotate: -1.2, duration: 1.1, delay: 0.3, ease: "power3.out" });
    gsap.to(".fragment", { y: -8, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.4 });
    gsap.from(".fragment-row", { opacity: 0, x: 24, duration: 0.6, stagger: 0.12, delay: 0.9, ease: "power2.out" });
  }, { scope: main });
  useTitle(`${t.product} · ${t.auth.welcome.title}`);
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
      <main className="welcome" ref={main}>
        <section className="welcome-hero">
          <div className="welcome-copy">
            <WordReveal text={w.title} />
            <p className="welcome-lead">{w.lead}</p>
            <div className="welcome-actions">
              <ClickSpark sparkColor={["#0e8a6a", "#22c55e", "#f59e0b"]} sparkCount={12} sparkRadius={40} style={{ width: "auto", height: "auto" }}>
                <button type="button" className="btn btn-primary btn-lg" onClick={() => void demo()} disabled={busy}><Sparkles aria-hidden="true" />{w.tryDemo}</button>
              </ClickSpark>
              <PabbelButton />
            </div>
            <p className="muted small">{failed ? <span className="error-text">{t.auth.demoFailed}</span> : w.tryDemoNote}</p>
          </div>
          <ScanFragment />
        </section>
        <section className="welcome-points" aria-label={w.title}>
          {w.points.map((p, i) => (
            <SpotlightCard key={p.title} className="point" theme="light" spotlightColor="#0e8a6a" intensity={0.5} data-reveal data-kubai-trigger>
              <Tile icon={POINTS[i].icon} tone={POINTS[i].tone} size={56} />
              <h2>{p.title}</h2>
              <p>{p.body}</p>
            </SpotlightCard>
          ))}
        </section>
        <footer className="public-foot">
          <span>{w.by}</span>
        </footer>
      </main>
    </div>
  );
}
