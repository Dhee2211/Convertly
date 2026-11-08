# Contributing to Convertly

Thanks for helping! Convertly is a static site with no build step needed to run it and no backend.

## Ground rules

1. **Fast to use.** A result should take zero or one click. New tools must work with a single number or phrase typed.
2. **Private.** No analytics, no accounts. Amounts you type never leave the browser. Only the exchange-rate request is allowed.
3. **Correct first.** Conversions, tax and date math must have tests. Cite the source of any new constant in a comment.
4. **Stay light.** No dependencies or bundlers without a strong reason.

## Setup

```bash
git clone https://github.com/Dhee2211/Convertly.git
cd Convertly
npm start      # serves http://localhost:8000
npm test       # runs the unit tests
npm run build  # regenerates the static pages after editing tools-meta.js
```

## Adding a unit

Add it to its category in `units.js` with its factor to the base unit and aliases (including plurals people type). Add a test in `test/units.test.mjs`.

## Adding a query pattern

Edit `parse.js` and add a case to `test/parse.test.mjs`. Make sure ambiguous words such as `in`, `oz` and `c` still resolve correctly.

## Adding a tool

1. Add an entry to `tools-meta.js`.
2. Write a renderer in `tools-units.js`, `tools-calc.js` or `tools-time.js`, and register it in `app.js`.
3. Put the math in a pure module with tests.
4. Run `npm run build` and commit the generated pages.

## Pull requests

Keep PRs focused and say how you tested. Include a screenshot for UI changes.

## Security

Report anything that could expose user data privately via GitHub's *Security → Report a vulnerability*.
