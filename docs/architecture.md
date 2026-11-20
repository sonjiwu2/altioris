# Runtime and state architecture

Node.js 24+ serves buildless HTML, CSS, browser ES modules, local fonts and artwork on one origin. SQLite persists accounts, sessions, requests, request history, documents, notifications and support messages. Public routes deliver the application shell; private data requires the current authenticated owner.

| Route | Behavior |
| --- | --- |
| POST /api/login | Salted scrypt verification, opaque cookie session |
| POST /api/logout | Session revocation |
| GET /api/dashboard | Student, campus, grades, actual cohort ranking, owned records |
| POST /api/requests | Owned request/history/document generation |
| GET /api/documents/:id | Ownership-checked sample PDF |
| PATCH /api/notifications | Owned read state |
| PATCH /api/profile | Owned avatar selection |
| POST /api/support | Deterministic intent processing and owned conversation |
| GET /api/calendar/exams | Confirmed exams as ICS |

The browser uses URL query parameters for list selection, date, filters and display modes. public/features/settings.js stores theme and text scale and honors existing legacy reduced-motion preferences in localStorage under the student's stable number. Authentication stays in HttpOnly SameSite cookies.

Ranking sorts by unrounded credit-weighted GPA, then the displayed student name. Mean and GPA omit nonnumeric results. Dates and the demo clock are in Europe/Moscow. The local launcher binds to 127.0.0.1, uses runtime/altioris.sqlite and can choose a free port.

Visual tokens and screen composition are specified in DESIGN.md. Runtime image assets never contain a complete screen or interactive text.

## Documents

server/pdf.mjs generates an A4 certificate or academic transcript with an embedded static Golos Text font, Unicode mapping, navy/gold layout, student details, grade rows and actual mean/GPA. PDFs are approximately 45 KB, keep their sample watermark, and are served only after the existing ownership check. Font binaries and metrics are prebuilt; the app needs no PDF dependency at runtime.

## Profile images

SQLite schema version 2 adds profile_images(owner primary key, data BLOB, revision TEXT) without rebuilding accounts or resetting records. The authenticated GET/PUT/DELETE /api/profile/avatar endpoint reads/writes only the current owner. PUT accepts normalized PNG up to 2 MiB and dimensions 1–1024; the browser converts supported image files up to 20 MB into a centered 640px square PNG. Content revisions refresh all owned photo views; private image responses use no-store. The legacy PATCH avatar choices remain accepted for compatibility but are no longer presented in the UI.
