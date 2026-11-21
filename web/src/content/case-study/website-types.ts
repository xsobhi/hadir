export type WebsiteStudy = {
  title: string; summary: string; status: string; role: string; screensTitle: string;
  screens: { name: string; route: string; purpose: string; decision: string }[];
  flowTitle: string; flow: string[];
  architectureTitle: string; architecture: { title: string; body: string }[];
  iterationTitle: string; iterations: { title: string; body: string }[];
  evidenceTitle: string; evidence: string[]; limitsTitle: string; limits: string[];
};
