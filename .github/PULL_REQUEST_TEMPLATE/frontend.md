<!--
Read CONTRIBUTING.md before filling this out. PRs that leave sections below
empty or with placeholder text will be closed without review.
-->

## Issue

Closes #<!-- issue number -->

## What changed and why

<!--
Not a diff summary — GitHub already shows the diff. Explain the reasoning:
why this approach over alternatives, what tradeoffs you accepted or
rejected, and how this maps to every bullet in the issue's Definition of
done. Link the design (Figma/mermaid) this implements.
-->

## Definition of done — addressed item by item

<!-- Copy each bullet from the issue's "Definition of done" and note how your PR satisfies it. -->

- [ ] Item 1: ...
- [ ] Item 2: ...
- [ ] Item 3: ...

## Screenshots / recording

<!--
Required for any visual change. Before/after screenshots, or a short screen
recording for interactions and animations. Include both light and dark mode
if the app supports both.
-->

## Design link

<!-- Link the Figma frame(s) or design doc this PR implements. -->

## Accessibility checklist

- [ ] All interactive elements are reachable and operable via keyboard
- [ ] Color contrast meets WCAG AA for text and meaningful icons
- [ ] Images/icons have appropriate `alt` text or `aria-label`
- [ ] Form inputs have associated labels and error messages are announced
- [ ] Focus order is logical and focus is visible
- [ ] Tested with at least one screen reader pass (name which one)

## Evidence this actually runs

<!--
Required. Paste inline (not just linked, in case the link rots):
- Terminal output of the test run, including your new/updated tests
- Logs from a real run against the deployed backend/testnet, if applicable
-->

```
paste test/build output here
```

## Tests

<!-- What did you add/change, and what does it actually assert? -->

## Regression check

<!-- What adjacent behavior does this issue call out as needing to keep working, and how did you verify it still does? -->

## Checklist

- [ ] Every Definition of done bullet above is checked and explained, not just checked
- [ ] Screenshots/recording and design link above are filled in
- [ ] Accessibility checklist above is completed, not skipped
- [ ] Evidence block above is filled in with real output, not omitted
- [ ] New/updated tests are included and shown passing
- [ ] No leftover `console.log`/`TODO`/debug code
- [ ] Related/adjacent behavior re-verified, not assumed unaffected
