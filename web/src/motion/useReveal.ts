import { useEffect, type RefObject } from "react";
import { EASE, gsap, reducedMotion, ScrollTrigger } from "./gsap";

/** Reveals every [data-reveal] element inside `root` as it scrolls into view, in staggered batches, including
 * elements that appear later (data arriving after a skeleton). The server HTML pre-hides them only when
 * scripts run (html.js), so without JavaScript everything is simply visible. */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const show = (els: Element[]) => gsap.set(els, { opacity: 1, y: 0, clearProps: "transform" });
    if (reducedMotion()) {
      show([...el.querySelectorAll("[data-reveal]")]);
      return;
    }
    const triggers: ScrollTrigger[] = [];
    let frame = 0;
    const scan = () => {
      frame = 0;
      const fresh = [...el.querySelectorAll("[data-reveal]:not([data-revealed])")];
      if (!fresh.length) return;
      fresh.forEach((n) => n.setAttribute("data-revealed", ""));
      triggers.push(...ScrollTrigger.batch(fresh, {
        start: "top 94%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.07, overwrite: true }),
      }));
    };
    scan();
    const mo = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(scan);
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      cancelAnimationFrame(frame);
      triggers.forEach((t) => t.kill());
    };
  }, [root]);
}
