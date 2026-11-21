# Build Altioris University from the approved visual specification

Act as the product engineer implementing the 11 supplied Altioris University screens. Begin with AGENTS.md and DESIGN.md, then verify docs/references/manifest.json with python scripts/import-references.py. Inspect the actual screen images; their composition defines the interface.

Use the current [contributor instructions](../../AGENTS.md), [design contract](../../DESIGN.md), and [requirements](../requirements.md). Check the relevant [approved reference](../references/README.md) before changing a screen. Use the authenticated account snapshot for displayed values.

## Implement

1. Render a full-background evening-campus sign-in screen with centered double-bordered card. Use the original shield, local Philosopher fonts and accessible real inputs.
2. Build the left navigation and student identity. Add the settings gear and preserve active, focus, hover and mobile menu states.
3. Match schedule/exam compositions, including independent time positions, course formats and a detail inspector. Keep dates in Europe/Moscow and calendar exports limited to confirmed events.
4. Implement grades, weighted ranking, staff search/detail, student profile and student card. Show current account data rather than copying picture numbers. Maintain 13 independent fixed logins.
5. Implement owned requests, actual chronological history and private PDF downloads. Present a capable deterministic support bot with useful typed intents, links and inline request cards.
6. Implement notification read state, filtering and details. Implement light/dark/system theme, text scale, reduced motion and notification preferences with persistent account/browser settings.

## Verify and deliver

Run node --test, syntax checks, reference integrity, and a real browser walkthrough at the four target sizes. Check login failure, logout, request creation/download, typed chat, teacher filtering, theme, text scale, notification preferences and browser navigation. Report observable results and remaining differences. Do not describe incomplete work as exact visual parity.

Use the actual repository identity. Keep runtime credentials and private diagnostic files ignored. Rewrite the local source foundation when appropriate and add meaningful follow-up commits for verified behavior. Do not publish or force-push a shared history unless that operation is part of the authorized delivery.
