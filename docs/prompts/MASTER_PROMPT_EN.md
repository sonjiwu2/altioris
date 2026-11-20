# Build Altioris University from the approved visual specification

Act as the product engineer implementing the 11 supplied Altioris University screens. Begin with AGENTS.md and DESIGN.md, then verify docs/references/manifest.json with python scripts/import-references.py. Inspect the actual screen images; their composition defines the interface.

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings, names, navigation and the wordmark; Marck Script supplies readable handwritten Cyrillic interface text; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Implement

1. Render a full-background evening-campus sign-in screen with centered double-bordered card. Use the original shield, locally served script fonts and accessible real inputs.
2. Build the left navigation and student identity. Add the settings gear and preserve active, focus, hover and mobile menu states.
3. Match schedule/exam compositions, including independent time positions, course formats and a detail inspector. Keep dates in Europe/Moscow and calendar exports limited to confirmed events.
4. Implement grades, weighted ranking, staff search/detail, student profile and student card. Show current account data rather than copying picture numbers. Maintain 13 independent fixed logins.
5. Implement owned requests, actual chronological history and private PDF downloads. Present a capable deterministic support bot with useful typed intents, links and inline request cards.
6. Implement notification read state, filtering and details. Implement light/dark/system theme, text scale, reduced motion and notification preferences with persistent account/browser settings.

## Verify and deliver

Run node --test, syntax checks, reference integrity, and a real browser walkthrough at the four target sizes. Check login failure, logout, request creation/download, typed chat, teacher filtering, theme, text scale, notification preferences and browser navigation. Report observable results and remaining differences. Do not describe incomplete work as exact visual parity.

Use the actual repository identity. Keep runtime credentials and private diagnostic files ignored. Rewrite the local source foundation when appropriate and add meaningful follow-up commits for verified behavior. Do not publish or force-push a shared history unless that operation is part of the authorized delivery.
