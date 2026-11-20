# Typography and spacing refinement — 2026-11-20

The user selected upright **Philosopher + Golos Text** after three font explorations. Philosopher Bold supplies headings and names; Golos Text supplies navigation, controls, body text and numbers. The wordmark and the timetable/exams retain handwriting. The user limited icon removal to subject illustrations in scheduled and pending exam rows.

The timetable no longer has a day/week switch. Arrows move seven days on wide screens and one day at 680px and below. The display updates when the viewport crosses that breakpoint. Existing lesson selection, exam detail, calendar export and navigation icons remain available.

Spacing at 100% browser zoom uses 24px page padding/gaps, 26px standard card padding, 56px navigation targets with 14px icon/text separation, and 104px grade rows. Narrow screens use smaller padding and stacked detail cards. Colors, portraits, account records and backend behavior were not changed.

## Checks actually performed

- Existing Node test suite: 13 tests passed.
- Reference importer: all 11 original PNG SHA-256 checks passed; archive and manifest unchanged.
- Guide validator: 30 published guides passed.
- Real Chrome via Playwright CLI: 10 authenticated routes at 1536×1024, 1280×1024, 768×1024 and 360×800, with no document horizontal overflow, broken images or page JavaScript exceptions in the completed 40-case pass.
- Verified computed Philosopher headings and Golos Text interface fonts, with Marck Script/Great Vibes retained on the timetable routes.
- Verified absence of day/week controls and subject SVGs in exam rows, arrow navigation and mobile day display.
- Additional dark-theme/130% text checks for settings, grades, teachers and requests at 1536px and 360px: no document overflow after correcting the long teacher heading and card text.
- Verified live viewport reflow, one-day/seven-day arrow destinations and visible keyboard focus.
- Inspected rendered desktop grades/settings, mobile grades/exams and the three generated font concepts. This was not a pixel-identity comparison.

Local screenshots are under ignored `output/playwright/`; generated concept previews are under ignored `output/imagegen/`. They are review artifacts, not application backgrounds. Generated typography is conceptual; actual browser screenshots use the downloaded font binaries.

## Font provenance

Philosopher Regular and Bold were downloaded from the official Google Fonts repository, converted to WOFF2 with existing local fontTools/Brotli tooling, and checked for the full Russian alphabet including Ё/ё. The original OFL notice is bundled. No runtime dependency was added.

Sources: [Philosopher](https://github.com/google/fonts/tree/main/ofl/philosopher), [Cormorant Garamond exploration](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond), [Vollkorn exploration](https://github.com/google/fonts/tree/main/ofl/vollkorn). Only the selected new Philosopher files are shipped.
