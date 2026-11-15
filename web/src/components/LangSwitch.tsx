import { Languages } from "lucide-react";
import { useLang } from "../i18n";

export function LangSwitch({ className = "btn btn-ghost" }: { className?: string }) {
  const { t, lang, setLang } = useLang();
  return (
    <button type="button" className={className} onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      aria-label={t.languageLabel} lang={lang === "ar" ? "en" : "ar"}>
      <Languages aria-hidden="true" />
      <span>{t.language}</span>
    </button>
  );
}
