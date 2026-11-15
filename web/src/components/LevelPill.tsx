import type { Level } from "../api/types";
import { useLang } from "../i18n";

/** Grey for fine, pale pairs for the levels that need attention; one status mark per row. */
export function LevelPill({ level }: { level: Level }) {
  const { t } = useLang();
  return <span className={`pill pill-${level}`}>{t.levels[level]}</span>;
}
