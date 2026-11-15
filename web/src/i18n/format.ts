import type { Lang } from "./index";

// Arabic text with Western digits, as Palestinian university systems print them.
const locale = (lang: Lang) => (lang === "ar" ? "ar-u-nu-latn" : "en-GB");

export function pct(rate: number | null | undefined): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

export function time(iso: string): string {
  return iso.slice(11, 16);
}

export function day(iso: string, lang: Lang, withWeekday = false): string {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return new Intl.DateTimeFormat(locale(lang), {
    day: "numeric", month: "short", ...(withWeekday ? { weekday: "long" } : {}), timeZone: "Asia/Gaza",
  }).format(d);
}

/** "15/11": day then month, plain digits with no bidi marks, so it reads the same inside an SVG. */
export function shortDay(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d}/${m}`;
}

export function int(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang)).format(n);
}

/** A stable pale hue per person, so a student keeps one tint everywhere. */
export function personHue(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function initials(name: string): string {
  const parts = name.replace(/^(د\.|Dr\.)\s*/, "").split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}
