<div align="center">

# Convertly

**Every converter and calculator, one search away.**

Type what you need, like `5 km to miles` or `20% off 80`, and the answer appears instantly. Free, open source, no sign-up.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**[Try it now: dhee2211.github.io/Convertly](https://dhee2211.github.io/Convertly/)**

</div>

## Why it is fast to use

Zero or one click for most things.

- **Type, don't click.** The search box understands plain English: `72 f to c`, `15% of 200`, `tip 18% on 64.50 split 3`, `3pm New York to London`, `100 usd to eur`, `255 to hex`.
- **Every unit at once.** Open a converter, type a number, and see all units in that category together. Click any result to copy it.
- **Shareable.** Every result lives in the URL, so you can bookmark it or send it to someone.

## What is inside

| Group | Tools |
| --- | --- |
| **Converters** | Length, weight, temperature, volume, area, speed, duration, data storage, energy, power, pressure, angle, frequency, fuel economy, live currency (160+), cooking (cups to grams), number base, Roman numerals, color (HEX/RGB/HSL), Unix timestamp |
| **Calculators** | Discount (percent, flat, extra discount, tax, find the original price), percentage (of, what percent, change), tip and split, VAT/GST/sales tax, loan and EMI, date difference, age and add days |
| **Time zones** | Meeting time finder (best overlap across any cities, daylight-saving aware, invite text and calendar link), time zone converter |

## Run it

```bash
git clone https://github.com/Dhee2211/Convertly.git
cd Convertly
npm start        # or: python3 -m http.server 8000
```

Open http://localhost:8000. There is no build step to run the site. ES modules don't load from `file://`, so use a local server.

## Development

```bash
npm test         # unit tests for units, calculators, the query parser and time zones (Node 18+)
npm run build    # regenerate the static pages, sitemap and robots.txt after changing tools
```

| File | Role |
| --- | --- |
| `units.js` | Unit data and the conversion engine |
| `calc.js` | Discount, percentage, tip, tax, loan, date, Roman numeral, base and color math |
| `parse.js` | Plain-English query parser for the search box |
| `tz.js`, `cities.js` | Time zone math, city lookup and the meeting planner |
| `tools-meta.js` | The list of tools and their SEO text |
| `tools-units.js`, `tools-calc.js`, `tools-time.js` | The tool interfaces |
| `app.js`, `ui.js`, `currency.js` | Page shell, helpers and live exchange rates |
| `scripts/build.mjs` | Generates one crawlable static page per tool |

All the logic is in pure modules with tests, so it is easy to add a unit or fix a rule.

**Add a unit:** add a line to its category in `units.js` and a test in `test/units.test.mjs`.
**Add a tool:** add an entry to `tools-meta.js`, write a renderer, register it in `app.js`, run `npm run build`.

## Notes and limits

- Exchange rates come from [Exchange Rate API](https://www.exchangerate-api.com) (with Frankfurter as a fallback), are cached for 6 hours, and are mid-market rates for reference only. Only the rates request leaves your browser, never your amounts.
- Cooking weights are typical values per US cup and vary with how an ingredient is packed.
- The meeting finder uses your browser's time zone data, so daylight saving is handled automatically.

## Contributing

Contributions are welcome.

- [Request a feature](../../issues/new?template=feature_request.yml)
- [Report a bug](../../issues/new?template=bug_report.yml)
- [Read the contributing guide](CONTRIBUTING.md)

## License

Released under the [MIT License](LICENSE). Third-party services are listed in [NOTICE.md](NOTICE.md).
