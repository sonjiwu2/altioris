# Full-width chat and custom photos — 2026-11-20

Implemented the user's follow-up: larger upright Philosopher throughout, full-width chat, original SVG headset-person assistant avatar, multi-line composer, and real profile photo uploads with preview/save/reset.

Actual verification:

- 14 Node tests passed, including a new upload suite covering v1-to-v2 migration, login/origin protection, MIME/signature/dimension/size rejection, exact owned image retrieval, other-account denial, persistence after reopen and owner-specific reset.
- Chrome/Playwright: 40 authenticated route/viewport combinations (1536×1024, 1280×1024, 768×1024, 360×800) with Philosopher computed in every section, no page exceptions, document horizontal overflow or broken images in the completed pass.
- Eight additional dark-theme/130% text checks (settings, grades, teachers, requests at 1536 and 360px); corrected mobile grade status reflow, then confirmed zero document overflow.
- Actual file picker: rejected a text file, previewed a WebP portrait, uploaded its browser-normalized PNG, reloaded, verified profile/sidebar/ranking photo, and restored the prior photo after QA. Inspected the working preview after correcting the CSP to allow local blob image URLs.
- Chat at 1536 and 360px: measured panel width equal to available width, verified removal of the right panel and shield artwork, inspected the headset-person icon, exercised Shift+Enter multi-line input.
- Existing one-day/seven-day arrows, responsive resize and keyboard focus remained functional.

Screenshots live in ignored output/playwright (support-full-1536.png, support-full-360.png, photo-upload.png). No pixel-identity claim. Private runtime files and user images are excluded from commits.

## Settings and motion follow-up

Restored the original colorful icons, with the newer chat and current session symbols retained. Settings now show the light theme preview, account text scale and sign-out. Restored compact weekly timetable rows and removed the two links below the calendar.

Chrome verified ten authenticated routes at the four standard viewports and all ten routes at 360 px with text set to 130%. The final pass found no horizontal page overflow, broken images in the four-viewport pass or uncaught JavaScript errors. Browser checks also covered scale persistence, rapid item selection, keyboard focus, Back navigation and reduced motion. Sampled the desktop detail transition at 0, 130 and 260 ms to confirm that both position and opacity move toward the final state. Current settings, timetable and chat screenshots are in the ignored local `output/playwright` directory.

## Theme and teacher directory follow-up

The settings page restores light, dark and system choices. Controls fit one compact section, with the current session and footer directly underneath. Theme changes crossfade in browsers with the View Transition API. The selected preference is saved per account in the current browser. Reduced motion and browsers without view transitions apply the theme immediately.

Chrome checked all four distinct department icons, instant filtering, search by a secondary subject, combined filters, the empty state, Back navigation and keyboard focus. Selection transitions were exercised on teachers, grades, lessons, exams, requests and notifications. Theme checks covered keyboard activation, fast repeated switching, persistence after reload, following the system theme and reduced motion. Ten sections at four viewport widths in both light and dark mode, plus settings and the teacher directory at 360 px with text set to 130%, had no horizontal page overflow. The final run recorded no uncaught JavaScript errors. All 14 Node tests passed. The 11 reference hashes and 30 project guides passed their existing checks.
