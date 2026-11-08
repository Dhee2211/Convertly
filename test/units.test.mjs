import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, getCategory, resolvePair, resolveOne, convert, convertAll, formatNumber, setCurrencyRates, allCategories, lookupUnit } from "../units.js";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} vs ${b}`);
const conv = (v, a, b) => { const p = resolvePair(a, b); assert.ok(p, `no pair ${a} -> ${b}`); return convert(v, p.from, p.to); };

test("length", () => {
  close(conv(5, "km", "miles"), 3.106856, 1e-6);
  close(conv(1, "mile", "km"), 1.609344);
  close(conv(6, "ft", "cm"), 182.88);
  close(conv(100, "in", "cm"), 254);
  close(conv(1, "ly", "km"), 9.4607304725808e12, 1e-9);
});
test("weight", () => {
  close(conv(1, "kg", "lb"), 2.2046226, 1e-6);
  close(conv(16, "oz", "lb"), 1);
  close(conv(1, "stone", "lb"), 14, 1e-6);
});
test("temperature", () => {
  close(conv(100, "c", "f"), 212);
  close(conv(32, "f", "c"), 0);
  close(conv(0, "c", "k"), 273.15);
  close(conv(-40, "c", "f"), -40);
});
test("volume, area, speed, time, data", () => {
  close(conv(1, "gallon", "liters"), 3.785411784);
  close(conv(1, "cup", "ml"), 236.5882365);
  close(conv(1, "acre", "m2"), 4046.8564224);
  close(conv(60, "mph", "km/h"), 96.56064);
  close(conv(1, "year", "days"), 365.25);
  close(conv(1, "gb", "mb"), 1000);
  close(conv(1, "gib", "mib"), 1024);
  close(conv(8, "bits", "bytes"), 1);
});
test("energy, power, pressure, angle, fuel", () => {
  close(conv(1, "kwh", "kj"), 3600);
  close(conv(1, "hp", "kw"), 0.74569987, 1e-6);
  close(conv(1, "atm", "psi"), 14.695949, 1e-6);
  close(conv(180, "deg", "rad"), Math.PI);
  close(conv(30, "mpg", "l/100km"), 7.8404861, 1e-6);
  close(conv(10, "l/100km", "km/l"), 10);
});
test("pair resolution picks the shared category", () => {
  assert.equal(resolvePair("oz", "g").cat.id, "mass");
  assert.equal(resolvePair("fl oz", "ml").cat.id, "volume");
  assert.equal(resolvePair("min", "sec").cat.id, "time");
  assert.equal(resolvePair("c", "f").cat.id, "temperature");
  assert.equal(resolvePair("km", "kg"), null);
  assert.equal(resolveOne("kilometers").cat.id, "length");
});
test("convertAll returns every unit and round-trips", () => {
  const cat = getCategory("length"), m = cat.units.find((u) => u.id === "m");
  const all = convertAll(1000, cat, m);
  assert.equal(all.length, cat.units.length);
  close(all.find((r) => r.unit.id === "km").value, 1);
  for (const c of CATEGORIES) for (const u of c.units) close(u.fromBase(u.toBase(7.5)), 7.5, 1e-9);
});
test("formatNumber", () => {
  assert.equal(formatNumber(0), "0");
  assert.equal(formatNumber(1234.5), "1,234.5");
  assert.equal(formatNumber(0.1 + 0.2), "0.3");
  assert.equal(formatNumber(3.106856345), "3.1068563");
  assert.match(formatNumber(1e20), /e20$/);
});
test("currency rates plug in as a category", () => {
  setCurrencyRates({ USD: 1, EUR: 0.9, INR: 90 }, { date: "2026-01-01" });
  assert.ok(allCategories().some((c) => c.id === "currency"));
  close(conv(100, "usd", "eur"), 90);
  close(conv(90, "inr", "usd"), 1);
  close(conv(1, "eur", "inr"), 100);
  assert.ok(lookupUnit("dollars").length > 0);
});
