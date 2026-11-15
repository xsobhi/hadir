import { useLang } from "../i18n";
import { initials, personHue } from "../i18n/format";

/** A student as themselves: a stable pale tint, initials, the name and the card number under it. */
export function Person({ nameAr, nameEn, number, sub }: { nameAr: string; nameEn: string; number: string; sub?: string }) {
  const { pick } = useLang();
  const name = pick(nameAr, nameEn);
  const hue = personHue(number);
  return (
    <span className="person">
      <span className="avatar avatar-sm" style={{ background: `hsl(${hue} 40% 92%)`, color: `hsl(${hue} 35% 28%)` }}
        aria-hidden="true">{initials(name)}</span>
      <span className="person-text">
        <span className="person-name">{name}</span>
        <span className="person-sub num">{sub ?? number}</span>
      </span>
    </span>
  );
}
