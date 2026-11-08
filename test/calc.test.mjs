import test from "node:test";
import assert from "node:assert/strict";
import { discount, originalPrice, percentOf, whatPercent, percentChange, tip, vat, emi, amortization, dateDiff, parseISODate, addDays, isoDate, toRoman, fromRoman, convertBase, hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from "../calc.js";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test("discount: percent, extra percent, flat, tax", () => {
  const d = discount({ price: 80, pct: 20 });
  close(d.final, 64); close(d.saved, 16); close(d.savedPct, 20);
  close(discount({ price: 100, pct: 20, extraPct: 10 }).final, 72);
  close(discount({ price: 100, flat: 15 }).final, 85);
  close(discount({ price: 100, pct: 10, taxPct: 8 }).final, 97.2);
});
test("reverse discount finds the original price", () => {
  close(originalPrice(64, 20).original, 80);
  assert.ok(Number.isNaN(originalPrice(10, 100)));
});
test("percentages", () => {
  close(percentOf(15, 200), 30);
  close(whatPercent(20, 80), 25);
  close(percentChange(50, 75), 50);
  close(percentChange(100, 80), -20);
});
test("tip and split", () => {
  const t = tip({ bill: 64.5, pct: 18, people: 3 });
  close(t.tip, 11.61); close(t.total, 76.11); close(t.perPerson, 25.37);
  const r = tip({ bill: 50, pct: 15, people: 1, roundUp: true });
  assert.equal(r.total, 58);
});
test("vat add and remove", () => {
  close(vat({ amount: 100, rate: 18 }).gross, 118);
  const r = vat({ amount: 118, rate: 18, mode: "remove" });
  close(r.net, 100); close(r.tax, 18);
});
test("emi matches the standard formula", () => {
  const e = emi({ principal: 100000, annualRate: 12, months: 12 });
  close(e.payment, 8884.88, 0.01);
  close(emi({ principal: 1200, annualRate: 0, months: 12 }).payment, 100);
  const rows = amortization({ principal: 100000, annualRate: 12, months: 12 }, 12);
  close(rows[11].balance, 0, 0.01);
});
test("date difference", () => {
  const a = parseISODate("2020-02-29"), b = parseISODate("2026-11-08");
  const d = dateDiff(a, b);
  assert.equal(d.years, 6); assert.equal(d.months, 8); assert.equal(d.days, 10);
  assert.equal(dateDiff(parseISODate("2026-01-01"), parseISODate("2026-01-31")).totalDays, 30);
  assert.equal(dateDiff(b, a).totalDays, dateDiff(a, b).totalDays);
  assert.equal(parseISODate("2026-02-31"), null);
  assert.equal(isoDate(addDays(parseISODate("2026-12-30"), 5)), "2027-01-04");
});
test("roman numerals", () => {
  assert.equal(toRoman(2024), "MMXXIV");
  assert.equal(fromRoman("MMXXIV"), 2024);
  assert.equal(fromRoman("IIII"), null);
  assert.equal(toRoman(4000), null);
});
test("number bases", () => {
  assert.deepEqual(convertBase("ff", 16), { bin: "11111111", oct: "377", dec: "255", hex: "FF" });
  assert.equal(convertBase("102", 2), null);
  assert.equal(convertBase("0xFF", 16).dec, "255");
});
test("colors round-trip", () => {
  assert.deepEqual(hexToRgb("#ff8800"), { r: 255, g: 136, b: 0 });
  assert.equal(rgbToHex({ r: 255, g: 136, b: 0 }), "#FF8800");
  assert.deepEqual(rgbToHsl({ r: 255, g: 136, b: 0 }), { h: 32, s: 100, l: 50 });
  const back = hslToRgb(rgbToHsl({ r: 10, g: 120, b: 200 }));
  assert.ok(Math.abs(back.r - 10) <= 3 && Math.abs(back.b - 200) <= 3);
});
