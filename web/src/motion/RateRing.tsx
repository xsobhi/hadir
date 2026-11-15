import { useEffect, useRef } from "react";
import { pct } from "../i18n/format";
import { gsap, reducedMotion } from "./gsap";

/** A course's attendance as a ring that fills to its rate when it appears; the server draws it already full. */
export function RateRing({ rate }: { rate: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const target = Math.round((rate ?? 0) * 100);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: target, duration: 1.4, ease: "power2.out", delay: 0.25,
      onUpdate: () => el.style.setProperty("--p", String(state.p)),
    });
    return () => { tween.kill(); el.style.setProperty("--p", String(target)); };
  }, [target]);
  return <span ref={ref} className="rate-ring num" style={{ ["--p" as string]: String(target) }}>{pct(rate)}</span>;
}
