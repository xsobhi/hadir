import { BookOpen, Bot, CalendarCheck, Languages, Users } from "kubai-icons-react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Settings, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReveal } from "../motion/useReveal";
import { NavLink, useLocation } from "react-router-dom";
import type { CourseItem } from "../api/types";
import { useData } from "../api/useData";
import { useAuth } from "../auth/AuthContext";
import { setPrefCookie, useBoot, useTitle } from "../ssr/context";
import { useLang } from "../i18n";
import { Avatar } from "./Avatar";
import { Mark } from "./Mark";
import { TONE_COLOR } from "./ui/Tile";

const COURSE_TONES = ["#2563eb", "#7c3aed", "#0284c7", "#c2610c", "#e11d48", "#0e8a6a"];

function CollapseIcon({ collapsed, rtl }: { collapsed: boolean; rtl: boolean }) {
  // The sidebar sits on the right in Arabic and on the left in English.
  const Icon = rtl ? (collapsed ? PanelRightOpen : PanelRightClose) : (collapsed ? PanelLeftOpen : PanelLeftClose);
  return <Icon aria-hidden="true" />;
}

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const { t, lang, setLang, pick } = useLang();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const canvas = useRef<HTMLElement>(null);
  useReveal(canvas);
  const boot = useBoot();
  const [collapsed, setCollapsed] = useState(boot.sidebar === "collapsed");
  const toggle = () => {
    setPrefCookie("hadir_sidebar", collapsed ? "open" : "collapsed");
    setCollapsed(!collapsed);
  };
  const location = useLocation();
  const { data, reload } = useData<{ courses: CourseItem[] }>("/api/courses");
  useEffect(() => {
    const refresh = () => { void reload(); };
    window.addEventListener("hadir:courses-changed", refresh);
    return () => window.removeEventListener("hadir:courses-changed", refresh);
  }, [reload]);
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useTitle(`${title} · ${t.product}`);
  const hoursLeft = user?.expiresAt ? Math.max(1, Math.round((Date.parse(user.expiresAt) - Date.now()) / 3.6e6)) : 0;
  const item = (to: string, label: string, Icon: typeof Users, tone: keyof typeof TONE_COLOR, end = false) => (
    <NavLink to={to} end={end} className="nav-item" data-kubai-trigger title={label} aria-label={label}>
      <Icon size={22} color={TONE_COLOR[tone]} trigger="parent" /><span className="nav-label">{label}</span>
    </NavLink>
  );

  const nav = (
    <nav className="nav" aria-label={t.nav.menu}>
      {item("/app", t.nav.today, CalendarCheck, "brand", true)}
      {item("/app/students", t.nav.students, Users, "violet")}
      {item("/app/assistant", t.nav.assistant, Bot, "amber")}
      <p className="nav-group"><BookOpen size={16} color="#64748b" trigger="none" /><span className="nav-label">{t.nav.courses}</span></p>
      <NavLink to="/app/courses/new" className="nav-item" title={t.overview.addCourse} aria-label={t.overview.addCourse}>
        <Plus size={22} aria-hidden="true" /><span className="nav-label">{t.overview.addCourse}</span>
      </NavLink>
      {(data?.courses ?? []).map((c, i) => (
        <NavLink key={c.id} to={`/app/courses/${c.id}`} className="nav-item nav-course" title={pick(c.nameAr, c.nameEn)}
          style={{ ["--course" as string]: COURSE_TONES[i % COURSE_TONES.length] }}>
          <span className="course-dot" />
          <span className="course-mini">{c.code.replace(/\D/g, "").slice(-3) || c.code.slice(0, 3)}</span>
          <span className="nav-course-name">{pick(c.nameAr, c.nameEn)}</span>
          <span className="nav-code">{c.code}</span>
        </NavLink>
      ))}
    </nav>
  );

  const foot = (
    <div className="side-foot">
      <NavLink to="/app/settings" className="nav-item" title={t.settings.heading} aria-label={t.settings.heading}>
        <Settings size={22} aria-hidden="true" /><span className="nav-label">{t.settings.heading}</span>
      </NavLink>
      <button type="button" className="nav-item" onClick={() => setLang(lang === "ar" ? "en" : "ar")} aria-label={t.languageLabel} data-kubai-trigger>
        <Languages size={22} color={TONE_COLOR.blue} trigger="parent" /><span className="nav-label">{t.language}</span>
      </button>
      {user && (
        <div className="user-card">
          <NavLink to="/app/settings" aria-label={t.settings.heading}><Avatar seed={user.email} gender={user.gender} src={user.avatarUrl} size={42} /></NavLink>
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
    <div className={collapsed ? "shell collapsed" : "shell"}>
      <aside className="sidebar">
        <div className="brand-row">
          <a href="/app" className="brand"><Mark size={40} /><span className="nav-label"><strong>{t.product}</strong><span className="brand-line">{t.productLine}</span></span></a>
          <button type="button" className="btn btn-ghost icon-btn collapse-btn" onClick={toggle} aria-expanded={!collapsed}
            aria-label={collapsed ? t.nav.expand : t.nav.collapse} title={collapsed ? t.nav.expand : t.nav.collapse}>
            <CollapseIcon collapsed={collapsed} rtl={lang === "ar"} />
          </button>
        </div>
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
      <main className="canvas" ref={canvas}>
        {user?.isDemo && <p className="demo-banner"><Sparkles aria-hidden="true" />{t.demoBanner(hoursLeft)}</p>}
        {children}
      </main>
    </div>
  );
}
