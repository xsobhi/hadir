import { useLang } from "../i18n";

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useLang();
  return (
    <div className="load-error" role="alert">
      <span>{t.loadFailed}</span>
      <button type="button" className="btn btn-ghost" onClick={onRetry}>{t.retry}</button>
    </div>
  );
}

/** Flat grey bars at the real size of what will load, so nothing jumps when data lands. */
export function Skeleton({ rows = 4, height = 44 }: { rows?: number; height?: number }) {
  return (
    <div className="skeleton" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <span key={i} style={{ height: height - 16 }} />)}
    </div>
  );
}
