// Content model for the "How Hadir was built" case study page. Text only; the page renders it.

export type Lang = "ar" | "en";
export type Level = "low" | "medium" | "high";

export type Cert = {
  name: string;
  issuer: string;
  date: string; // ISO date the certificate was earned
  verifyUrl: string;
  applied: string[]; // concrete places in this project where the course shows
};

export type Persona = {
  name: string;
  role: string; // says it is a persona (an archetype, not a real person)
  context: string;
  goals: string[];
  frustrations: string[];
};

export type JourneyStage = { stage: string; doing: string; feeling: string; opportunity: string };

export type ResearchPlan = {
  goals: string[];
  questions: string[];
  kpis: string[];
  method: string;
  participants: string;
};

export type CaseStudyUx = {
  problem: string;
  personas: Persona[];
  journey: JourneyStage[];
  hmw: string[];
  decisions: { title: string; body: string }[];
  accessibility: string[];
  researchPlan: ResearchPlan; // a plan, not findings: no study has been run yet
};

export type Milestone = { name: string; date: string; status: "done" | "next" | "planned" };

export type CaseStudyPm = {
  goal: string;
  scopeIn: string[];
  scopeOut: string[];
  deliverables: string[];
  successCriteria: string[];
  stakeholders: { who: string; interest: string; influence: Level }[];
  milestones: Milestone[];
  raci: { task: string; r: string; a: string; c: string; i: string }[];
  risks: { risk: string; likelihood: Level; impact: Level; mitigation: string }[];
  retrospective: { wentWell: string[]; improve: string[] };
};

export type CaseStudyAi = {
  summary: string;
  nodes: { name: string; does: string }[];
  tools: { name: string; kind: "read" | "write" | "reflection"; does: string }[];
  safeguards: string[];
  examples: string[];
};

export type CaseStudyIntro = {
  title: string;
  lead: string;
  author: { name: string; line: string };
  certs: Cert[];
};

export type CaseStudy = CaseStudyIntro & {
  ux: CaseStudyUx;
  pm: CaseStudyPm;
  ai: CaseStudyAi;
};
