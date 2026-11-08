// Calculators. Pure functions (no DOM), unit-tested in test/calc.test.mjs.

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const money = (n) => round2(n);

/**
 * Discount calculator. Applies a first discount (percent or flat amount), an optional extra percent,
 * then optional tax. Returns the breakdown.
 */
export function discount({ price, pct = 0, flat = 0, extraPct = 0, taxPct = 0 }) {
  const afterFirst = flat > 0 ? price - flat : price * (1 - pct / 100);
  const afterExtra = afterFirst * (1 - extraPct / 100);
  const tax = afterExtra * (taxPct / 100);
  const final = afterExtra + tax;
  const saved = price - afterExtra;
  return {
    price, afterDiscount: afterExtra, saved, savedPct: price ? (saved / price) * 100 : 0,
    tax, final,
  };
}

/** What was the original price, given the price paid after a percent discount? */
export function originalPrice(paid, pct) {
  if (pct >= 100) return NaN;
  const original = paid / (1 - pct / 100);
  return { original, saved: original - paid };
}

export const percentOf = (pct, of) => (pct / 100) * of; //            15% of 200
export const whatPercent = (part, whole) => (part / whole) * 100; //  20 is what % of 80
export const percentChange = (from, to) => ((to - from) / Math.abs(from)) * 100;

export function tip({ bill, pct, people = 1, roundUp = false }) {
  const n = Math.max(1, Math.floor(people));
  let tipAmt = bill * (pct / 100);
  let total = bill + tipAmt;
  let perPerson = total / n;
  if (roundUp) {
    perPerson = Math.ceil(perPerson - 1e-9);
    total = perPerson * n;
    tipAmt = total - bill;
  }
  return { tip: tipAmt, total, perPerson, tipPerPerson: tipAmt / n, people: n };
}

/** Add or remove VAT/GST/sales tax. */
export function vat({ amount, rate, mode = "add" }) {
  if (mode === "add") {
    const tax = amount * (rate / 100);
    return { net: amount, tax, gross: amount + tax };
  }
  const net = amount / (1 + rate / 100);
  return { net, tax: amount - net, gross: amount };
}

/** Monthly loan payment (EMI) with an amortization summary. */
export function emi({ principal, annualRate, months }) {
  const r = annualRate / 100 / 12;
  const payment = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
  const total = payment * months;
  return { payment, total, interest: total - principal };
}

export function amortization({ principal, annualRate, months }, rows = 12) {
  const r = annualRate / 100 / 12;
  const { payment } = emi({ principal, annualRate, months });
  let balance = principal;
  const out = [];
  for (let m = 1; m <= Math.min(rows, months); m++) {
    const interest = balance * r;
    const princ = payment - interest;
    balance -= princ;
    out.push({ month: m, interest, principal: princ, balance: Math.max(0, balance) });
  }
  return out;
}

// ------------------------------------------------------------------ dates (UTC math, no time zones involved)
const toUTC = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

export function parseISODate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 ? d : null;
}

/** Difference between two dates as years, months, days plus totals. Order does not matter. */
export function dateDiff(a, b) {
  let [from, to] = toUTC(a) <= toUTC(b) ? [a, b] : [b, a];
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) { years--; months += 12; }
  const totalDays = Math.round((toUTC(to) - toUTC(from)) / 86400000);
  return { years, months, days, totalDays, weeks: Math.floor(totalDays / 7), remainingDays: totalDays % 7 };
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  return d;
}

export const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ------------------------------------------------------------------ small converters
export function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null;
  const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}
export function fromRoman(s) {
  if (!/^[MDCLXVI]+$/i.test(s)) return null;
  const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const u = s.toUpperCase();
  let total = 0;
  for (let i = 0; i < u.length; i++) {
    const cur = v[u[i]], next = v[u[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return toRoman(total) === u ? total : null; // reject non-canonical forms like IIII
}

export function convertBase(text, fromBase) {
  const clean = text.trim().toLowerCase().replace(/^0x|^0b|^0o/, "").replace(/[\s_]/g, "");
  if (!clean || !/^[0-9a-z]+$/.test(clean)) return null;
  const digits = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, fromBase);
  if ([...clean].some((c) => !digits.includes(c))) return null;
  let n = 0n;
  for (const c of clean) n = n * BigInt(fromBase) + BigInt(digits.indexOf(c));
  return { bin: n.toString(2), oct: n.toString(8), dec: n.toString(10), hex: n.toString(16).toUpperCase() };
}

export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
export const rgbToHex = ({ r, g, b }) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
export function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

// Cooking: approximate grams per US cup
export const INGREDIENTS = [
  ["All-purpose flour", 125], ["Bread flour", 127], ["Whole wheat flour", 120], ["Granulated sugar", 200],
  ["Brown sugar (packed)", 213], ["Powdered sugar", 120], ["Butter", 227], ["Honey", 340], ["Milk", 245],
  ["Water", 237], ["Vegetable oil", 218], ["Olive oil", 216], ["Rice (uncooked)", 185], ["Rolled oats", 90],
  ["Cocoa powder", 85], ["Salt (table)", 288], ["Baking powder", 192], ["Peanut butter", 258], ["Maple syrup", 322],
];
