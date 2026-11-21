# Runtime and state architecture

Node.js 24+ serves buildless HTML, CSS, browser ES modules, local fonts and artwork on one origin. SQLite persists accounts, sessions, requests, request history, documents, notifications and support messages. Public routes deliver the application shell; private data requires the current authenticated owner.

| Route | Behavior |
| --- | --- |
| POST /api/login | Salted scrypt verification, opaque cookie session |
| POST /api/logout | Session revocation |
| GET /api/dashboard | Student, campus, grades, published session standings, next ranking publication and owned records |
| POST /api/requests | Start an owned request. An optional submission UUID makes retries idempotent |
| GET /api/documents/:id | Ownership-checked PDF. Use `view=1` to open a request PDF inline |
| GET /api/notifications | Owned campus, academic and document-ready notices |
| GET /api/notifications/stream | Authenticated live inbox revision |
| PATCH /api/notifications | Owned read state |
| PATCH /api/profile | Owned avatar selection |
| POST /api/support | Resolves a question against owned campus data and returns the saved conversation |
| GET /api/calendar/exams?term=… | Authenticated ICS export for existing clients |

The browser uses URL query parameters for list selection, date, filters and display modes. public/features/settings.js stores theme and text scale and honors existing legacy reduced-motion preferences in localStorage under the student's stable number. Authentication stays in HttpOnly SameSite cookies.

With `ALTIORIS_AUTH_SOURCE=sqlite`, a deployed process authenticates against the existing salted hashes for all 13 fixed accounts. It rejects plaintext account configuration in this mode. Local development still seeds credentials from private runtime configuration.

Ranking sorts by unrounded credit-weighted GPA, then the displayed student name. Mean and GPA omit nonnumeric results. Instruction and assessment times use Europe/Moscow. The clock is live by default and can be fixed with ALTIORIS_CLOCK=demo. The local launcher binds to 127.0.0.1, uses runtime/altioris.sqlite and can choose a free port.

Visual tokens and screen composition are specified in DESIGN.md. Runtime image assets never contain a complete screen or interactive text.

The server processes academic events and request jobs on a timer without browser traffic. Schema 5 removed earlier request alerts. Schema 6 adds the durable request queue and PDF snapshots. The completion transaction stores the PDF, updates history and publishes one document-ready notice. The authenticated inbox stream advances its revision for changes to request history, notifications and the latest support message. The chat view updates independently of the composer so other sessions can deliver history updates without discarding a draft. [Delivery and local controls](academic-events.md).

## Documents

`server/request-pdf-pages.mjs` defines five A4 layouts. `server/pdf.mjs` embeds Golos Text and Philosopher with Unicode mapping. The transcript shows the latest session with published results at issuance and renders only the grades published by that time. Assessment times are in Moscow time. At issue time the server saves the finished byte stream in `document_files`. Existing PDFs remain accessible by their identifiers. The profile passport and diploma use the authenticated account's fictional fixtures. The passport uses the assigned portrait and an issue date on the 14th birthday. The diploma is issued in June of the admission year. Every PDF requires an ownership check and identifies itself as a sample.

## Profile images

SQLite schema version 2 adds profile_images(owner primary key, data BLOB, revision TEXT) without rebuilding accounts or resetting records. The authenticated GET/PUT/DELETE /api/profile/avatar endpoint reads/writes only the current owner. PUT accepts normalized PNG up to 2 MiB and dimensions 1–1024; the browser converts supported image files up to 20 MB into a centered 640px square PNG. Content revisions refresh all owned photo views; private image responses use no-store. The profile returns initials whenever the student has no upload, including existing databases with the old portrait flag. DELETE and either legacy PATCH choice reset the owned avatar to initials.

SQLite schema version 7 adds `support_context` keyed by account. Each support turn persists the question, grounded response and conversational context in one transaction. The dashboard and the support endpoint return the latest 100 owned messages in conversation order. [Assistant behavior and sources](support.md)
