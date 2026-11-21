# Hadir: project charter

Applies the Google course *Foundations of Project Management* (earned 2026-11-09,
[verify](https://coursera.org/verify/C5RZVWCW7JAN)). Owner: Sobhi Ashraf Al-Firani, developer.

**Status on 2026-11-15:** the MVP is built. Everything after that date below is planned, not done. No
university has agreed to a pilot yet, and no completed professor usability study is documented.

## Background

Attendance in many lecture halls is a roll call or a paper sheet. It costs class time, invites signing for
absent friends, and leaves the absence count to be worked out by hand at the end of term, often too late to
warn a student before they are barred from the final exam. Hadir replaces the sheet with a scan of the
barcode already printed on the student's university ID card.

## Goal (SMART)

By **31 March 2027**, one professor records every class of one course (30 to 40 students) in Hadir for
**six weeks in a row**, with no lost marks, and the faculty office accepts the exported register in place
of paper.

- **Specific:** one professor, one course, attendance only.
- **Measurable:** every class recorded for six weeks; zero lost marks; register accepted.
- **Achievable:** the MVP already covers taking, correcting and exporting attendance.
- **Relevant:** it replaces the paper sheet, the main source of lost time and errors.
- **Time-bound:** pilot from 2027-02-15 to 2027-03-31.

## Scope

**In scope**
- Professor accounts and a one-click demo workspace with sample data.
- Courses with a timetable, a late threshold (default 10 minutes) and an absence limit (default 25%).
- Adding students one by one or by pasting a list.
- Scanning ID-card barcodes with a camera or a USB scanner.
- Manual corrections, closing a class (unscanned students become absent), the register grid, CSV export.
- Printable test ID cards with barcodes.
- An assistant that answers from the data and asks before changing it.

**Out of scope**
- A student app or portal; students do not sign in.
- A link to the university's registration system.
- Face recognition or location tracking.
- Sending notices by email or SMS; notices are saved to the record only.
- Accounts for faculty office staff; they receive the CSV export.

## Deliverables

- The web app: FastAPI and SQLite on the server, React and TypeScript (Vite) in the browser, Arabic by
  default with an English switch, hosted at hadir.xsobhi.com behind Caddy.
- A public demo workspace with three sample courses, about 96 sample students and nine weeks of recorded
  attendance, deleted automatically after 48 hours.
- The LangGraph assistant with its approval gate and reflection loop (see `agent-design.md`).
- Printable test ID cards for trying the scanner.
- This charter, `ux-case-study.md`, `agent-design.md` and `website-case-study.md`.

## Success criteria

- A professor records a class of 40 students, corrections included, in under five minutes.
- No mark is lost or recorded twice during the pilot.
- At least four of five professors in the usability study finish a class without help.
- Every warning notice saved during the pilot matches the record when the professor checks it.
- The faculty office accepts the CSV export in place of the paper sheet.

## Stakeholders

| Stakeholder | Interest | Influence |
|---|---|---|
| Professors | Less class time on roll call; counts they can trust | High |
| Students | Fair marking, excuses recorded, an early warning | Medium |
| Faculty registration office | One register format; a clear list of barred students | Medium |
| Department head | Attendance policy applied the same way; approves the pilot | High |
| University IT | Where the data lives, who can reach it, how it is backed up | Medium |

## Life cycle and milestones

| Phase | Milestone | Date | Status |
|---|---|---|---|
| Initiate and plan | Charter, personas and journey map | 2026-11-15 | Done |
| Execute | MVP: scanning, register, CSV export, assistant | 2026-11-15 | Done |
| Execute | Usability study with five professors | 2026-12-15 | Next |
| Execute | Fixes from the study | 2027-01-31 | Planned |
| Execute | Pilot starts: one course, one professor | 2027-02-15 | Planned |
| Close | Pilot review and decision on more courses | 2027-03-31 | Planned |

The MVP was built before any user testing so that the study has something real to test. The trade-off is
recorded in the retrospective.

## RACI

R = responsible, A = accountable, C = consulted, I = informed. Roles, not names.

| Task | R | A | C | I |
|---|---|---|---|---|
| Build, host and maintain the app | Developer | Developer | Pilot professor | Department head |
| Run the usability study | Developer | Developer | Professors | Department head |
| Approve the pilot course | Developer | Department head | Pilot professor | Faculty office |
| Take attendance during the pilot | Pilot professor | Pilot professor | Developer | Students |
| Accept the term's register | Faculty office | Department head | Pilot professor | Developer |

## Risk register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | The camera cannot read a barcode in a dim hall or on a worn card | Medium | Medium | USB scanner as a second route; any student can be marked by hand |
| 2 | The internet drops during class | Medium | High | Each scan is saved as it happens; the class stays open; missing marks can be added later |
| 3 | A student scans a friend's card | Medium | Medium | Scanning happens in front of the professor, who sees each name; the pilot will check how often |
| 4 | The assistant states a wrong number or date | Medium | High | Facts only from tools; letters go through a critique loop; every change needs approval |
| 5 | Professors keep using paper | Medium | High | Register looks like the paper sheet; no new hardware; one-course pilot first |
| 6 | Student data is exposed | Low | High | Each professor reaches only their own rows; scrypt password hashes; HttpOnly session cookie; no biometrics |

Also tracked: the assistant depends on an outside model provider. Taking attendance never does, and the
assistant has a daily message limit per account and for the whole site.

## Change management

The pilot keeps the change small on purpose: one course, the card students already carry, and a register
that looks like the sheet the professor already knows. The faculty office keeps working in Excel through
the CSV export. A wider rollout is a decision for the pilot review, not an assumption of this charter.

## Retrospective (after the MVP, 2026-11-15)

**Went well**
- The attendance rules live in one module, so the screens and the assistant always agree.
- Using the existing ID card meant no new hardware and nothing to hand out.
- LangGraph's `interrupt()` kept the approval gate to a few lines of code.
- The one-click demo with nine weeks of sample data makes the product easy to try.

**To improve**
- No completed professor usability study is documented; recruitment and pilot approval remain pending.
- The personas and journey map are assumptions until the study tests them.
- The notice critic is itself a model; a code check of numbers and dates would be stronger.
- Record and profile regression tests are in place; attendance rules and real scanners need broader coverage.
