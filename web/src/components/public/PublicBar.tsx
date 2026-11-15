import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useLang } from "../../i18n";
import { LangSwitch } from "../LangSwitch";
import { Mark } from "../Mark";

/** The plain bar on public pages: wordmark, two links, one action. */
export function PublicBar() {
  const { t } = useLang();
  const { user } = useAuth();
  return (
    <header className="public-bar">
      <Link to="/" className="brand"><Mark /><span><strong>{t.product}</strong><span className="brand-line">{t.productLine}</span></span></Link>
      <nav className="public-links">
        <Link to="/about" className="btn btn-ghost">{t.nav.caseStudy}</Link>
        <LangSwitch />
        {user ? <Link to="/app" className="btn btn-primary">{t.nav.today}</Link> : <Link to="/signin" className="btn">{t.auth.welcome.signIn}</Link>}
      </nav>
    </header>
  );
}
