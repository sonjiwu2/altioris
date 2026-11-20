---
name: altioris-typography-and-density
description: Use upright Philosopher headings and Golos Text navigation, controls and body text. Use Philosopher in the wordmark, timetable and exams too; previous handwritten exceptions have been superseded. Check long labels, comfortable spacing at 100% zoom and mobile legibility.
---

# Typography And Density

Read DESIGN.md in the project root and inspect the matching PNG in docs/references. Use only the current 11-screen manifest.

Use upright Philosopher headings and Golos Text navigation, controls and body text. Use Philosopher in the wordmark, timetable and exams too; previous handwritten exceptions have been superseded. Check long labels, comfortable spacing at 100% zoom and mobile legibility.

Preserve synthetic identities, runtime credential privacy and real data ownership. Report actual checks and remaining differences. Use the same instruction path for future refinements.


## Typography and timetable refinement — 2026-11-20

Philosopher (upright, 700) supplies headings and identity names; Golos Text (400/500/600) supplies readable navigation, controls, body text and numbers. Great Vibes remains in the wordmark and timetable page titles; Marck Script remains only inside /schedule and /schedule/exams. All fonts are served locally with OFL notices. The timetable has no day/week switch: use arrows to move weeks on wide screens and days at 680px and below. Remove subject illustrations from scheduled and pending exam rows only; preserve navigation and functional icons. This user-approved refinement supersedes the original screenshots for these details; keep the 11 reference PNGs and their SHA-256 inventory unchanged.

Selected pairing: Philosopher + Golos Text. At 100% browser zoom use 24px page padding and panel gaps, 26px standard card padding, 56px navigation rows with 14px icon/text gaps, and 104px grade rows. Reflow academic details below the list on tablet to preserve readable spacing. Narrow-screen padding is 14–20px. Preserve the existing palette, portraits, functional controls and handwriting within the timetable.


## Current interface refinement — 2026-11-20 (supersedes earlier typography exceptions)

Use local upright Philosopher throughout the interface, including schedule, exams, navigation and wordmark. Headings/names/actions use Bold; reading text uses Regular. Use a 22px rem baseline at browser zoom 100% and account scale 100%. Retain account text scaling and responsive wrapping. Keep generous control spacing. On narrow screens grade statuses reflow below course names.

Support is one full-width conversation, without the right topics panel. Use the original SVG headset-person avatar in the header and assistant messages; do not repeat the university shield in chat. Keep honest automated-assistant copy, owned message history and inline quick actions. The composer supports Enter to submit and Shift+Enter for a new line.

Profile photo editing uses a file picker, square preview and save/reset controls. Browser-readable image files up to 20 MB are center-cropped and encoded to a 640px PNG before upload. The authenticated server accepts at most 2 MiB PNG with bounded dimensions; SQLite schema v2 stores the image as an owned BLOB. GET/PUT/DELETE /api/profile/avatar use the current session owner, no caller-supplied owner, no public media directory. Preserve account credentials and all existing records during migration. Use initials for students without an upload. Custom photo URLs use a content revision and no-store responses and appear on the owner's profile, rail and ranking row.

## Latest settings, layout and motion refinement

Keep upright Philosopher. Settings show light, dark and system theme previews with icons, 100/115/130% text and the current session with sign-out. Keep the original colorful icons across the site, with the current session and support conversation using their newer icons. Remove the auxiliary links below the timetable and use the prior compact weekly row minimums (164px on wide desktop and 150px on narrower layouts at 100%). Related tabs animate their content. Selecting an item animates its details only, with no motion when the system requests reduced motion. Account text scale and keyboard focus remain intact.
