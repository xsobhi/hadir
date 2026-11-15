import { IdBadge, ScanBarcode } from "kubai-icons-react";
import { CalendarDays, Clock3, DoorOpen, Users } from "lucide-react";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap, reducedMotion, useGSAP } from "../../motion/gsap";
import { api } from "../../api/client";
import type { CourseItem } from "../../api/types";
import { useLang } from "../../i18n";
import { day, time } from "../../i18n/format";

/** The day's one job, first and largest: the next class and the button that starts taking attendance. */
export function NextClassHero({ next }: { next: CourseItem | null }) {
  const { t, lang, pick } = useLang();
  const navigate = useNavigate();
  const root = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reducedMotion() || !root.current) return;
    gsap.to(".hero-art svg", { y: -10, rotate: -2, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.from(".hero-meta li", { opacity: 0, y: 10, duration: 0.5, stagger: 0.06, delay: 0.35, ease: "power2.out" });
    gsap.from(".hero-start", { scale: 0.9, opacity: 0, duration: 0.7, delay: 0.55, ease: "back.out(2)" });
  }, { scope: root, dependencies: [next?.id] });
  if (!next || !next.next) {
    return (
      <section className="hero-card hero-empty">
        <div className="hero-copy"><p className="hero-eyebrow">{t.overview.nextClass}</p><h2>{t.overview.noClasses}</h2></div>
        <Link className="btn btn-white btn-lg" to="/app/courses/new">{t.overview.addCourse}</Link>
      </section>
    );
  }
  const start = async () => {
    const id = next.openSessionId ?? (await api.post<{ id: number }>(`/api/courses/${next.id}/sessions`, {})).id;
    navigate(`/app/live/${id}`);
  };
  return (
    <section className="hero-card" ref={root} data-reveal aria-labelledby="hero-h">
      <div className="hero-copy">
        <p className="hero-eyebrow">{t.overview.nextClass}</p>
        <h2 id="hero-h">{pick(next.nameAr, next.nameEn)} <span className="hero-code">{next.code}-{next.section}</span></h2>
        <ul className="hero-meta">
          <li><CalendarDays aria-hidden="true" />{next.next.isToday ? t.today : day(next.next.startsAt, lang, true)}</li>
          <li><Clock3 aria-hidden="true" /><span className="num">{time(next.next.startsAt)}</span></li>
          <li><DoorOpen aria-hidden="true" />{t.room} {next.room}</li>
          <li><Users aria-hidden="true" />{t.overview.heroStudents(next.summary.enrolled)}</li>
        </ul>
        <div className="hero-actions">
          <button type="button" className="btn btn-white btn-lg hero-start" onClick={() => void start()} data-kubai-trigger>
            <ScanBarcode size={26} color="#0e8a6a" trigger="parent" />
            {next.openSessionId ? t.overview.resume : t.overview.startNow}
          </button>
          <Link className="btn btn-lg hero-ghost" to={`/app/cards/${next.id}`} data-kubai-trigger>
            <IdBadge size={22} color="#ffffff" trigger="parent" />{t.overview.printCards}
          </Link>
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <svg viewBox="0 0 220 150">
          <rect x="10" y="10" width="200" height="130" rx="18" fill="rgba(255,255,255,.14)" />
          <rect x="26" y="26" width="46" height="56" rx="10" fill="rgba(255,255,255,.28)" />
          <rect x="84" y="32" width="96" height="10" rx="5" fill="rgba(255,255,255,.55)" />
          <rect x="84" y="52" width="70" height="8" rx="4" fill="rgba(255,255,255,.32)" />
          {[0, 6, 10, 18, 22, 30, 36, 40, 48, 54, 58, 66, 72, 78, 84, 88, 96, 102, 108, 116, 122, 128, 136, 142, 150, 158, 162].map((x, i) => (
            <rect key={x} x={30 + x} y="96" width={i % 3 === 0 ? 4 : 2} height="30" fill="rgba(255,255,255,.75)" />
          ))}
          <line x1="20" x2="200" y1="111" y2="111" stroke="#bbf7d0" strokeWidth="2.5" className="hero-scanline" />
        </svg>
      </div>
    </section>
  );
}
