# Altioris University — visual contract

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings, names, navigation and the wordmark; Marck Script supplies readable handwritten Cyrillic interface text; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Screen map

| Reference | Route | Composition |
| --- | --- | --- |
| 01-login.png | Signed out | Full evening cloister photograph; centered cream card, gold double edge, crest and script form |
| 02-schedule.png | /schedule | Tabs, date picker and aligned day columns with a lesson inspector |
| 03-exams.png | /schedule/exams | Semester picker, dated assessment cards and detail inspector |
| 04-grades.png | /grades | Icon, discipline, grade and result rows; selected course, retake and teacher |
| 05-ranking.png | /grades/ranking | Three illustrated metrics, table of actual demo accounts, highlighted signed-in student |
| 06-teachers.png | /teachers | Search and department filter; portrait list; biography and consultation detail |
| 07-requests.png | /requests | Status tabs and requests; chronological history; private PDF action |
| 08-support-chat.png | /support | Full-width conversation with inline quick actions and a headset avatar |
| 09-notifications.png | /notifications | Read-state filters; illustrated list and linked detail |
| 10-settings.png | /settings | Three theme choices with previews, text scale and current session in a single column |
| 11-student-profile.png | /profile | Portrait identity banner; academic details; navy/gold student card; documents |

## Interaction contract

Use 160 ms control feedback and 260 ms page entrance with cubic-bezier(.22,.7,.26,1). Use opacity and transform only for entrances. Honor both the OS reduced-motion preference and the account's browser setting. Keep native dialogs, form labels, URL state, history navigation, and visible focus. Buttons remain at least 44 CSS px high on touch screens.

Theme and text scale are per account and browser. Authentication remains an HttpOnly server session. The notification center shows all categories. The support assistant uses deterministic intents and owned records. It does not pretend that a live operator or video conference is connected.


## Typography and timetable refinement — 2026-11-20

Philosopher (upright, 700) supplies headings and identity names; Golos Text (400/500/600) supplies readable navigation, controls, body text and numbers. Great Vibes remains in the wordmark and timetable page titles; Marck Script remains only inside /schedule and /schedule/exams. All fonts are served locally with OFL notices. The timetable has no day/week switch: use arrows to move weeks on wide screens and days at 680px and below. Remove subject illustrations from scheduled and pending exam rows only; preserve navigation and functional icons. This user-approved refinement supersedes the original screenshots for these details; keep the 11 reference PNGs and their SHA-256 inventory unchanged.

Selected pairing: Philosopher + Golos Text. At 100% browser zoom use 24px page padding and panel gaps, 26px standard card padding, 56px navigation rows with 14px icon/text gaps, and 104px grade rows. Reflow academic details below the list on tablet to preserve readable spacing. Narrow-screen padding is 14–20px. Preserve the existing palette, portraits, functional controls and handwriting within the timetable.


## Current interface refinement — 2026-11-20 (supersedes earlier typography exceptions)

Use local upright Philosopher throughout the interface, including schedule, exams, navigation and wordmark. Headings/names/actions use Bold; reading text uses Regular. Body copy is approximately 22px and chat copy 24px at the 26px desktop rem scale; retain account text scaling and responsive wrapping. Keep generous control spacing. On narrow screens grade statuses reflow below course names.

Support is one full-width conversation, without the right topics panel. Use the original SVG headset-person avatar in the header and assistant messages; do not repeat the university shield in chat. Keep honest automated-assistant copy, owned message history and inline quick actions. The composer supports Enter to submit and Shift+Enter for a new line.

Profile photo editing uses a file picker, square preview and save/reset controls. Browser-readable image files up to 20 MB are center-cropped and encoded to a 640px PNG before upload. The authenticated server accepts at most 2 MiB PNG with bounded dimensions; SQLite schema v2 stores the image as an owned BLOB. GET/PUT/DELETE /api/profile/avatar use the current session owner, no caller-supplied owner, no public media directory. Preserve account credentials and all existing records during migration. Custom photo URLs use a content revision and no-store responses; the photo appears on the owner's profile, rail and ranking row.

## Latest settings, layout and motion refinement

Keep upright Philosopher. Settings show light, dark and system theme previews with icons, 100/115/130% text and the current session with sign-out. Keep the original colorful icons across the site, with the current session and support conversation using their newer icons. Remove the auxiliary links below the timetable and use the prior compact weekly row minimums (164px on wide desktop and 150px on narrower layouts at 100%). Related tabs animate their content. Selecting an item animates its details only, with no motion when the system requests reduced motion. Account text scale and keyboard focus remain intact.

## Theme and filter transitions

Theme controls use 160 ms feedback and a 330 ms crossfade when the browser supports view transitions. Text size and theme choices preserve focus and are applied independently. On reduced-motion systems the new state appears immediately. Filter changes animate the results area. Choosing an item animates its detail panel only if the displayed item actually changes. Entering a new week animates the calendar and its detail panel.
