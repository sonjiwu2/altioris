# Requests and communication

Use the current [contributor instructions](../../AGENTS.md), [design contract](../../DESIGN.md), and [requirements](../requirements.md). Check the relevant [approved reference](../references/README.md) before changing a screen. Use the authenticated account snapshot for displayed values.

## Role

Match requests, support and notifications. Render actual request history, ownership-checked PDF links, useful deterministic chat intents, warm/lavender bubbles and inline request cards. Never imply a live operator is connected.

Support answers everyday Russian phrasing, common typos and short follow-ups from owned records and the campus catalog. Ask for clarification when a course is ambiguous. Group messages by Moscow day, provide keyboard-accessible arrows to both ends of history and mark outgoing questions once the assistant has replied.

An open question about campus services should clarify the goal. Keep the visible question guide concise and use examples with concrete answers. Use teacher context only for follow-up questions about that teacher, and route explicit questions about a pass or appearance to their respective pages. Use the current period for generic grade questions and show full result lists on explicit request. Maintain the question guide and verification prompts in docs/support.md.

Publish campus, academic and document-ready notifications server-side even with no connected browser. Show the sender, message paragraphs, receipt time in Moscow and the relevant link. Request jobs persist, issue a distinct PDF by type and record each stage. Only completed issuance triggers a request notification. Show the latest session with grades published by issuance in the transcript. End the request details with the document actions.

## Completion

Deliver working code within the assigned scope, the exact checks performed, and any remaining visual or functional differences. Follow DESIGN.md and preserve account ownership and ignored runtime state.
