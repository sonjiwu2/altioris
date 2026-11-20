# Product requirements

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings and the wordmark; Marck Script supplies Cyrillic interface lettering; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 204–224 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use the paper-sticker illustration system for navigation, settings, course and ranking imagery. Use clean monochrome symbols on compact action controls. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Acceptance

- Login accepts the 13 fixed independent demo accounts. Wrong credentials produce a visible error. Logout revokes the session.
- Schedule adapts to week/day by viewport without a mode switch, supports period navigation, selection, lecture/seminar, room/online format and teacher links. Exams and checkpoints are grouped by term, support selection and export to ICS.
- The gradebook shows the completed 2025/26 year and progress through 2026/27. Grades publish after the corresponding control. Grade calculations exclude pass/fail courses. GPA weights numeric marks by credits; ranking uses the enabled cohort and a deterministic tie rule.
- Teachers have distinct synthetic portraits, compact biographies, one subject each, departments, office, email and consultations. Search updates during input and matches word prefixes within names. Partial patronymic matches require another name part. The department filter combines with the query. Native filter options remain legible in both themes.
- Requests persist, have actual recorded history and owned PDFs. The same records appear in chat cards and profile documents.
- Notifications are produced by actual request status, examination windows and result publication. Their read state persists and links open the relevant item.
- Settings support light, dark and system themes, a 100/115/130% text control, current session and sign-out. Theme and text scale survive reload and stay separate for each account. Animations honor the operating system preference.
- Profile shows the signed-in student's details, initials or an uploaded avatar, a two-sided sample campus pass and two owner-only PDFs for the fictional passport and school diploma. The rail profile link stays separate from the main navigation.
- Support responds to status, certificate, grade/ranking, teacher, schedule/online and greeting intents. Human support availability is stated accurately.
- All 11 reference routes remain useful at 360 CSS px, with accessible forms, focus, navigation and controls.

Visual parity is reviewed against matched viewport and state; synthetic content and working responsive behavior can require documented differences.


## Typography and timetable refinement — 2026-11-20

Philosopher (upright, 700) supplies headings and identity names; Golos Text (400/500/600) supplies readable navigation, controls, body text and numbers. Great Vibes remains in the wordmark and timetable page titles; Marck Script remains only inside /schedule and /schedule/exams. All fonts are served locally with OFL notices. The timetable has no day/week switch: use arrows to move weeks on wide screens and days at 680px and below. Remove subject illustrations from scheduled and pending exam rows only; preserve navigation and functional icons. This user-approved refinement supersedes the original screenshots for these details; keep the 11 reference PNGs and their SHA-256 inventory unchanged.

Selected pairing: Philosopher + Golos Text. At 100% browser zoom use 24px page padding and panel gaps, 26px standard card padding, 56px navigation rows with 14px icon/text gaps, and 104px grade rows. Reflow academic details below the list on tablet to preserve readable spacing. Narrow-screen padding is 14–20px. Preserve the existing palette, portraits, functional controls and handwriting within the timetable.


## Current interface refinement — 2026-11-20 (supersedes earlier typography exceptions)

Use local upright Philosopher throughout the interface, including schedule, exams, navigation and wordmark. Headings/names/actions use Bold; reading text uses Regular. Use a 22px rem baseline at browser zoom 100% and account scale 100%. Retain account text scaling and responsive wrapping. Keep generous control spacing. On narrow screens grade statuses reflow below course names.

Support is one full-width conversation, without the right topics panel. Use the dedicated illustrated Altioris assistant avatar in the conversation header and assistant messages. Keep honest automated-assistant copy, owned message history and inline quick actions. The composer supports Enter to submit and Shift+Enter for a new line.

Profile photo editing uses a file picker, square preview and save/reset controls. Browser-readable image files up to 20 MB are center-cropped and encoded to a 640px PNG before upload. The authenticated server accepts at most 2 MiB PNG with bounded dimensions; SQLite schema v2 stores the image as an owned BLOB. GET/PUT/DELETE /api/profile/avatar use the current session owner, no caller-supplied owner, no public media directory. Preserve account credentials and all existing records during migration. Use initials for students without an upload. Custom photo URLs use a content revision and no-store responses and appear on the owner's profile, rail and ranking row.

## Latest settings, layout and motion refinement

Keep upright Philosopher. Settings show light, dark and system theme previews with icons, 100/115/130% text and the current session with sign-out. Use the paper-sticker imagery throughout the portal and the illustrated assistant in the conversation. Remove the auxiliary links below the timetable and use the prior compact weekly row minimums (164px on wide desktop and 150px on narrower layouts at 100%). Related tabs animate their content. Selecting an item animates its details only, with no motion when the system requests reduced motion. Account text scale and keyboard focus remain intact.
