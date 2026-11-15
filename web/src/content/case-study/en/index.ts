import type { CaseStudy } from "../types";
import { aiEn } from "./ai";
import { introEn } from "./intro";
import { pmEn } from "./pm";
import { uxEn } from "./ux";

export const caseStudyEn: CaseStudy = { ...introEn, ux: uxEn, pm: pmEn, ai: aiEn };
