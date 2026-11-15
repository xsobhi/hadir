import type { CaseStudyAi } from "../types";

export const aiEn: CaseStudyAi = {
  summary:
    "The assistant is a LangGraph agent that answers questions about the professor's own courses by calling " +
    "tools, never from memory. It may read freely; anything that changes the record stops and waits for the " +
    "professor's approval. The model is DeepSeek, an OpenAI-compatible chat model, through langchain-openai.",
  nodes: [
    { name: "agent", does: "Sends the system prompt, the recent history and the tool list to the model; it answers or asks for tools." },
    { name: "tools", does: "Runs the requested tools and hands the results back to agent; a failure comes back as an error message." },
    { name: "review", does: "When any requested tool writes, pauses the graph with interrupt() until the professor approves or declines." },
    { name: "draft", does: "Reflection graph: writes a 90 to 140 word warning notice from the student's record." },
    { name: "critique", does: "Reflection graph: a strict editor checks every number and date against the record and approves or lists problems." },
    { name: "revise", does: "Reflection graph: rewrites the notice to fix each listed problem, then returns it to critique." },
  ],
  tools: [
    { name: "list_courses", kind: "read", does: "Courses with enrolment, classes held, attendance rate, allowance, students per level and the next class." },
    { name: "at_risk_students", kind: "read", does: "Students at watch, warning or over the limit, in one course or all of them." },
    { name: "student_record", kind: "read", does: "Finds a student by number or name and lists every absence, late arrival and excuse with dates." },
    { name: "session_report", kind: "read", does: "Who was present, late, absent or excused in one class, by date or the latest one." },
    { name: "attendance_trend", kind: "read", does: "Attendance rate for each week of the term." },
    { name: "draft_warning_notice", kind: "reflection", does: "Drafts a warning letter through the draft, critique, revise loop; it does not save anything." },
    { name: "excuse_absence", kind: "write", does: "Changes one recorded absence to excused with a reason, after approval." },
    { name: "save_warning_notice", kind: "write", does: "Saves a notice to the student's record, after approval." },
  ],
  safeguards: [
    "Write tools run only after Approve on the approval card; Decline tells the model the action was refused.",
    "A pending approval is saved with the conversation, so it survives a page reload.",
    "Tools take the professor from the signed-in session, not from the model, so they reach only that professor's rows.",
    "The prompt forbids guessing: numbers, names and dates come from tools, and an unclear name gets a question back.",
    "A daily limit of 40 messages per account, with the history trimmed to the last 40 messages.",
    "Changes made through the assistant are stored with their own method, apart from scans and manual marks.",
  ],
  examples: [
    "Which students are at warning level or over the limit?",
    "Who was absent from the last CS340 class?",
    "How has attendance in CS231 changed week by week?",
    "Draft a warning notice for the most-absent student in CS365 and save it to their record.",
  ],
};
