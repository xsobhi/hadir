import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { app as appAr } from "./ar/app";
import { auth as authAr } from "./ar/auth";
import { courses as coursesAr } from "./ar/courses";
import { live as liveAr } from "./ar/live";
import { people as peopleAr } from "./ar/people";
import { app as appEn } from "./en/app";
import { auth as authEn } from "./en/auth";
import { courses as coursesEn } from "./en/courses";
import { live as liveEn } from "./en/live";
import { people as peopleEn } from "./en/people";
import { setPrefCookie, useBoot } from "../ssr/context";

export type Lang = "ar" | "en";
const dictionaries = {
  ar: { ...appAr, auth: authAr, ...coursesAr, live: liveAr, ...peopleAr },
  en: { ...appEn, auth: authEn, ...coursesEn, live: liveEn, ...peopleEn },
};
export type Dict = (typeof dictionaries)["en"];

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; pick: (ar: string, en: string) => string };
const LangContext = createContext<Ctx | null>(null);
export function LangProvider({ children }: { children: ReactNode }) {
  const boot = useBoot();
  const [lang, setLangState] = useState<Lang>(boot.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setPrefCookie("hadir_lang", l);
    setLangState(l);
  }, []);
  const value = useMemo<Ctx>(() => ({
    lang, setLang, t: dictionaries[lang] as Dict,
    pick: (ar: string, en: string) => (lang === "ar" ? ar || en : en || ar),
  }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang outside LangProvider");
  return ctx;
}
