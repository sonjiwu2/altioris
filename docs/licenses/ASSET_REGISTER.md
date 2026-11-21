# Asset register

| Asset | Origin | Usage |
| --- | --- | --- |
| campus-evening.webp | Original ImageGen architectural photograph | Sign-in background and tinted campus pass artwork |
| crest.webp | Original ImageGen transparent fictional shield | University identity |
| student-*.webp | 13 individual ImageGen fictional student portraits | Assigned campus pass portraits |
| server/portraits/*.jpg | Portrait crops encoded from the same 13 student assets | Embedded in the owner's fictional passport PDF |
| pass-qr/*.png | QR Code matrices generated locally from fictional account UIDs | Campus pass reverse |
| teacher-*.webp | 24 individually generated ImageGen fictional staff portraits | Teacher list, detail and teaching links |
| Philosopher-Regular.woff2 and Philosopher-Bold.woff2 | Google Fonts / Philosopher, OFL 1.1 | Current interface type, including the wordmark |
| GreatVibes-Regular.woff2 and MarckScript-Regular.woff2 | Google Fonts / Great Vibes and Marck Script, OFL 1.1 | Original stylesheet typography |
| GolosText.woff2 | Google Fonts / Golos Text, OFL 1.1 | Original stylesheet and technical error typography |
| server/fonts/GolosText-Regular.ttf | Static 400 instance of Golos Text, OFL 1.1 with notice retained | Embedded Cyrillic document typography |
| public/ui.js | Original monochrome paths | Compact interactive controls |
| public/features/detail-icons.js | Original illustrated SVG paths | Document rows, faculty facts and notification topics |
| server/document-art/ | User-supplied Altioris certificate ornament and sample signature, cropped and optimized as JPEG | Branded request PDFs |
| server/fonts/Philosopher-Regular.ttf | Philosopher, OFL 1.1 with notice retained | PDF headings and identity names |
| public/assets/stickers/subject-*.webp | 24 separate ImageGen designs | One subject-specific paper sticker per discipline in the gradebook |
| public/assets/stickers/*.webp (other files) | 36 separate ImageGen designs | Navigation, ranking, settings, support and illustrated details |

Keep the OFL notices next to font files. People and institution are fictional. Individual assets are never full-screen interface screenshots. The same portrait may repeat for the same identity; different accounts have different portraits.

Asset generation briefs specified one person per portrait, natural window light, a neutral academic setting, task-specific clothing and distinctive appearance. The campus brief specified a Gothic limestone cloister, autumn foliage, amber lanterns, blue-hour sky and wet stone reflections. The crest brief specified an original navy/gold shield with A, crown, laurel and open book.

The two bundled Philosopher fonts were checked for the full Russian alphabet including Ё/ё and compressed with fontTools and Brotli. The adjacent `philosopher-OFL.txt` contains the license. [Philosopher source](https://github.com/google/fonts/tree/main/ofl/philosopher).

Philosopher Regular/Bold covers all interface text, including the wordmark and timetable. Student avatars use rendered initials and optionally a personal upload stored in the private SQLite database. The 20 newer ImageGen faculty portraits were packaged as 240 × 240 WebP files. The original four portraits stay assigned to their existing identities.

The sticker briefs used the supplied «Altioris — бумажные стикеры» mood board for gouache texture, cut-paper edges and the collegiate palette. ImageGen produced eight themed sheets. The individual silhouettes were prepared as 144 × 144 transparent WebP files. Each discipline uses its own composition based on concepts from the teaching plan.
