# Verification record

Review date: 19 November 2026.

- Current archive: 11 approved PNGs at 1536 x 1024, verified by SHA-256.
- Individual production artwork: 19 unique WebP images, comprising the campus, shield, 13 students and 4 teachers.
- Locally served WOFF2 fonts with OFL notices; no external font requests.
- npm test: 13 passing tests, including request ownership, restart persistence, sessions, typed support intents and actual cohort ranking.
- Browser review: all ten signed-in routes at 1536, 1280, 768 and 360 px, plus the sign-in screen. Seventeen interaction checks include login failure/success, themes, reload persistence, 130% text at three widths, reduced motion, category filtering, staff search, request creation, PDF, typed ranking response, avatar and logout.
- Browser execution used actual application handlers with in-memory state and intercepted requests; no listening HTTP server was started. This verifies rendering and behavior but does not establish public hosting or persistent local service availability.
- No JavaScript exceptions, broken images or incidental horizontal page overflow in the reviewed states. Follow-up affected-page checks are retained in runtime/visual-qa.
- Manual visual review covered every supplied composition. Pixel identity is not claimed: generated images are individual assets and data reflects the actual demo accounts.
- The root .git metadata is write-protected. Reviewed source history is prepared independently in runtime/review-source; bundle delivery preserves the original metadata until the owner imports it.

- Document QA: certificate and transcript were rendered with an independent PDF engine, verified as one-page A4 files with extractable Cyrillic student names, sample marks and matching GPA. Text bounds fit the page; no font downloads or PDF runtime dependency are required.
