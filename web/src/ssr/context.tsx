import { createContext, useContext, useEffect } from "react";
import type { Lang } from "../i18n";

/** What the server knew when it rendered the page: API responses by path, the language and the sidebar state. */
export type Boot = { data: Record<string, unknown>; lang: Lang; sidebar: "open" | "collapsed" };
export const BootContext = createContext<Boot>({ data: {}, lang: "ar", sidebar: "open" });
export const useBoot = () => useContext(BootContext);

/** Server-side only: pages write their <title> here while rendering. */
export const HeadContext = createContext<{ title: string } | null>(null);

export function useTitle(title: string) {
  const head = useContext(HeadContext);
  if (head) head.title = title;
  useEffect(() => {
    document.title = title;
  }, [title]);
}

/** Preferences live in cookies so the server renders the same language and layout the browser will show. */
export function setPrefCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
