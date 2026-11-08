import test from "node:test";
import assert from "node:assert/strict";
import { parseQuery } from "../parse.js";
import { setCurrencyRates } from "../units.js";

setCurrencyRates({ USD: 1, EUR: 0.9, INR: 90, GBP: 0.75 });
const unitId = (r) => `${r.value} ${r.from.id}>${r.to ? r.to.id : "*"}`;

test("units", () => {
  assert.equal(unitId(parseQuery("5 km to miles")), "5 km>mi");
  assert.equal(unitId(parseQuery("5km in mi")), "5 km>mi");
  assert.equal(unitId(parseQuery("72 f to c")), "72 f>c");
  assert.equal(unitId(parseQuery("1,000 g = oz")), "1000 g>oz");
  assert.equal(unitId(parseQuery("5 in in cm")), "5 in>cm");
  assert.equal(unitId(parseQuery("10 kg")), "10 kg>*");
  assert.equal(unitId(parseQuery("km to miles")), "1 km>mi");
  assert.equal(parseQuery("What is 3 cups in ml?").cat.id, "volume");
});
test("feet and inches", () => {
  const r = parseQuery("5 ft 10 in to cm");
  assert.equal(r.type, "units");
  assert.ok(Math.abs(r.value - 70) < 1e-9);
  assert.equal(r.to.id, "cm");
  assert.equal(parseQuery("5'10\" to cm").value, 70);
});
test("currency with codes, words and symbols", () => {
  assert.equal(unitId(parseQuery("100 usd to eur")), "100 USD>EUR");
  assert.equal(unitId(parseQuery("$250 to inr")), "250 USD>INR");
  assert.equal(unitId(parseQuery("50 euros in dollars")), "50 EUR>USD");
  assert.equal(parseQuery("100 usd to eur").cat.id, "currency");
});
test("discount", () => {
  assert.deepEqual(parseQuery("20% off 80"), { type: "discount", pct: 20, price: 80 });
  assert.deepEqual(parseQuery("20 percent discount on $80"), { type: "discount", pct: 20, price: 80 });
  assert.deepEqual(parseQuery("80 with 25% off"), { type: "discount", pct: 25, price: 80 });
  assert.deepEqual(parseQuery("discount 30% on 1,200"), { type: "discount", pct: 30, price: 1200 });
});
test("percentages and tips", () => {
  assert.deepEqual(parseQuery("what is 15% of 200"), { type: "percent", mode: "of", pct: 15, of: 200 });
  assert.deepEqual(parseQuery("20 is what % of 80"), { type: "percent", mode: "what", part: 20, whole: 80 });
  assert.deepEqual(parseQuery("from 50 to 75"), { type: "percent", mode: "change", from: 50, to: 75 });
  assert.deepEqual(parseQuery("tip 18% on 64.50 split 3"), { type: "tip", pct: 18, bill: 64.5, people: 3 });
});
test("time zones", () => {
  const r = parseQuery("3pm new york to london");
  assert.equal(r.type, "time");
  assert.deepEqual(r.clock, { h: 15, mi: 0 });
  assert.equal(r.from.tz, "America/New_York");
  assert.equal(r.to[0].tz, "Europe/London");
  assert.equal(parseQuery("9:30 am tokyo in los angeles").to[0].tz, "America/Los_Angeles");
  assert.equal(parseQuery("time in sydney").to[0].tz, "Australia/Sydney");
  assert.equal(parseQuery("noon pst to ist").to[0].tz, "Asia/Kolkata");
  assert.equal(parseQuery("now india to paris, tokyo").to.length, 2);
});
test("meeting finder", () => {
  const r = parseQuery("meeting new york, london and tokyo");
  assert.equal(r.type, "meeting");
  assert.equal(r.places.length, 3);
});
test("number bases, roman numerals and colors", () => {
  assert.deepEqual(parseQuery("255 to hex"), { type: "base", from: 10, text: "255" });
  assert.deepEqual(parseQuery("0xff"), { type: "base", from: 16, text: "ff" });
  assert.equal(parseQuery("2024 to roman").type, "roman");
  assert.equal(parseQuery("xiv to number").n, 14);
  assert.equal(parseQuery("#ff8800").type, "color");
});
test("non-queries return null", () => {
  assert.equal(parseQuery(""), null);
  assert.equal(parseQuery("hello world"), null);
  assert.equal(parseQuery("5 flurbs to zorbs"), null);
});
