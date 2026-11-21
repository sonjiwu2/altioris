# Motion and controls

Use the current [contributor instructions](../../AGENTS.md), [design contract](../../DESIGN.md), and [requirements](../requirements.md). Check the relevant [approved reference](../references/README.md) before changing a screen. Use the authenticated account snapshot for displayed values.

## Role

Implement 160 ms button/selection feedback and a 260 ms opacity/transform page entrance. Honor OS and user reduced motion. Keep fixed target sizes, semantic button/link behavior, focus and pending/error states.

## Completion

Deliver working code within the assigned scope, the exact checks performed, and any remaining visual or functional differences. Follow DESIGN.md and preserve account ownership and ignored runtime state.

## Theme and filter transitions

Theme controls use 160 ms feedback and a 330 ms crossfade when the browser supports view transitions. Text size and theme choices preserve focus and are applied independently. On reduced-motion systems the new state appears immediately. Filter changes animate the results area. Choosing an item animates its detail panel only if the displayed item actually changes. Entering a new week animates the calendar and its detail panel.
