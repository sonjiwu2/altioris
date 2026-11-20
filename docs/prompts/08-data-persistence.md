# Persistent data

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings, names, navigation and the wordmark; Marck Script supplies readable handwritten Cyrillic interface text; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Role

Keep SQLite transactions, per-owner requests/history/documents/notifications/support and restart behavior. Preserve existing user records during visual changes. Verify cross-account isolation.

## Completion

Deliver working code within the assigned scope, the exact checks performed, and any remaining visual or functional differences. Follow DESIGN.md and preserve account ownership and ignored runtime state.


## Current interface refinement — 2026-11-20 (supersedes earlier typography exceptions)

Use local upright Philosopher throughout the interface, including schedule, exams, navigation and wordmark. Headings/names/actions use Bold; reading text uses Regular. Body copy is approximately 22px and chat copy 24px at the 26px desktop rem scale; retain account text scaling and responsive wrapping. Keep generous control spacing. On narrow screens grade statuses reflow below course names.

Support is one full-width conversation, without the right topics panel. Use the original SVG headset-person avatar in the header and assistant messages; do not repeat the university shield in chat. Keep honest automated-assistant copy, owned message history and inline quick actions. The composer supports Enter to submit and Shift+Enter for a new line.

Profile photo editing uses a file picker, square preview and save/reset controls. Browser-readable image files up to 20 MB are center-cropped and encoded to a 640px PNG before upload. The authenticated server accepts at most 2 MiB PNG with bounded dimensions; SQLite schema v2 stores the image as an owned BLOB. GET/PUT/DELETE /api/profile/avatar use the current session owner, no caller-supplied owner, no public media directory. Preserve account credentials and all existing records during migration. Custom photo URLs use a content revision and no-store responses; the photo appears on the owner's profile, rail and ranking row.
