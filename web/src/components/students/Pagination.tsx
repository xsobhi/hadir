import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../i18n";

const SIZES = [10, 20, 50];

/** Pages with numbers (and gaps for long runs), previous/next, the range shown and how many per page. */
export function Pagination({ page, size, total, onPage, onSize }: {
  page: number; size: number; total: number; onPage: (p: number) => void; onSize: (s: number) => void;
}) {
  const { t, lang } = useLang();
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, total);
  const nums = Array.from({ length: pages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const rtl = lang === "ar";
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  return (
    <nav className="pager" aria-label={t.pager.page(page)}>
      <span className="pager-range num">{t.pager.showing(from, to, total)}</span>
      <div className="pager-pages">
        <button type="button" className="pager-btn" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label={t.pager.prev}><Prev aria-hidden="true" /></button>
        {nums.map((n, i) => (
          <span key={n} className="pager-group">
            {i > 0 && n - nums[i - 1] > 1 && <span className="pager-gap" aria-hidden="true">…</span>}
            <button type="button" className={n === page ? "pager-btn active" : "pager-btn"} onClick={() => onPage(n)}
              aria-current={n === page ? "page" : undefined} aria-label={t.pager.page(n)}><span className="num">{n}</span></button>
          </span>
        ))}
        <button type="button" className="pager-btn" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label={t.pager.next}><Next aria-hidden="true" /></button>
      </div>
      <label className="pager-size">
        <span>{t.pager.perPage}</span>
        <select className="input" value={size} onChange={(e) => onSize(Number(e.target.value))}>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </nav>
  );
}
