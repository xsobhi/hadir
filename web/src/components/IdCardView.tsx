import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import { useLang } from "../i18n";
import { initials, personHue } from "../i18n/format";

type Student = { number: string; nameAr: string; nameEn: string; major: string };

/** A sample university ID card at credit-card proportions, its Code 128 barcode encoding the student number. */
export function IdCardView({ student }: { student: Student }) {
  const { t } = useLang();
  const bars = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (bars.current) {
      JsBarcode(bars.current, student.number, {
        format: "CODE128", displayValue: false, margin: 0, height: 52, width: 2, background: "transparent", lineColor: "#0a0a0a",
      });
    }
  }, [student.number]);
  const hue = personHue(student.number);
  return (
    <figure className="idcard" aria-label={`${t.cards.studentCard}: ${student.nameAr}, ${student.number}`}>
      <div className="idcard-top">
        <span className="idcard-uni" lang="ar" dir="rtl">{t.cards.universityAr}</span>
        <span className="idcard-uni" lang="en" dir="ltr">{t.cards.university}</span>
      </div>
      <div className="idcard-body">
        <span className="idcard-photo" style={{ background: `hsl(${hue} 30% 88%)`, color: `hsl(${hue} 30% 30%)` }} aria-hidden="true">
          {initials(student.nameEn)}
        </span>
        <div className="idcard-names">
          <p className="idcard-ar" lang="ar" dir="rtl">{student.nameAr}</p>
          <p className="idcard-en" lang="en" dir="ltr">{student.nameEn}</p>
          <p className="idcard-major">{student.major}</p>
        </div>
      </div>
      <div className="idcard-code" dir="ltr">
        <svg ref={bars} aria-hidden="true" />
        <span className="num">{student.number}</span>
      </div>
    </figure>
  );
}
