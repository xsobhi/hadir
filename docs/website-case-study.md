# Hadir — complete website case study

Project website: https://hadir.xsobhi.com

The public case-study page was removed on 21 November 2026 at the owner's request. This document remains as project documentation.

Hadir brings course setup, student records, attendance and follow-up into one Arabic-first workspace. The design starts with a professor preparing a course and ends with a register they can review and export. This case study covers the full product, its implementation and the changes made after owner feedback.

Built 15 November 2026; expanded 21 November 2026. This is a working project with sample data and technical checks. Personas, usability targets and future pilot dates below are proposals; no completed classroom study or measured time saving is claimed.

Project by Sobhi Ashraf Al-Firani: product direction and review, with AI-assisted design, implementation and testing. The scope connects UX foundations, project management and agent development in a single usable application.

## One complete journey

1. Sign in or open a demo
2. Create a course and set its rules
3. Add students or paste a roster
4. Start a class and scan or mark attendance
5. Correct exceptions and close the class
6. Review the register and students at risk
7. Approve any assistant changes, then export the record

## Screen-by-screen decisions

### Welcome

Route: `/`

Explain ID-card attendance and offer a way to try it immediately.

The demo creates an isolated sample workspace. It is separate from a professor's real records and expires after 48 hours.

### Sign in and sign up

Route: `/signin · /signup`

Enter a personal workspace with a password or Sign in with Pabbel.

New accounts begin empty, with an optional sample-data action. Pabbel sign-in links an account without replacing later Hadir profile edits.

### Today dashboard

Route: `/app`

See the next class, course list, weekly attendance and students near the absence limit.

The next action is visible first. Add a course remains available after the first course exists.

### New course

Route: `/app/courses/new`

Set names, code, section, room, meeting days and attendance thresholds.

Defaults reduce setup work. Validation explains missing meeting days or an existing code/section instead of a generic failure.

### Course register

Route: `/app/courses/:id`

Review class-by-class marks, attendance rates and the allowed absence count.

A familiar student-by-class grid supports review; CSV export keeps Arabic text readable in spreadsheets.

### Roster

Route: `/app/courses/:id?tab=roster`

Add one student, paste a list or manage existing students.

Removing an enrollment keeps past marks. Deleting the student is a separate action with an explicit explanation of its wider effect.

### Course settings

Route: `/app/courses/:id?tab=settings`

Edit subject details or delete the course.

Edit and Delete also appear in the course header. Deletion removes its sessions and marks, while the students remain available.

### Students

Route: `/app/students`

Search and filter by number, name, course, major, year and risk level.

Filters and pagination live in the URL. Students with no current course are still listed and can be edited or deleted.

### Student record

Route: `/app/students/:id`

Review attendance across courses, saved notices and the student's test ID card.

Editing changes the same student across courses without losing history. Permanent deletion requires a confirmation describing enrollments, marks and notices.

### Live attendance

Route: `/app/live/:id`

Scan cards with a camera or USB reader, or mark students manually.

Text, color and sound distinguish accepted, repeated and unknown scans. Closing a class records unmarked students as absent.

### Printable ID cards

Route: `/app/cards/:id`

Provide sample barcode cards for trying the attendance flow.

A dedicated print layout avoids printing navigation. These are test cards, not official university credentials.

### Assistant

Route: `/app/assistant · /app/assistant/:threadId`

Ask about attendance, inspect tool activity and review proposed changes.

Read tools supply records. Saving a notice or excusing an absence pauses for approval; draft notices are not sent as messages.

### User settings

Route: `/app/settings`

Edit the local profile and upload, adjust or reset a personal picture.

The crop editor supports drag, arrow keys, zoom and rotation. Only a 512 × 512 image is uploaded, and the server independently validates dimensions.

## How the website works

### Server-rendered interface

React and TypeScript render through a Node server. It fetches each page's data using the visitor's session cookie; the browser hydrates that same view. Arabic is RTL, English is LTR, and language/sidebar preferences are available to the server.

### Records and ownership

FastAPI validates requests and SQLite stores accounts, courses, enrollments, sessions, marks and notices. Ownership checks restrict records to the signed-in professor; foreign keys make confirmed deletions consistent.

### A controlled assistant

LangGraph routes between the model, data tools and an approval step, with SQLite checkpoints and streamed updates. A separate draft–critique–revise loop reviews warning text. Approval does not eliminate model errors; professors must inspect proposed changes.

### Profile pictures

The original photo stays in browser memory. The server accepts only small supported images, verifies the 512px limit and re-encodes pixels to WebP without source metadata. The stored avatar is served through an authenticated endpoint.

### Delivery

The Vite client and SSR bundles plus the Python API deploy to two Windows services on OVH behind Caddy. The database and runtime configuration live outside the replaced application folder.

## What feedback changed

### The second course had no entry point

The owner reported being unable to create subjects. Inspection found that only an empty workspace showed the Add button. The fix adds permanent dashboard and sidebar links and clearer duplicate/validation messages.

### Management actions were incomplete

Course edit/delete existed in settings but were hard to discover; student edit/delete were missing. Explicit controls now appear where the records are viewed, with a separate enrollment-removal action.

### Scrolling should feel familiar

The owner found the smooth-scroll effect annoying. Lenis was removed so wheel, touch and keyboard scrolling use normal browser behavior.

### A profile should be personal

User settings now provide local profile edits and a photo editor with repositioning, zoom, rotation and a 512 × 512 output limit. The default illustrated picture remains available.

## Technical validation and evidence

- Regression tests cover subject creation and edits, normalized duplicates, invalid inputs and ownership restrictions.
- Student tests cover shared edits across courses, attendance preservation, duplicate numbers, deletion cascades and visibility after the last course is deleted.
- Profile tests cover saved details, repeat Pabbel sign-in, authenticated image access, invalid/oversized images and resetting the picture.
- The web build checks TypeScript and both client/server bundles. Browser checks exercise the visible controls, reload persistence, photo cropping and Arabic/English responsive views.
- These checks establish technical behavior. They do not measure usability, accessibility conformance, classroom reliability or learning outcomes.

## Limits and next evaluation

- A professor study and classroom pilot are still proposed. Measure task completion, time per student, correction rates and satisfaction before claiming an improvement over paper.
- Attendance needs a working connection; there is no offline queue. A barcode identifies a card, not the person carrying it.
- There are no student/registrar portals, university-system integration or automatic email/SMS notices. Course thresholds are local settings, not a statement of university policy.
- Full attendance-rule, hardware-scanner and assistant evaluation should follow the record-management regression suite. Screen-reader and contrast audits are still needed.

## Supporting documents

- [UX study, personas and research plan](ux-case-study.md)
- [Project charter, scope, milestones and risks](project-charter.md)
- [Agent design and approval flow](agent-design.md)

## Reproducing the API checks

```sh
PYTHONPATH=backend .venv/bin/python -m unittest discover -s backend/tests -v
npm run build --prefix web
```

Tests use a disposable database and do not contact the model or change production records.
