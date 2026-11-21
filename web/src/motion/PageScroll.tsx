import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ScrollTrigger } from "./gsap";

/** Leave wheel, touch and keyboard scrolling to the browser; reset only when entering another page. */
export function PageScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.classList.add("js-ready"); // the app is live: reveals are now GSAP's job
  }, []);
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname]);
  return <>{children}</>;
}
