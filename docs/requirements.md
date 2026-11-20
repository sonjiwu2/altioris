# Product requirements

Altioris University is a Russian-language fictional digital dean's office. Its visual source is exactly the 11 PNGs in docs/references/manifest.json from Altioris_Approved_References.zip. Inspect the relevant PNG before changing a screen. Desktop source viewport is 1536 x 1024. Build real DOM, not screenshot backgrounds. The login background is standalone photographic artwork.

Use a collegiate cream/navy/gold system: paper #fcf6ef, ink #07234c, navy #052451, fine warm borders #e8d8c7, gold #b58226, pale green, peach and lavender status surfaces. Great Vibes supplies expressive headings and the wordmark; Marck Script supplies Cyrillic interface lettering; Golos Text supplies technical errors and neutral fallback text. All font files are served locally with their OFL notices. Keep text size generous enough for script legibility.

The desktop shell has a 240 px left rail, vertical shield and Altioris University wordmark, seven icon/text links, and student identity anchored below. Navigation: Расписание, Успеваемость, Преподаватели, Заявки, Чат поддержки, Уведомления, Настройки. The gear for settings is an explicit product requirement. The root route opens the schedule. Profile lives at /profile. Use distinct colorful authored SVG icons with consistent contour weight. Preserve the same portrait for the same identity; never assign one face to different people.

At 980 px and below, use a compact mobile header and collapsible navigation. At 680 px and below, reflow details below lists and default the timetable to a day. Verify 360 x 800, 768 x 1024, 1280 x 1024 and 1536 x 1024. Preserve keyboard access, focus, loading, errors, persistent settings, reduced motion and actual account isolation. UI values come from the authenticated snapshot; screenshot example values are not fixtures.

## Acceptance

- Login accepts the 13 fixed independent demo accounts. Wrong credentials produce a visible error. Logout revokes the session.
- Schedule supports day/week, period navigation, selection, lecture/seminar, room/online format and teacher links. Exams support selection and ICS export.
- Grade calculations exclude pass/fail courses. GPA weights numeric marks by credits; ranking uses the enabled cohort and a deterministic tie rule.
- Teachers have distinct synthetic portraits, biographies, subjects, departments, office, email and consultations. Search and department filters work.
- Requests persist, have actual recorded history and owned PDFs. The same records appear in chat cards and profile documents.
- Notifications have durable read state and linked details. Preferences filter categories without changing stored history.
- Settings support light/dark/system, 100/115/130% text, reduced motion and category switches. Settings survive reload and remain separate for different accounts.
- Profile shows the signed-in student's details and an explicitly labeled sample student card.
- Support responds to status, certificate, grade/ranking, teacher, schedule/online and greeting intents. Human support availability is stated accurately.
- All 11 reference routes remain useful at 360 CSS px, with accessible forms, focus, navigation and controls.

Visual parity is reviewed against matched viewport and state; synthetic content and working responsive behavior can require documented differences.
