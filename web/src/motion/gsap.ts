import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP and its scroll plugin are registered in the browser only; the server renders the final, still state.
export const isBrowser = typeof window !== "undefined";
if (isBrowser) gsap.registerPlugin(ScrollTrigger, useGSAP);

export const reducedMotion = () => isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const EASE = "power3.out";
export { gsap, ScrollTrigger, useGSAP };
