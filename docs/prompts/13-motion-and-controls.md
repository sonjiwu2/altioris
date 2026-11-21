# Motion and controls

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings, names, navigation and the wordmark; Marck Script supplies readable handwritten Cyrillic interface text; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Role

Implement 160 ms button/selection feedback and a 260 ms opacity/transform page entrance. Honor OS and user reduced motion. Keep fixed target sizes, semantic button/link behavior, focus and pending/error states.

## Completion

Deliver working code within the assigned scope, the exact checks performed, and any remaining visual or functional differences. Follow DESIGN.md and preserve account ownership and ignored runtime state.

## Latest settings, layout and motion refinement

Preserve the list and outer detail card when the selected lesson, exam, course or teacher changes within the same results. Use a short fade and a small shift on the new content. A desktop academic detail card follows the list at its natural height. Bring the card into view on narrow screens and honor reduced motion.

Keep upright Philosopher. Settings show light, dark and system theme previews with icons, 100/115/130% text and the current session with sign-out. Keep the original colorful icons across the site, with the current session and support conversation using their newer icons. Remove the auxiliary links below the timetable and use the prior compact weekly row minimums (164px on wide desktop and 150px on narrower layouts at 100%). Related tabs animate their content. Selecting an item animates its details only, with no motion when the system requests reduced motion. Account text scale and keyboard focus remain intact.

## Theme and filter transitions

Theme controls use 160 ms feedback and a 330 ms crossfade when the browser supports view transitions. Text size and theme choices preserve focus and are applied independently. On reduced-motion systems the new state appears immediately. Filter changes animate the results area. Choosing an item animates its detail panel only if the displayed item actually changes. Entering a new week animates the calendar and its detail panel.
