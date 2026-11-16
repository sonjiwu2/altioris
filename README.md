# Altioris

Altioris is a Russian-language digital dean’s office for a student competition. A student can find the next class, check grades and exams, and request a certificate from one account. All student records and campus content are fictional.

## Run locally

Use Node.js 24 or newer. The app uses built-in Node modules, including SQLite, and runs without an npm install or a build step.

```sh
npm run demo:setup
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The local setup creates `runtime/.env` with generated credentials for `vetrova` and `zolotov`. Read the passwords from that file on your own machine and share demo access privately. SQLite stores local data under `runtime/` and preserves requests, notifications and profile changes across restarts.

## Try the student journey

| Screen | What to try |
| --- | --- |
| Главная | Find the next class or open a campus story. |
| Расписание | Compare the day and week, then export confirmed exam dates to a calendar. |
| Успеваемость | Open a course and compare the arithmetic mean and credit-weighted GPA. |
| Преподаватели | Find an instructor by name or subject. |
| Заявки | Submit a request, inspect the status history and download a ready demo document. |
| Уведомления and Чат поддержки | Mark a notice as read or check your latest request in the automated chat. |
| Мой профиль | View academic details and change the displayed avatar. |

## Test and maintain

```sh
npm test
```

| Path | Responsibility |
| --- | --- |
| [public/](public/) | Responsive HTML, CSS, browser modules and application artwork |
| [server/](server/) | HTTP API, sessions, private downloads, fixtures and SQLite |
| [tests/](tests/) | Integration checks against temporary data |
| [scripts/setup-demo.mjs](scripts/setup-demo.mjs) | Generate private local credentials |

The HTTP API serves the browser on the same origin. It resolves the student from an opaque session cookie and scopes private reads and writes to that account, including PDF downloads. The SQLite database and credentials stay outside the served directory.

| Configuration | Purpose |
| --- | --- |
| `ALTIORIS_PASSWORD_A`, `ALTIORIS_PASSWORD_B` | Private runtime passwords for the two demo accounts |
| `ALTIORIS_DB` | SQLite database path. Default `runtime/altioris.sqlite`. |
| `ALTIORIS_CLOCK` | Use `live` for the current time. The default fixes the clock for the demo timetable. |
| `HOST`, `PORT` | Listen address and port. Defaults `127.0.0.1` and `3000`. |
| `ALTIORIS_ORIGIN` | Public HTTPS origin required when `NODE_ENV=production`. |

A hosted demo needs HTTPS and a persistent volume for SQLite. The support chat uses scripted replies for the competition prototype.

The emblem is authored for this prototype. The application uses optimized WebP crops of standalone artwork and fictional portraits from the approved Altioris design set.
