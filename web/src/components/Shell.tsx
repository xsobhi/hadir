import { BookOpen, Bot, CalendarCheck, Languages, Lightbulb, Users } from "kubai-icons-react";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { CourseItem } from "../api/types";
import { useData } from "../api/useData";
import { useAuth } from "../auth/AuthContext";
import { useLang } from "../i18n";
import { Avatar } from "./Avatar";
import { Mark } from "./Mark";
import { TONE_COLOR } from "./ui/Tile";

const COURSE_TONES = ["#2563eb", "#7c3aed", "#0284c7", "#c2610c", "#e11d48", "#0e8a6a"];

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const { t, lang, setLang, pick } = useLang();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data } = useData<{ courses: CourseItem[] }>("/api/courses");
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    document.title = `${title} · ${t.product}`;
  }, [title, t.product]);
  const hoursLeft = user?.expiresAt ? Math.max(1, Math.round((Date.parse(user.expiresAt) - Date.now()) / 3.6e6)) : 0;
  const item = (to: string, label: string, Icon: typeof Users, tone: keyof typeof TONE_COLOR, end = false) => (
    <NavLink to={to} end={end} className="nav-item" data-kubai-trigger>
      <Icon size={22} color={TONE_COLOR[tone]} trigger="parent" />{label}
    </NavLink>
  );

  const nav = (
    <nav className="nav" aria-label={t.nav.menu}>
      {item("/app", t.nav.today, CalendarCheck, "brand", true)}
      {item("/app/students", t.nav.students, Users, "violet")}
      {item("/app/assistant", t.nav.assistant, Bot, "amber")}
      <p className="nav-group"><BookOpen size={16} color="#64748b" trigger="none" />{t.nav.courses}</p>
      {(data?.courses ?? []).map((c, i) => (
        <NavLink key={c.id} to={`/app/courses/${c.id}`} className="nav-item nav-course">
          <span className="course-dot" style={{ background: COURSE_TONES[i % COURSE_TONES.length] }} />
          <span className="nav-course-name">{pick(c.nameAr, c.nameEn)}</span>
          <span className="nav-code">{c.code}</span>
        </NavLink>
      ))}
    </nav>
  );

  const foot = (
    <div className="side-foot">
      {item("/about", t.nav.caseStudy, Lightbulb, "sky")}
      <button type="button" className="nav-item" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t.languageLabel} data-kubai-trigger>
        <Languages size={22} color={TONE_COLOR.blue} trigger="parent" />{t.language}
      </button>
      {user && (
        <div className="user-card">
          <Avatar seed={user.email} gender={user.gender} size={42} />
          <span className="user-text">
            <span className="user-name">{user.name}</span>
            <span className="user-dept">{user.title || user.department}</span>
          </span>
          <button type="button" className="btn btn-ghost icon-btn" onClick={() => void signOut()} aria-label={t.nav.signOut} title={t.nav.signOut}>
            <LogOut aria-hidden="true" className="flip-rtl" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <a href="/app" className="brand"><Mark size={40} /><span><strong>{t.product}</strong><span className="brand-line">{t.productLine}</span></span></a>
        {nav}
        {foot}
      </aside>
      <header className="topbar">
        <a href="/app" className="brand brand-small" aria-label={t.product}><Mark size={34} /></a>
        <span className="topbar-title">{title}</span>
        <button type="button" className="btn btn-ghost icon-btn" onClick={() => setOpen(true)} aria-label={t.nav.menu} aria-expanded={open}><Menu aria-hidden="true" /></button>
      </header>
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <div className="sheet-head">
            <span className="brand"><Mark size={34} /><strong>{t.product}</strong></span>
            <button type="button" className="btn btn-ghost icon-btn" onClick={() => setOpen(false)} aria-label={t.nav.close}><X aria-hidden="true" /></button>
          </div>
          {nav}
          {foot}
        </div>
      )}
      <main className="canvas">
        {user?.isDemo && <p className="demo-banner"><Sparkles aria-hidden="true" />{t.demoBanner(hoursLeft)}</p>}
        {children}
      </main>
    </div>
  );
}
