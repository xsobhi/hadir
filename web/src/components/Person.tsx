import { useLang } from "../i18n";
import { Avatar } from "./Avatar";

/** A student as themselves: their default profile picture, the name, and the card number under it. */
export function Person({ nameAr, nameEn, number, gender, sub, size = 40 }: {
  nameAr: string; nameEn: string; number: string; gender?: string; sub?: string; size?: number;
}) {
  const { pick } = useLang();
  return (
    <span className="person">
      <Avatar seed={number} gender={gender} size={size} />
      <span className="person-text">
        <span className="person-name">{pick(nameAr, nameEn)}</span>
        <span className="person-sub num">{sub ?? number}</span>
      </span>
    </span>
  );
}
