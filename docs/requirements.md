# Product requirements

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system with paper #fcf6ef, ink #07234c, navy #052451, warm borders #e8d8c7, gold #b58226, and pale green, peach and lavender status surfaces. Serve upright Philosopher locally in Regular and Bold for all interface text. Keep the SIL Open Font License notices with the shipped fonts.

The desktop rail is 244–260 px at 100% text size and widens at larger settings so the inbox label and count fit on one line. It contains the vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use the paper-sticker illustration system for navigation, settings, course and ranking imagery. Use clean monochrome symbols on compact action controls. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, use a left navigation drawer, open selected details in a lower modal sheet, and show the timetable by day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Acceptance

- Login accepts the 13 fixed independent demo accounts. Wrong credentials produce a visible error. Logout revokes the session.
- Schedule adapts to week/day by viewport without a mode switch, supports period navigation, selection, lecture/seminar, room/online format and teacher links. Exams and checkpoints are grouped by term, support selection and export to ICS.
- The gradebook shows the completed 2025/26 year and progress through 2026/27. Grades publish after the corresponding control. Grade calculations exclude pass/fail courses. GPA weights numeric marks by credits; ranking uses the enabled cohort and a deterministic tie rule.
- Teachers have distinct synthetic portraits, compact biographies, one subject each, departments, office, email and consultations. Search updates during input and matches word prefixes within names. Partial patronymic matches require another name part. The department filter combines with the query. Native filter options remain legible in both themes.
- Requests persist across restarts and show each recorded stage with its actual time. The five request types produce distinct account-owned PDFs. Leave and media-lab documents confirm submission. A ready document sends one notification after issuance. Chat cards link to the same request.
- The server publishes campus bulletins and academic notifications on schedule, including while students are signed out. Read state persists and links open the relevant item. Schedule changes validate overlaps before publishing.
- Settings support light, dark and system themes, a 100/115/130% text control, current session and sign-out. Theme and text scale survive reload and stay separate for each account. Animations honor the operating system preference.
- Profile shows the signed-in student's details, initials or an uploaded avatar, a two-sided sample campus pass and two owner-only PDFs for the fictional passport and school diploma. The rail profile link stays separate from the main navigation.
- Support resolves common phrasing and short follow-ups against owned records and campus references. History includes Moscow date dividers, navigation to both ends and read status when an assistant reply follows. Human support availability is stated accurately.
- All 11 reference routes remain useful at 360 CSS px, with accessible forms, focus, navigation and controls.

Visual parity is reviewed against matched viewport and state; synthetic content and working responsive behavior can require documented differences.


## Spacing and timetable

Use 24px page padding and panel gaps on desktop, 26px standard card padding and 14–20px page padding on narrow screens. Reflow academic details below the list on tablet. The timetable uses arrows to move by week on desktop and by day at 680px and below. Show subject-specific artwork in the gradebook. Keep functional illustrations in schedule and exams.

## Interface, support and profile

Use local upright Philosopher throughout the interface, including schedule, exams, navigation and wordmark. Headings/names/actions use Bold; reading text uses Regular. Use a 22px rem baseline at browser zoom 100% and account scale 100%. Retain account text scaling and responsive wrapping. Keep generous control spacing. On narrow screens grade statuses reflow below course names.

Support is one full-width conversation, without the right topics panel. Use the dedicated illustrated Altioris assistant avatar in the conversation header and assistant messages. Keep honest automated-assistant copy, owned message history and inline quick actions. The composer supports Enter to submit and Shift+Enter for a new line.

Profile photo editing uses a file picker, square preview and save/reset controls. Browser-readable image files up to 20 MB are center-cropped and encoded to a 640px PNG before upload. The authenticated server accepts at most 2 MiB PNG with bounded dimensions; SQLite schema v2 stores the image as an owned BLOB. GET/PUT/DELETE /api/profile/avatar use the current session owner, no caller-supplied owner, no public media directory. Preserve account credentials and all existing records during migration. Use initials for students without an upload. Custom photo URLs use a content revision and no-store responses and appear on the owner's profile, rail and ranking row.

## Latest settings, layout and motion refinement

Keep upright Philosopher. Settings show light, dark and system theme previews with icons, 100/115/130% text and the current session with sign-out. Use the paper-sticker imagery throughout the portal and the illustrated assistant in the conversation. Remove the auxiliary links below the timetable and use the prior compact weekly row minimums (164px on wide desktop and 150px on narrower layouts at 100%). Related tabs animate their content. Selecting an item animates its details only, with no motion when the system requests reduced motion. Account text scale and keyboard focus remain intact.
