import { caseStudyAr } from "./ar";
import { caseStudyEn } from "./en";
import type { CaseStudy, Lang } from "./types";

export type { CaseStudy, Lang, Level } from "./types";

export const caseStudy: Record<Lang, CaseStudy> = { ar: caseStudyAr, en: caseStudyEn };
