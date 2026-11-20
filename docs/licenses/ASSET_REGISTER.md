# Asset register

| Asset | Origin | Usage |
| --- | --- | --- |
| campus-evening.webp | Original ImageGen architectural photograph | Sign-in background and tinted campus pass artwork |
| crest.webp | Original ImageGen transparent fictional shield | University identity |
| student-*.webp | 13 individual ImageGen fictional student portraits | Assigned campus pass portraits |
| server/portraits/*.jpg | Portrait crops encoded from the same 13 student assets | Embedded in the owner's fictional passport PDF |
| pass-qr/*.png | QR Code matrices generated locally from fictional account UIDs | Campus pass reverse |
| teacher-*.webp | 24 individually generated ImageGen fictional staff portraits | Teacher list, detail and teaching links |
| GreatVibes-Regular.woff2 | Google Fonts / Great Vibes, OFL 1.1 | Connected Cyrillic calligraphy and wordmark |
| MarckScript-Regular.woff2 | Google Fonts / Marck Script, OFL 1.1 | Core handwritten Cyrillic labels and data |
| GolosText.woff2 | Google Fonts / Golos Text, OFL 1.1 | Technical error copy and neutral fallback |
| server/fonts/GolosText-Regular.ttf | Static 400 instance of Golos Text, OFL 1.1 with notice retained | Embedded Cyrillic document typography |
| public/ui.js | Original monochrome paths | Compact interactive controls |
| public/features/detail-icons.js | Original illustrated SVG paths | Document rows, faculty facts and notification topics |
| public/assets/stickers/subject-*.webp | 24 separate ImageGen designs | One subject-specific paper sticker per discipline in the gradebook |
| public/assets/stickers/*.webp (other files) | 36 separate ImageGen designs | Navigation, ranking, settings, support and illustrated details |

Keep the OFL notices next to font files. People and institution are fictional. Individual assets are never full-screen interface screenshots. The same portrait may repeat for the same identity; different accounts have different portraits.

Asset generation briefs specified one person per portrait, natural window light, a neutral academic setting, task-specific clothing and distinctive appearance. The campus brief specified a Gothic limestone cloister, autumn foliage, amber lanterns, blue-hour sky and wet stone reflections. The crest brief specified an original navy/gold shield with A, crown, laurel and open book.

Selected upright pairing: Philosopher-Regular.woff2 (40800 bytes) and Philosopher-Bold.woff2 (40644 bytes), from https://github.com/google/fonts/tree/main/ofl/philosopher, OFL 1.1 with philosopher-OFL.txt alongside the fonts. Philosopher supplies headings and names; existing Golos Text supplies navigation, body text and numbers. Both downloaded Philosopher files were checked for the complete Russian alphabet including Ё/ё, then compressed using the existing local fontTools/Brotli tooling. No application dependency added. Cormorant Garamond and Vollkorn were explored in local previews but are not shipped.

Philosopher Regular/Bold covers all interface text, including the wordmark and timetable. Student avatars use rendered initials and optionally a personal upload stored in the private SQLite database. The 20 newer ImageGen faculty portraits were packaged as 240 × 240 WebP files. The original four portraits stay assigned to their existing identities.

The sticker briefs used the supplied «Altioris — бумажные стикеры» mood board for gouache texture, cut-paper edges and the collegiate palette. ImageGen produced eight themed sheets. The individual silhouettes were prepared as 144 × 144 transparent WebP files. Each discipline uses its own composition based on concepts from the teaching plan.
