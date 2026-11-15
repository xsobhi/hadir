import { useLang } from "../../i18n";

/** "Sign in with Pabbel": a full page navigation to the server, which starts the OAuth handshake. */
export function PabbelButton({ className = "" }: { className?: string }) {
  const { t, lang } = useLang();
  return (
    <a className={`btn btn-lg btn-pabbel ${className}`} href={`/api/auth/pabbel/start?lang=${lang}`}>
      <img src="/pabbel-mark.svg" alt="" width={24} height={24} />
      {t.auth.pabbel}
    </a>
  );
}
