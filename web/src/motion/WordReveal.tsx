import { useEffect, useRef, type ElementType } from "react";
import { gsap, reducedMotion } from "./gsap";

/** A headline that arrives word by word, rising out of a blur. Words, not letters, so Arabic keeps its joins. */
export function WordReveal({ text, as: Tag = "h1", className = "", delay = 0.1 }: {
  text: string; as?: ElementType; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const words = ref.current?.querySelectorAll(".wr-word");
    if (!words?.length) return;
    if (reducedMotion()) { gsap.set(words, { opacity: 1, y: 0, filter: "none" }); return; }
    const tl = gsap.fromTo(words, { opacity: 0, y: 28, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "power4.out", stagger: 0.09, delay });
    return () => { tl.kill(); };
  }, [text, delay]);
  return (
    <Tag ref={ref} className={`word-reveal ${className}`} aria-label={text}>
      {text.split(/(\s+)/).map((w, i) => (/\s+/.test(w) ? w : <span key={i} className="wr-word" aria-hidden="true">{w}</span>))}
    </Tag>
  );
}
