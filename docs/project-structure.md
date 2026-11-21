# Project layout

| Path | Role |
| --- | --- |
| public/app.js | Session-aware routing, sidebar, login and actions |
| `public/ui.js` | Common components, icon lookup, dates and portraits |
| `public/styles.css` and `public/typography.css` | Shared styles, responsive compositions, themes and current typography |
| `public/features/` | Schedule, grades, directory, requests, support, mobile details, notifications and settings |
| `public/assets/` | Artwork, individual portraits, QR codes and licensed local fonts |
| `server/index.mjs` and `server/store.mjs` | HTTP, sessions, migrations and account-owned SQLite data |
| `server/academic-*.mjs` and `server/request-*.mjs` | Academic calendar, events, request processing and issued document layouts |
| `server/support-*.mjs` | Russian-language question handling, campus FAQ and conversational context |
| `scripts/` and `tests/` | Setup, release checks, integration and behavior tests |
| [`docs/`](README.md) | Requirements, architecture, manuals, sources and release instructions |
| [`docs/references/`](references/README.md) and [`docs/images/`](images/README.md) | Approved design inputs and current application screenshots |
| [`docs/prompts/`](prompts/README.md) | Reusable implementation prompts and the edited development conversation |
| `runtime/` | Ignored credentials, database, backups and local diagnostics |

Keep features separate without introducing a build system solely for styling. Use the same render snapshot and escaping helpers across modules.
