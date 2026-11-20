# Project layout

| Path | Role |
| --- | --- |
| public/app.js | Session-aware routing, sidebar, login and actions |
| public/ui.js | Color SVGs, script wordmark, dates, portraits and common components |
| public/styles.css | Collegiate tokens, all 11 compositions, responsive layouts and dark mode |
| public/features/campus.js | Schedule, exams and linked announcements |
| public/features/academic.js | Grades, ranking, teachers and profile |
| public/features/services.js | Requests, notifications and support |
| public/features/settings.js | Browser/account appearance and category preferences |
| public/assets | Individual original artwork, distinct portraits and licensed local fonts |
| server | HTTP/session boundary, owned SQLite and exports |
| tests | Meaningful integration checks |
| docs/references | Eleven approved PNGs and hash inventory |
| docs/prompts | Role-specific implementation instructions |
| runtime | Ignored credentials, database, backups and diagnostics |

Keep features separate without introducing a build system solely for styling. Use the same render snapshot and escaping helpers across modules.
