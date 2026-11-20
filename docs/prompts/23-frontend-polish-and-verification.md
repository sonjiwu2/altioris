# Final visual pass

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings, names, navigation and the wordmark; Marck Script supplies readable handwritten Cyrillic interface text; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Role

Verify every screenshot route, failed/empty/pending states, loaded local fonts and images, filtering, keyboard focus, mobile sizing and theme/text preferences. Correct observed differences; do not claim literal pixel identity without measurement.

## Completion

Deliver working code within the assigned scope, the exact checks performed, and any remaining visual or functional differences. Follow DESIGN.md and preserve account ownership and ignored runtime state.


## Typography and timetable refinement — 2026-11-20

Philosopher (upright, 700) supplies headings and identity names; Golos Text (400/500/600) supplies readable navigation, controls, body text and numbers. Great Vibes remains in the wordmark and timetable page titles; Marck Script remains only inside /schedule and /schedule/exams. All fonts are served locally with OFL notices. The timetable has no day/week switch: use arrows to move weeks on wide screens and days at 680px and below. Remove subject illustrations from scheduled and pending exam rows only; preserve navigation and functional icons. This user-approved refinement supersedes the original screenshots for these details; keep the 11 reference PNGs and their SHA-256 inventory unchanged.

Selected pairing: Philosopher + Golos Text. At 100% browser zoom use 24px page padding and panel gaps, 26px standard card padding, 56px navigation rows with 14px icon/text gaps, and 104px grade rows. Reflow academic details below the list on tablet to preserve readable spacing. Narrow-screen padding is 14–20px. Preserve the existing palette, portraits, functional controls and handwriting within the timetable.
