import type { CaseStudyIntro } from "../types";

export const introEn: CaseStudyIntro = {
  title: "Hadir: the complete website case study",
  lead:
    "Hadir is an Arabic-first attendance system for university classes: the professor scans the barcode on a " +
    "student's ID card and the student is marked present or late. This page shows where four Coursera " +
    "certificates went into building it, and what is still only planned.",
  author: {
    name: "Sobhi Ashraf Al-Firani",
    line: "A student in Gaza. I also build Pabbel, a small suite of privacy-first apps.",
  },
  certs: [
    {
      name: "Foundations of User Experience (UX) Design",
      issuer: "Google",
      date: "2026-11-12",
      verifyUrl: "https://coursera.org/verify/5NQIP1WW19KH",
      applied: [
        "Three personas and a five-stage journey map for the professor, written before the screens.",
        "\"How might we\" questions that kept scanning as the main task and made scan feedback clear.",
        "Accessibility from the start: every scan result is given by sound, colour and text, in Arabic or English.",
        "A usability study plan with goals, questions and KPIs, ready for the first professors.",
      ],
    },
    {
      name: "Foundations of Project Management",
      issuer: "Google",
      date: "2026-11-09",
      verifyUrl: "https://coursera.org/verify/C5RZVWCW7JAN",
      applied: [
        "A charter with a SMART goal, scope in and out, deliverables and success criteria.",
        "The project life cycle laid out as milestones: MVP done, usability study next, a one-course pilot after.",
        "A stakeholder map and a RACI chart by role, from the professor to the faculty office.",
        "A risk register and a retrospective, including what still has to be proven.",
      ],
    },
    {
      name: "Fundamentals of Building AI Agents",
      issuer: "IBM",
      date: "2026-11-09",
      verifyUrl: "https://coursera.org/verify/926J2QLCV145",
      applied: [
        "A tool-calling agent in the ReAct pattern: the model picks a tool, reads its result, then answers.",
        "Five read tools with typed arguments and clear descriptions; they return data, never prose.",
        "A system prompt that makes the tools the only source of numbers, names and dates.",
        "Independent tool calls run together, and a failing tool returns an error message instead of a crash.",
      ],
    },
    {
      name: "Agentic AI with LangChain and LangGraph",
      issuer: "IBM",
      date: "2026-11-11",
      verifyUrl: "https://coursera.org/verify/5KBKM6LLUPHE",
      applied: [
        "A LangGraph state graph with agent, tools and review nodes and conditional routing between them.",
        "A reflection loop as its own small graph: draft, critique, revise, at most two rounds.",
        "Human-in-the-loop approval with interrupt() before any tool that changes the record.",
        "SQLite checkpoints per conversation, and token-by-token streaming of answers and tool calls.",
      ],
    },
  ],
};
