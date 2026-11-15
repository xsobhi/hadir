import { useEffect, useRef } from "react";
import { EASE, gsap, reducedMotion } from "./gsap";

/** A number that counts up from zero when it appears. The server renders the final figure, so the HTML is right
 * before any script runs; the count only plays in the browser. */
export function CountUp({ value, suffix = "", duration = 1.2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !Number.isFinite(value)) return;
    const state = { v: 0 };
    const tween = gsap.to(state, {
      v: value, duration, ease: EASE, delay: 0.15,
      onUpdate: () => { el.textContent = `${Math.round(state.v)}${suffix}`; },
    });
    return () => {
      tween.kill();
      el.textContent = `${value}${suffix}`;
    };
  }, [value, suffix, duration]);
  return <span ref={ref} className="num">{`${value}${suffix}`}</span>;
}
