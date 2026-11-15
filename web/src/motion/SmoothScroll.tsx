import Lenis from "lenis";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { gsap, reducedMotion, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;

/** Lenis smooth scrolling for the page, driven by GSAP's ticker so ScrollTrigger reveals stay in step.
 * Inner scrollers (the roster, the chat, the register) opt out with data-lenis-prevent. Off for reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.classList.add("js-ready"); // the app is live: reveals are now GSAP's job
    if (reducedMotion()) return;
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  useEffect(() => {
    // A new page starts at the top, without a smooth scroll back up.
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);
  return <>{children}</>;
}
