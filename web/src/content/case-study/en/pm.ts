import type { CaseStudyPm } from "../types";

export const pmEn: CaseStudyPm = {
  goal:
    "By 31 March 2027, one professor records every class of one course (30 to 40 students) in Hadir for six " +
    "weeks in a row, with no lost marks, and the faculty office accepts the exported register in place of paper.",
  scopeIn: [
    "Professor accounts and a one-click demo workspace with sample data.",
    "Courses with a timetable, a late threshold and an absence limit.",
    "Adding students one by one or by pasting a list.",
    "Scanning ID-card barcodes with a camera or a USB scanner.",
    "Manual corrections, closing a class, the register grid and CSV export.",
    "Printable test ID cards with barcodes.",
    "An assistant that answers from the data and asks before changing it.",
  ],
  scopeOut: [
    "A student app or portal; students do not sign in.",
    "A link to the university's registration system.",
    "Face recognition or location tracking.",
    "Sending notices by email or SMS; notices are saved to the record only.",
    "Accounts for faculty office staff; they receive the CSV export.",
  ],
  deliverables: [
    "The web app: FastAPI and SQLite behind, React and TypeScript in front, in Arabic and English.",
    "A public demo workspace with three sample courses that deletes itself after 48 hours.",
    "The LangGraph assistant with its approval gate and reflection loop.",
    "Printable test ID cards for trying the scanner.",
    "This case study, plus a UX case study, a project charter and an agent design note.",
  ],
  successCriteria: [
    "A professor records a class of 40 students, corrections included, in under five minutes.",
    "No mark is lost or recorded twice during the pilot.",
    "At least four of five professors in the usability study finish a class without help.",
    "Every warning notice saved during the pilot matches the record when the professor checks it.",
    "The faculty office accepts the CSV export in place of the paper sheet.",
  ],
  stakeholders: [
    { who: "Professors", interest: "Less class time on roll call and counts they can trust.", influence: "high" },
    { who: "Students", interest: "Fair marking, excuses recorded, an early warning.", influence: "medium" },
    { who: "Faculty registration office", interest: "One register format and a clear list of barred students.", influence: "medium" },
    { who: "Department head", interest: "Attendance policy applied the same way; approves the pilot.", influence: "high" },
    { who: "University IT", interest: "Where the data lives, who can reach it, how it is backed up.", influence: "medium" },
  ],
  milestones: [
    { name: "Charter, personas and journey map", date: "2026-11-15", status: "done" },
    { name: "MVP: scanning, register, CSV export, assistant", date: "2026-11-15", status: "done" },
    { name: "Usability study with five professors", date: "2026-12-15", status: "next" },
    { name: "Fixes from the study", date: "2027-01-31", status: "planned" },
    { name: "Pilot starts: one course, one professor", date: "2027-02-15", status: "planned" },
    { name: "Pilot review and decision on more courses", date: "2027-03-31", status: "planned" },
  ],
  raci: [
    { task: "Build, host and maintain the app", r: "Developer", a: "Developer", c: "Pilot professor", i: "Department head" },
    { task: "Run the usability study", r: "Developer", a: "Developer", c: "Professors", i: "Department head" },
    { task: "Approve the pilot course", r: "Developer", a: "Department head", c: "Pilot professor", i: "Faculty office" },
    { task: "Take attendance during the pilot", r: "Pilot professor", a: "Pilot professor", c: "Developer", i: "Students" },
    { task: "Accept the term's register", r: "Faculty office", a: "Department head", c: "Pilot professor", i: "Developer" },
  ],
  risks: [
    {
      risk: "The camera cannot read a barcode in a dim hall or on a worn card.",
      likelihood: "medium", impact: "medium",
      mitigation: "A USB scanner as a second route, and any student can be marked by hand from the list.",
    },
    {
      risk: "The internet drops during class.",
      likelihood: "medium", impact: "high",
      mitigation: "Each scan is saved as it happens; the class stays open and missing marks can be added later.",
    },
    {
      risk: "A student scans a friend's card.",
      likelihood: "medium", impact: "medium",
      mitigation: "Scanning happens in front of the professor, who sees each name; the pilot will check how often.",
    },
    {
      risk: "The assistant states a wrong number or date.",
      likelihood: "medium", impact: "high",
      mitigation: "Facts come only from tools, letters go through a critique loop, and every change needs approval.",
    },
    {
      risk: "Professors keep using paper.",
      likelihood: "medium", impact: "high",
      mitigation: "A register that looks like the paper sheet, no new hardware, and a pilot with one course first.",
    },
    {
      risk: "Student data is exposed.",
      likelihood: "low", impact: "high",
      mitigation: "Each professor reaches only their own rows; scrypt passwords, HttpOnly cookies, no biometrics.",
    },
  ],
  retrospective: {
    wentWell: [
      "The attendance rules live in one module, so the screens and the assistant always agree.",
      "Using the existing ID card meant no new hardware and nothing to hand out.",
      "LangGraph's interrupt() kept the approval gate to a few lines of code.",
      "The one-click demo with nine weeks of sample data makes the product easy to try.",
    ],
    improve: [
      "No professor has used Hadir yet; the usability study has to come before new features.",
      "The personas and journey map are assumptions until the study tests them.",
      "The notice critic is itself a model; a code check of numbers and dates would be stronger.",
      "There are no automated tests yet for the attendance rules and scan results.",
    ],
  },
};
