# Asset register

| Asset | Origin | Usage |
| --- | --- | --- |
| campus-evening.webp | Original ImageGen architectural photograph | Sign-in background only |
| crest.webp | Original ImageGen transparent fictional shield | University identity |
| student-*.webp | 13 individual ImageGen fictional student portraits | Same person across profile, sidebar and rating |
| teacher-*.webp | 24 individually generated ImageGen fictional staff portraits | Teacher list, detail and teaching links |
| GreatVibes-Regular.woff2 | Google Fonts / Great Vibes, OFL 1.1 | Connected Cyrillic calligraphy and wordmark |
| MarckScript-Regular.woff2 | Google Fonts / Marck Script, OFL 1.1 | Core handwritten Cyrillic labels and data |
| GolosText.woff2 | Google Fonts / Golos Text, OFL 1.1 | Technical error copy and neutral fallback |
| server/fonts/GolosText-Regular.ttf | Static 400 instance of Golos Text, OFL 1.1 with notice retained | Embedded Cyrillic document typography |
| SVG vocabulary in public/ui.js | Original authored paths | Colorful site controls and illustrations |
| public/assets/subject-illustrations.svg | 24 original author-drawn vector compositions | One illustration per discipline in the gradebook |
| public/assets/portal-illustrations.svg | Original author-drawn vector compositions | Appearance settings, current session, support navigation and illustrated assistant |

Keep the OFL notices next to font files. People and institution are fictional. Individual assets are never full-screen interface screenshots. The same portrait may repeat for the same identity; different accounts have different portraits.

Asset generation briefs specified one person per portrait, natural window light, a neutral academic setting, task-specific clothing and distinctive appearance. The campus brief specified a Gothic limestone cloister, autumn foliage, amber lanterns, blue-hour sky and wet stone reflections. The crest brief specified an original navy/gold shield with A, crown, laurel and open book.

Selected upright pairing: Philosopher-Regular.woff2 (40800 bytes) and Philosopher-Bold.woff2 (40644 bytes), from https://github.com/google/fonts/tree/main/ofl/philosopher, OFL 1.1 with philosopher-OFL.txt alongside the fonts. Philosopher supplies headings and names; existing Golos Text supplies navigation, body text and numbers. Both downloaded Philosopher files were checked for the complete Russian alphabet including Ё/ё, then compressed using the existing local fontTools/Brotli tooling. No application dependency added. Cormorant Garamond and Vollkorn were explored in local previews but are not shipped.

Philosopher Regular/Bold covers all interface text, including the wordmark and timetable. User-uploaded profile images stay in the ignored private SQLite database. The 20 new ImageGen faculty portraits were packaged as 240 × 240 WebP files. The original four portraits stay assigned to their existing identities.

Selected chat controls use Lucide geometry. The revision, icon mapping and license are in public/assets/icons. The assistant illustration was designed for Altioris after reviewing branded chat entry points in [Intercom](https://www.intercom.com/help/en/articles/6612589-set-up-and-customize-the-messenger) and [Zendesk](https://support.zendesk.com/hc/en-us/articles/4500747797914-Configuring-the-name-and-appearance-of-the-Web-Widget).
