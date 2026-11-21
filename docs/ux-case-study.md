# Hadir: UX case study

Hadir (حاضر) is an Arabic-first attendance system for university classes. The professor scans the barcode on
a student's ID card and the student is marked present or late. This note applies the Google course
*Foundations of User Experience (UX) Design* (earned 2026-11-12,
[verify](https://coursera.org/verify/5NQIP1WW19KH)) to the project.

**Status, stated plainly:** the MVP was built on 2026-11-15. No completed professor usability study is documented. The personas
and journey map below are archetypes and assumptions, and the usability study at the end is a plan.
No research findings are reported here.

## Problem

In many lecture halls attendance is still a roll call or a sign-in sheet passed along the rows. It takes
time from the class, a friend can sign for someone who is absent, and the sheet has to be counted by hand
before anyone knows who is close to the absence limit. By then a student may already be barred from the
final exam.

## Personas (archetypes, not real people)

### Dr. Salma, assistant professor, Faculty of IT
Teaches three courses with about 100 students in all; brings a laptop and a phone to class.
- **Goals:** take attendance without losing teaching time; see who is close to the limit while there is
  still time to talk to them; hand the faculty office a clean register at the end of term.
- **Frustrations:** calling 38 names at the start of every class; signatures for students who are not in
  the room; counting absences across paper sheets by hand.

### Layan, second-year software engineering student
Rarely misses class, but has a medical report for two absences this term.
- **Goals:** have excused absences recorded as excused; know where she stands before she reaches the
  limit; be marked fairly when she is a few minutes late.
- **Frustrations:** not knowing whether a late arrival counts as an absence; hearing about a warning only
  near the end of term; excuse papers lost between offices.

### Mr. Khaled, faculty registration office
Collects attendance from every section at the end of term and prepares the list of barred students.
- **Goals:** registers from every professor in one format; a clear record when a student appeals; a quick
  view of who is past the limit in each course.
- **Frustrations:** sheets in different layouts and hard-to-read handwriting; appeals where no one wrote
  down the excuse; typing paper registers into a spreadsheet.

Hadir has no student or office accounts. Layan benefits through fair marks and warning letters, and
Khaled through the CSV export.

## Journey map: the professor's class

| Stage | Doing | Feeling | Opportunity in Hadir |
|---|---|---|---|
| Before class | Opens Hadir on her phone, checks the next class | Wants to start on time | Home screen shows the next class and students close to the limit |
| Open the class | Taps start while students are still coming in | Rushed | Opened near its timetabled time, lateness counts from the scheduled start |
| Scan cards | Scans each card with the camera or a USB scanner | Focused, in a noisy room | Each scan answers with sound, colour and the student's name; repeats are caught |
| Fix exceptions | A forgotten card; a medical note | Unsure | Any mark can be set by hand, with a note for an excuse |
| Close and follow up | Closes the class, checks the register or asks the assistant | Relieved, but worried about repeat absentees | Closing marks the unscanned absent; the assistant drafts a warning she approves |

## How might we

- How might we take attendance for 40 students without eating into the lecture?
- How might we make every scan result clear in a noisy hall without relying on colour?
- How might we let a student know they are close to the limit before they pass it?
- How might we keep the professor in control when an AI assistant suggests a change?

## The rules the interface has to explain

- Each course allows a share of the term's classes as unexcused absences, 25% by default:
  16 weeks x 2 meetings = 32 classes, so 8 absences.
- Excused absences never count. A late arrival (after the late threshold, 10 minutes by default) counts
  as attended.
- Levels: **watch** from half the allowance, **warning** from three quarters, **over** past the limit,
  where the student may be barred from the final exam.

## Design decisions visible in the product

1. **The ID card is the key.** The barcode (Code 128 of the student number) is already on the university
   card, so no new cards or devices are needed.
2. **Two ways to scan.** The phone or laptop camera, or a USB barcode scanner that types the number and
   presses Enter. Repeat scans and cards of students not enrolled in the course are rejected with
   feedback.
3. **A consistent visual language.** Tajawal typography, teal `#0e8a6a` primary actions and status colors
   with labels support an Arabic-first interface.
4. **Feedback you can hear and read.** Every scan answers with a sound, a colour and a line of text naming
   the student and the result.
5. **A register like the paper sheet.** Students by classes, one mark per cell, as on the roll-call sheet
   professors already keep. The CSV export opens in Excel with Arabic names intact.
6. **The assistant asks first.** It reads freely, but excusing an absence or saving a warning notice waits
   for Approve on a card.
7. **Mistakes are cheap.** Any mark can be corrected by hand, with a note when an absence is excused.

## Accessibility and equity

- Scan results never rely on colour alone: each comes with a sound and a line of text.
- Large tap targets, so attendance can be taken on a phone while standing.
- A full right-to-left layout in Arabic and left-to-right in English, switched in one place.
- Tajawal typography supports Arabic and Latin text.
- Native scrolling preserves familiar browser behavior. A full contrast and screen-reader audit is still planned.
- A USB scanner works like a keyboard, so the camera and touch screen are optional.
- Arabic is the default language. Sample names, courses and excuse notes exist in Arabic, and the
  assistant writes warning notices in formal Arabic when the interface is in Arabic.

## Known limitations

- The camera needs a reasonably lit card; a worn or glossy barcode may need the USB scanner or a manual
  mark.
- Scanning needs a network connection to the server.
- The card proves which card was scanned, not who carried it. The professor sees each name as it is
  scanned.
- Demo workspaces hold sample data only and are deleted after 48 hours.

## Usability study plan (not yet run)

**Goals**
- Find out whether a professor can run a whole class in Hadir without help.
- Measure how long recording a class takes compared with their current method.
- Find where scan feedback is missed or misread in a real hall.
- Check that the assistant's approval card is understood before anything changes.

**Research questions**
- How long does it take to record 30 to 40 students by scanning?
- What does the professor do when a card does not scan?
- Are the levels (watch, warning, over the limit) clear without explanation?
- Do professors read a drafted warning before approving it?

**KPIs**
- Task success: open, scan, correct and close a class without help.
- Time on task: median seconds per student recorded.
- Error rate: misreads and manual fixes per class.
- System Usability Scale (SUS) score after the session.

**Method.** Moderated sessions, in person where possible. Each professor runs a real or mock class in
Hadir on their own device while thinking aloud, then answers a short interview and the SUS questionnaire.

**Participants.** Five professors who take attendance in classes of 25 or more, and two faculty office
staff. None have been recruited yet.

**What happens with the results.** Fixes from the study are planned for 2027-01-31, before a one-course
pilot starting 2027-02-15 (see `project-charter.md`).

## Full website update, 2026-11-21

See [the complete website case study](website-case-study.md) for the application screens, profile editing,
record management, architecture, feedback, validation and remaining limits.
