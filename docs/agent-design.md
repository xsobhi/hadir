# Hadir: assistant design

Applies two IBM courses: *Fundamentals of Building AI Agents* (earned 2026-11-09,
[verify](https://coursera.org/verify/926J2QLCV145)) and *Agentic AI with LangChain and LangGraph*
(earned 2026-11-11, [verify](https://coursera.org/verify/5KBKM6LLUPHE)).

The assistant answers a professor's questions about their own courses, students and attendance, drafts
warning letters, and makes two kinds of change, each only after the professor approves it. Code:
`backend/hadir/agent/` and `backend/hadir/api/assistant.py`.

## Model

DeepSeek (`deepseek-chat` by default), an OpenAI-compatible chat model, called through `langchain-openai`'s
`ChatOpenAI` with the base URL, key and model name from the environment. Any OpenAI-compatible endpoint can
be swapped in. Taking attendance never calls the model; only the assistant does.

## The main graph (ReAct with an approval gate)

A LangGraph `StateGraph` over `MessagesState`, compiled with a SQLite checkpointer.

```
START --> [agent] --(no tool calls)-------------------------> END
            |  ^
            |  +--------------------- [tools] <--------------+
            |                            ^                   | approve
            +--(read tools only)---------+                   |
            |                                                |
            +--(any write tool)------> [review] -------------+
                                          |
                                          +--(decline)--> [agent]
```

| Node | What it does |
|---|---|
| `agent` | Sends the system prompt, the trimmed history and the tool list (`bind_tools`) to the model. The reply is either an answer or one or more tool calls. |
| `tools` | LangGraph's `ToolNode` runs the requested tools. With `handle_tool_errors=True`, a failing tool returns an error message to the model instead of ending the turn. |
| `review` | Reached when any requested call is a write tool. Calls `interrupt()` with the pending actions, which pauses the run. Resumed with `Command(resume={"approved": bool})`. |

Routing after `agent`: no tool calls ends the turn; only read tools go straight to `tools`; any write tool
goes to `review`. On approve, `review` sends the whole batch to `tools`. On decline, every pending call is
answered with a `ToolMessage` saying the professor declined, and control returns to `agent`, which tells
the professor in words.

This is the ReAct loop: the model reasons about the question, acts by calling a tool, observes the result,
and repeats until it can answer. Several independent read tools can be requested in one step.

## Tools

| Tool | Kind | What it does |
|---|---|---|
| `list_courses` | read | Courses with enrolment, classes held, attendance rate, allowance per student, students per level, next class |
| `at_risk_students` | read | Students at watch, warning or over the limit, for one course or all (top 40) |
| `student_record` | read | Finds a student by number or part of a name (Arabic or English); with one match, counts per course and the dates of every absence, late arrival and excuse |
| `session_report` | read | Who was present, late, absent or excused in one class, by date or the latest |
| `attendance_trend` | read | Attendance rate for each week of the term, for one course or all |
| `draft_warning_notice` | reflection | Gathers the facts and runs the reflection graph; returns the draft and the number of critique rounds; saves nothing |
| `excuse_absence` | write | Changes one recorded absence to excused with a reason; refuses if that class is not recorded as absent |
| `save_warning_notice` | write | Saves a notice to the student's record |

Each tool has typed arguments and a docstring the model reads, and returns compact data rather than prose.
The rules behind the numbers (allowance, levels, late counts as attended, excused never counts) live in
`backend/hadir/stats.py`, which the screens and the tools share.

## The approval gate (human in the loop)

1. The professor asks for a change, for example "excuse Layan's absence on 2026-11-03, medical report".
2. The model calls `excuse_absence` with exact arguments. The system prompt tells it to call the tool
   directly rather than ask "shall I?" in text, because the app asks.
3. `review` interrupts. The browser receives an `approval` event and shows a card with the action and its
   arguments (for a notice, the full text).
4. The run is paused in the checkpoint. Reloading the page restores the conversation and the card. New
   messages to that conversation are refused until the professor decides.
5. Approve runs the tool; decline returns "declined" to the model. Either way the conversation continues.

Changes made this way are stored with the method `assistant`, so the record shows them apart from scans
(`scan`), manual marks (`manual`) and absences filled in at closing (`auto`).

## The reflection loop (warning notices)

`draft_warning_notice` runs its own small LangGraph:

```
START --> [draft] --> [critique] --(APPROVED, or 2nd round done)--> END
                         ^    |
                         |    +--(problems listed)--> [revise]
                         |                               |
                         +-------------------------------+
```

| Node | What it does |
|---|---|
| `draft` | Writes a 90 to 140 word notice from a facts block built from the database: student, course, unexcused absences out of the allowance, absence dates, remaining allowance, the consequence past the limit, how to submit an excuse, the professor's name and title. Formal Arabic or English, matching the interface. |
| `critique` | A second call at temperature 0 acting as a strict editor: every number and date must match the facts, nothing invented, respectful tone, 90 to 140 words, says how to submit an excuse. Replies `APPROVED` or lists the problems. |
| `revise` | Rewrites the notice to fix each listed problem, then returns to `critique`. |

The loop stops when the critic approves or after two critique rounds, so at most one revision. Each step
is streamed to the browser as a progress event. The tool returns the draft for the professor to read;
saving it is a separate write tool behind the approval gate.

Limitation: the critic is itself a model. It catches many mismatches, but it is not proof. The professor's
approval is the real check, and a code-level comparison of numbers and dates is on the improvement list.

## Streaming and memory

- Each turn runs `graph.stream(..., stream_mode=["messages", "updates", "custom"])` and is sent to the
  browser as server-sent events: answer tokens from the `agent` node only, each tool call and its result,
  reflection progress, and approval requests.
- Conversations are threads. State is checkpointed per thread in SQLite (`SqliteSaver`), so a thread can be
  reloaded with its full transcript and any pending approval.
- Deleting a thread deletes its checkpoints. Expired demo workspaces are removed hourly with their threads.

## Safeguards

- **Approval before writes.** Write tools never run without the professor pressing Approve.
- **Scoped tools.** Every tool reads the professor's id from the run's config, set by the server from the
  signed-in session. The model never supplies it, so a tool can only reach that professor's rows.
- **Facts from tools only.** The system prompt forbids guessing numbers, names or dates. "No match" or
  "several matches" from a tool is passed back to the professor as a question.
- **Scope of conversation.** Requests unrelated to teaching, courses or attendance are declined in one
  sentence.
- **Limits.** 40 assistant messages per account per day and 1,500 for the whole site; a message is at most
  2,000 characters; 24 graph steps per turn; one running turn per thread.
- **Trimmed history.** Only the last 40 messages, starting at a user message, are sent to the model.
- **Plain failure.** Each tool's database work is a single transaction, and if the model or a tool fails
  mid-stream the browser receives an error event to show in the conversation.

## Example questions

- Which students are at warning level or over the limit?
- Who was absent from the last CS340 class?
- How has attendance in CS231 changed week by week?
- Draft a warning notice for the most-absent student in CS365 and save it to their record.

The last one exercises everything: `at_risk_students`, then `draft_warning_notice` (reflection), then
`save_warning_notice`, which stops at the approval card.
