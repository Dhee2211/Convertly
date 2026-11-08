// Natural-language query parser for the search box. Pure functions, unit-tested in test/parse.test.mjs.
// "5 km to miles", "20% off 80", "15% of 200", "tip 18% on 64.50 split 3", "3pm new york to london"
import { resolvePair, resolveOne, lookupUnit } from "./units.js";
import { findPlace, parseClock } from "./tz.js";
import { fromRoman, hexToRgb } from "./calc.js";

const NUM = String.raw`[-+]?(?:\d{1,3}(?:,\d{3})+|\d*\.?\d+)(?:e[-+]?\d+)?`;
const num = (s) => Number(String(s).replace(/,/g, ""));
const SEP = String.raw`(?:to|in|into|as|equals?|=|->|→)`;
const SYMBOL_CODES = { "$": "usd", "€": "eur", "£": "gbp", "¥": "jpy", "₹": "inr", "₩": "krw" };

function clean(q) {
  let s = q.trim().toLowerCase().replace(/\s+/g, " ");
  s = s.replace(/^(?:what(?:'s| is)(?: the)?|convert|calculate|calc|how (?:much|many) is)\s+/, "");
  return s.replace(/[?!]+$/, "");
}
// "$100 to inr" -> "100 usd to inr" (only for unit conversions)
const withCurrencyCodes = (s) => s.replace(new RegExp(String.raw`([$€£¥₹₩])\s*(${NUM})`, "g"), (_, sym, n) => `${n} ${SYMBOL_CODES[sym]}`);
const stripSymbols = (s) => s.replace(/[$€£¥₹₩]\s*/g, "");

function discountQuery(s) {
  let m;
  // "20% off 80", "20 percent discount on 80"
  if ((m = new RegExp(String.raw`^(${NUM})\s*(?:%|percent|pct)\s*(?:off|discount|sale)(?:\s+(?:on|of|from|for))?\s+(${NUM})$`).exec(s)))
    return { type: "discount", pct: num(m[1]), price: num(m[2]) };
  // "80 with 20% off", "80 - 20%", "80 minus 20%", "80 20% off"
  if ((m = new RegExp(String.raw`^(${NUM})\s*(?:with|at|less|minus|-)?\s*(${NUM})\s*(?:%|percent|pct)(?:\s*(?:off|discount|sale))?$`).exec(s)) && /off|discount|sale|minus|less|-/.test(s))
    return { type: "discount", pct: num(m[2]), price: num(m[1]) };
  // "discount 20% on 80"
  if ((m = new RegExp(String.raw`^(?:discount|sale)\s+(${NUM})\s*(?:%|percent)\s*(?:on|of|from|for)?\s*(${NUM})$`).exec(s)))
    return { type: "discount", pct: num(m[1]), price: num(m[2]) };
  return null;
}

function percentQuery(s) {
  let m;
  if ((m = new RegExp(String.raw`^(${NUM})\s*(?:%|percent|pct)\s+of\s+(${NUM})$`).exec(s)))
    return { type: "percent", mode: "of", pct: num(m[1]), of: num(m[2]) };
  if ((m = new RegExp(String.raw`^(${NUM})\s+is\s+what\s*(?:%|percent|percentage)\s+of\s+(${NUM})$`).exec(s)))
    return { type: "percent", mode: "what", part: num(m[1]), whole: num(m[2]) };
  if ((m = new RegExp(String.raw`^(?:(?:%|percent)\s*(?:change|increase|decrease|difference)\s+)?(?:from\s+)(${NUM})\s+to\s+(${NUM})$`).exec(s)))
    return { type: "percent", mode: "change", from: num(m[1]), to: num(m[2]) };
  return null;
}

function tipQuery(s) {
  const m = new RegExp(String.raw`^tip\s+(${NUM})\s*%?\s*(?:on|of|for)?\s*(${NUM})(?:\s*(?:split|between|among|for)\s*(\d+)(?:\s*(?:people|ways|persons))?)?$`).exec(s);
  if (m) return { type: "tip", pct: num(m[1]), bill: num(m[2]), people: m[3] ? Number(m[3]) : 1 };
  return null;
}

const CLOCK = String.raw`(?:\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)|\d{1,2}:\d{2}|noon|midnight|now)`;

function timeQuery(s) {
  let m;
  if ((m = /^(?:current )?time\s+(?:in|at)\s+(.+)$/.exec(s)) || (m = /^(.+?)\s+(?:time|current time)$/.exec(s))) {
    const place = findPlace(m[1]);
    if (place) return { type: "time", clock: { now: true }, from: null, to: [place] };
  }
  m = new RegExp(String.raw`^(?:(${CLOCK})\s+)?(.+?)\s+${SEP}\s+(.+)$`).exec(s);
  if (m) {
    const clock = m[1] ? parseClock(m[1]) : { now: true };
    const from = findPlace(m[2]);
    const targets = m[3].split(/\s*(?:,|\band\b|&|\/)\s*/).map(findPlace);
    // require a clock, or two recognizable cities (so "5 in to cm" never reaches here)
    if (clock && from && targets.length && targets.every(Boolean) && (m[1] || /[a-z]/.test(m[2]))) {
      if (!m[1] && lookupUnit(m[2]).length) return null; // "km to miles" is units, not a place
      return { type: "time", clock, from, to: targets };
    }
  }
  return null;
}

function meetingQuery(s) {
  const m = /^(?:meeting|meet|schedule|overlap|best time|find (?:a )?time)(?:\s+(?:between|for|with|in|across))?\s+(.+)$/.exec(s);
  if (!m) return null;
  const places = m[1].split(/\s*(?:,|\band\b|&|\bvs\b|\/|\bwith\b)\s*/).map(findPlace);
  if (places.length >= 2 && places.every(Boolean)) return { type: "meeting", places };
  return null;
}

function baseQuery(s) {
  let m;
  if ((m = /^(?:0x)([0-9a-f]+)$/.exec(s))) return { type: "base", from: 16, text: m[1] };
  if ((m = /^(?:0b)([01]+)$/.exec(s))) return { type: "base", from: 2, text: m[1] };
  if ((m = /^(\d+)\s+(?:to|in|as|into)\s+(?:hex|hexadecimal|binary|bin|octal|oct)$/.exec(s))) return { type: "base", from: 10, text: m[1] };
  if ((m = /^([0-9a-f]+)\s+(?:hex|hexadecimal)\s+(?:to|in|into)\s+(?:decimal|dec|binary|bin|octal)$/.exec(s))) return { type: "base", from: 16, text: m[1] };
  if ((m = /^([01]+)\s+(?:binary|bin)\s+(?:to|in|into)\s+(?:decimal|dec|hex|hexadecimal|octal)$/.exec(s))) return { type: "base", from: 2, text: m[1] };
  if ((m = /^(\d{1,4})\s+(?:to|in|as|into)\s+roman(?: numerals?)?$/.exec(s))) return { type: "roman", n: Number(m[1]) };
  if ((m = /^([mdclxvi]+)\s+(?:to|in|into)\s+(?:number|decimal|arabic|numbers|digits)$/.exec(s)) && fromRoman(m[1]) !== null) return { type: "roman", n: fromRoman(m[1]), roman: m[1].toUpperCase() };
  if ((m = /^(#[0-9a-f]{3}|#[0-9a-f]{6})(?:\s+(?:to|in|into)\s+(?:rgb|hsl|hex))?$/.exec(s)) && hexToRgb(m[1])) return { type: "color", hex: m[1] };
  if ((m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(s))) return { type: "color", rgb: { r: +m[1], g: +m[2], b: +m[3] } };
  return null;
}

function feetInches(s) {
  const m = new RegExp(String.raw`^(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')\s*(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")?(?:\s+${SEP}\s+(.+))?$`).exec(s);
  if (!m) return null;
  const inches = Number(m[1]) * 12 + Number(m[2]);
  const toToken = m[3] || "cm";
  const pair = resolvePair("in", toToken);
  return pair ? { type: "units", value: inches, cat: pair.cat, from: pair.from, to: pair.to, note: `${m[1]} ft ${m[2]} in` } : null;
}

function unitQuery(s) {
  let m = feetInches(s);
  if (m) return m;

  // "<number> <unit> <sep> <unit>" - try every separator position so "5 in in cm" works
  m = new RegExp(String.raw`^(${NUM})\s*(.+)$`).exec(s);
  if (m) {
    const value = num(m[1]);
    const rest = m[2];
    const seps = [...rest.matchAll(new RegExp(String.raw`(?:^|\s)${SEP}(?=\s|$)`, "g"))];
    for (const sep of seps) {
      const a = rest.slice(0, sep.index).trim();
      const b = rest.slice(sep.index + sep[0].length).trim();
      const pair = a && b ? resolvePair(a, b) : null;
      if (pair) return { type: "units", value, cat: pair.cat, from: pair.from, to: pair.to };
    }
    if (!seps.length) {
      const one = resolveOne(rest);
      if (one) return { type: "units", value, cat: one.cat, from: one.from, to: null };
    }
  }
  // "<unit> to <unit>" means 1 of the first
  const sepMatch = new RegExp(String.raw`^(.+?)\s+${SEP}\s+(.+)$`).exec(s);
  if (sepMatch) {
    const pair = resolvePair(sepMatch[1], sepMatch[2]);
    if (pair) return { type: "units", value: 1, cat: pair.cat, from: pair.from, to: pair.to };
  }
  return null;
}

/** Parse a search-box query. Returns a typed result or null. */
export function parseQuery(text) {
  const s = clean(text || "");
  if (!s) return null;
  const plain = stripSymbols(s);
  return discountQuery(plain) || percentQuery(plain) || tipQuery(plain) || meetingQuery(s) || baseQuery(s)
    || timeQuery(s) || unitQuery(withCurrencyCodes(s));
}
