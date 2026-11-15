import { BookOpen, CalendarCheck, FileText, LogOut, Menu, MessageSquareText, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useData } from "../api/useData";
import type { CourseItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { useLang } from "../i18n";
import { initials } from "../i18n/format";
import { LangSwitch } from "./LangSwitch";
import { Mark } from "./Mark";

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const { t, pick } = useLang();
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

  const nav = (
    <nav className="nav" aria-label={t.nav.menu}>
      <NavLink to="/app" end className="nav-item"><CalendarCheck aria-hidden="true" />{t.nav.today}</NavLink>
      <p className="nav-group">{t.nav.courses}</p>
      {(data?.courses ?? []).map((c) => (
        <NavLink key={c.id} to={`/app/courses/${c.id}`} className="nav-item nav-course">
          <BookOpen aria-hidden="true" />
          <span className="nav-course-name">{pick(c.nameAr, c.nameEn)}</span>
          <span className="nav-code ltr">{c.code}</span>
        </NavLink>
      ))}
      <p className="nav-group" aria-hidden="true" />
      <NavLink to="/app/students" className="nav-item"><Users aria-hidden="true" />{t.nav.students}</NavLink>
      <NavLink to="/app/assistant" className="nav-item"><MessageSquareText aria-hidden="true" />{t.nav.assistant}</NavLink>
    </nav>
  );

  const foot = (
    <div className="side-foot">
      <NavLink to="/about" className="nav-item"><FileText aria-hidden="true" />{t.nav.caseStudy}</NavLink>
      <LangSwitch className="nav-item nav-button" />
      {user && (
        <div className="user-row">
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <span className="user-text">
            <span className="user-name">{user.name}</span>
            <span className="user-dept">{user.department || user.email}</span>
          </span>
          <button type="button" className="btn btn-ghost icon-btn" onClick={() => void signOut()} aria-label={t.nav.signOut}>
            <LogOut aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <a href="/app" className="brand"><Mark /><span><strong>{t.product}</strong><span className="brand-line">{t.productLine}</span></span></a>
        {nav}
        {foot}
      </aside>
      <header className="topbar">
        <a href="/app" className="brand brand-small" aria-label={t.product}><Mark size={26} /></a>
        <span className="topbar-title">{title}</span>
        <button type="button" className="btn btn-ghost icon-btn" onClick={() => setOpen(true)} aria-label={t.nav.menu} aria-expanded={open}>
          <Menu aria-hidden="true" />
        </button>
      </header>
      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <div className="sheet-head">
            <span className="brand"><Mark size={26} /><strong>{t.product}</strong></span>
            <button type="button" className="btn btn-ghost icon-btn" onClick={() => setOpen(false)} aria-label={t.nav.close}><X aria-hidden="true" /></button>
          </div>
          {nav}
          {foot}
        </div>
      )}
      <main className="canvas">
        {user?.isDemo && <p className="notice">{t.demoBanner(hoursLeft)}</p>}
        {children}
      </main>
    </div>
  );
}
