import type { CaseStudyUx } from "../types";

export const uxEn: CaseStudyUx = {
  problem:
    "In many lecture halls attendance is still a roll call or a sign-in sheet passed along the rows. It takes " +
    "time from the class, a friend can sign for someone who is absent, and the sheet has to be counted by hand " +
    "before anyone knows who is close to the limit. By then a student may already be barred from the final exam.",
  personas: [
    {
      name: "Dr. Salma",
      role: "Persona: assistant professor, Faculty of IT",
      context: "Teaches three courses with about 100 students in all, and brings a laptop and a phone to class.",
      goals: [
        "Take attendance without losing teaching time.",
        "See who is close to the absence limit while there is still time to talk to them.",
        "Hand the faculty office a clean register at the end of term.",
      ],
      frustrations: [
        "Calling 38 names at the start of every class.",
        "Signatures on the sheet for students who are not in the room.",
        "Counting absences across paper sheets by hand.",
      ],
    },
    {
      name: "Layan",
      role: "Persona: second-year software engineering student",
      context: "Rarely misses class, but has a medical report for two absences this term.",
      goals: [
        "Have excused absences recorded as excused, not counted against her.",
        "Know where she stands before she reaches the limit.",
        "Be marked fairly when she is a few minutes late.",
      ],
      frustrations: [
        "Not knowing whether a late arrival counts as an absence.",
        "Hearing about a warning only near the end of term.",
        "Excuse papers that get lost between offices.",
      ],
    },
    {
      name: "Mr. Khaled",
      role: "Persona: officer in the faculty registration office",
      context: "Collects attendance from every section at the end of term and prepares the list of barred students.",
      goals: [
        "Get registers from every professor in one format.",
        "Have a clear record when a student appeals a decision.",
        "See quickly who is past the limit in each course.",
      ],
      frustrations: [
        "Sheets in different layouts and hard-to-read handwriting.",
        "Appeals where no one wrote down the excuse.",
        "Typing paper registers into a spreadsheet.",
      ],
    },
  ],
  journey: [
    {
      stage: "Before class",
      doing: "Opens Hadir on her phone and checks the next class.",
      feeling: "Wants to start on time.",
      opportunity: "The home screen shows the next class and the students who are close to the limit.",
    },
    {
      stage: "Open the class",
      doing: "Taps start while students are still coming in.",
      feeling: "Rushed.",
      opportunity: "Opened near its timetabled time, lateness counts from the scheduled start, not from her tap.",
    },
    {
      stage: "Scan cards",
      doing: "Scans each ID card with the camera or a USB scanner.",
      feeling: "Focused, in a noisy room.",
      opportunity: "Each scan answers with a sound, a colour and the student's name; repeats are caught.",
    },
    {
      stage: "Fix exceptions",
      doing: "A student forgot the card; another brings a medical note.",
      feeling: "Unsure, and does not want to fight the tool.",
      opportunity: "Any mark can be set by hand: present, late, absent or excused with a note.",
    },
    {
      stage: "Close and follow up",
      doing: "Closes the class, then checks the register or asks the assistant.",
      feeling: "Relieved, but worried about the students who keep missing.",
      opportunity: "Closing marks the unscanned as absent; the assistant drafts a warning she approves.",
    },
  ],
  hmw: [
    "How might we take attendance for 40 students without eating into the lecture?",
    "How might we make every scan result clear in a noisy hall without relying on colour?",
    "How might we let a student know they are close to the limit before they pass it?",
    "How might we keep the professor in control when an AI assistant suggests a change?",
  ],
  decisions: [
    {
      title: "The ID card is the key",
      body: "The barcode on the existing university card holds the student number, so no new cards or devices are needed.",
    },
    {
      title: "Two ways to scan",
      body: "The phone or laptop camera, or a USB barcode scanner that types the number and presses Enter.",
    },
    {
      title: "One blue for the main data",
      body: "The interface is ink on paper; blue #1d5fbf is kept for the current class and today's numbers.",
    },
    {
      title: "Feedback you can hear",
      body: "Every scan answers with a sound, a colour and a line of text naming the student and the result.",
    },
    {
      title: "A register like the paper sheet",
      body: "Students by classes, one mark per cell, as on the roll-call sheet; its CSV opens in Excel with Arabic names intact.",
    },
    {
      title: "The assistant asks first",
      body: "It can read freely, but excusing an absence or saving a notice waits for Approve on a card.",
    },
  ],
  accessibility: [
    "Scan results never rely on colour alone: each one comes with a sound and a line of text.",
    "Large tap targets, so attendance can be taken on a phone while standing.",
    "A full right-to-left layout in Arabic and left-to-right in English, from one switch.",
    "IBM Plex Sans Arabic, which reads well in both Arabic and Latin script.",
    "The data blue has about 6:1 contrast on white, above the 4.5:1 WCAG AA level for text.",
    "A USB scanner works like a keyboard, so the camera and the touch screen are optional.",
  ],
  researchPlan: {
    goals: [
      "Find out whether a professor can run a whole class in Hadir without help.",
      "Measure how long recording a class takes compared with their current method.",
      "Find where scan feedback is missed or misread in a real hall.",
      "Check that the assistant's approval card is understood before anything changes.",
    ],
    questions: [
      "How long does it take to record 30 to 40 students by scanning?",
      "What does the professor do when a card does not scan?",
      "Are the levels (watch, warning, over the limit) clear without explanation?",
      "Do professors read a drafted warning before approving it?",
    ],
    kpis: [
      "Task success: open, scan, correct and close a class without help.",
      "Time on task: median seconds per student recorded.",
      "Error rate: misreads and manual fixes per class.",
      "System Usability Scale (SUS) score after the session.",
    ],
    method:
      "Moderated sessions, in person where possible: each professor runs a real or mock class in Hadir on " +
      "their own device while thinking aloud, then answers a short interview and the SUS questionnaire.",
    participants:
      "Five professors who take attendance in classes of 25 or more and two faculty office staff. " +
      "None have been recruited yet.",
  },
};
