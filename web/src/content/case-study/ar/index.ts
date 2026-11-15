import type { CaseStudy } from "../types";
import { aiAr } from "./ai";
import { introAr } from "./intro";
import { pmAr } from "./pm";
import { uxAr } from "./ux";

export const caseStudyAr: CaseStudy = { ...introAr, ux: uxAr, pm: pmAr, ai: aiAr };
