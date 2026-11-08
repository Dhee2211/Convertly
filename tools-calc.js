// Calculators: discount, percentage, tip, VAT, loan/EMI, dates.
import { h, clear, field, chips, resultRow, query, plain, copyText } from "./ui.js";
import { discount, originalPrice, percentOf, whatPercent, percentChange, tip, vat, emi, amortization, dateDiff, parseISODate, addDays, isoDate } from "./calc.js";
import { formatNumber } from "./units.js";

const money = (n) => (Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—");
const num = (input) => { const v = Number(String(input.value).replace(/,/g, "")); return Number.isFinite(v) && input.value.trim() !== "" ? v : NaN; };
const pctText = (n) => `${formatNumber(n, 4)}%`;

// ------------------------------------------------------------------ discount
export function renderDiscount(tool, root) {
  let mode = query.get("m", "sale"); // sale | original
  let flat = query.get("f") === "1";
  const price = field({ label: "Price", value: query.get("p", ""), id: "value", autofocus: true, prefix: "", placeholder: "e.g. 80", onInput: () => draw() });
  const off = field({ label: "Discount", value: query.get("d", ""), placeholder: "e.g. 20", suffix: "%", onInput: () => draw() });
  const quick = chips(["10", "15", "20", "25", "30", "40", "50", "70"].map((v) => ({ value: v, label: v + "%" })), query.get("d", ""), (v) => { off.input.value = v; draw(); }, { ariaLabel: "Quick discounts" });
  const extra = field({ label: "Extra discount", value: query.get("e", ""), placeholder: "0", suffix: "%", onInput: () => draw() });
  const tax = field({ label: "Tax", value: query.get("t", ""), placeholder: "0", suffix: "%", onInput: () => draw() });
  const modeChips = chips([{ value: "sale", label: "Find sale price" }, { value: "original", label: "Find original price" }], mode, (v) => { mode = v; draw(); }, { ariaLabel: "Mode" });
  const flatChips = chips([{ value: "pct", label: "Percent off" }, { value: "flat", label: "Amount off" }], flat ? "flat" : "pct", (v) => { flat = v === "flat"; off.el.querySelector(".field-label").textContent = flat ? "Amount off" : "Discount"; off.el.querySelectorAll(".affix").forEach((a) => (a.textContent = flat ? "" : "%")); draw(); }, { ariaLabel: "Discount type" });
  const out = h("div", { class: "results" });

  function draw() {
    const p = num(price.input), d = num(off.input), e = num(extra.input) || 0, t = num(tax.input) || 0;
    query.set({ p: price.input.value, d: off.input.value, e: extra.input.value, t: tax.input.value, m: mode === "sale" ? "" : mode, f: flat ? "1" : "" });
    clear(out);
    quick.set(off.input.value);
    price.el.querySelector(".field-label").textContent = mode === "sale" ? "Original price" : "Price you paid";
    if (!Number.isFinite(p) || !Number.isFinite(d)) { out.append(h("p", { class: "note" }, "Enter a price and a discount to see the result.")); return; }
    if (mode === "original") {
      const r = originalPrice(p, d);
      if (!r) { out.append(h("p", { class: "note" }, "A discount of 100% or more has no original price.")); return; }
      out.append(resultRow("Original price", money(r.original), { big: true, copy: plain(Math.round(r.original * 100) / 100) }), resultRow("You saved", money(r.saved)));
      return;
    }
    const r = discount({ price: p, pct: flat ? 0 : d, flat: flat ? d : 0, extraPct: e, taxPct: t });
    out.append(resultRow("You pay", money(r.final), { big: true, copy: plain(Math.round(r.final * 100) / 100) }),
      resultRow("You save", `${money(r.saved)} (${pctText(r.savedPct)})`, { copy: plain(Math.round(r.saved * 100) / 100) }));
    if (e || t) {
      out.append(resultRow("After discount", money(r.afterDiscount)));
      if (t) out.append(resultRow("Tax", money(r.tax)));
    }
  }
  root.append(modeChips, h("div", { class: "inputs" }, price.el, off.el), flatChips, quick,
    h("details", { class: "more", open: !!(query.get("e") || query.get("t")) }, h("summary", {}, "Extra discount or tax"), h("div", { class: "inputs" }, extra.el, tax.el)), out);
  draw();
}

// ------------------------------------------------------------------ percentage
export function renderPercentage(tool, root) {
  const card = (title, ...kids) => h("section", { class: "card" }, h("h2", {}, title), ...kids);
  const a1 = field({ label: "Percent", value: query.get("a1", ""), suffix: "%", autofocus: true, onInput: () => draw() });
  const b1 = field({ label: "Of", value: query.get("b1", ""), onInput: () => draw() });
  const r1 = h("div", { class: "results" });
  const a2 = field({ label: "Value", value: query.get("a2", ""), onInput: () => draw() });
  const b2 = field({ label: "Is what percent of", value: query.get("b2", ""), onInput: () => draw() });
  const r2 = h("div", { class: "results" });
  const a3 = field({ label: "From", value: query.get("a3", ""), onInput: () => draw() });
  const b3 = field({ label: "To", value: query.get("b3", ""), onInput: () => draw() });
  const r3 = h("div", { class: "results" });
  function draw() {
    query.set({ a1: a1.input.value, b1: b1.input.value, a2: a2.input.value, b2: b2.input.value, a3: a3.input.value, b3: b3.input.value });
    for (const r of [r1, r2, r3]) clear(r);
    const [x1, y1, x2, y2, x3, y3] = [a1, b1, a2, b2, a3, b3].map((f) => num(f.input));
    if (Number.isFinite(x1) && Number.isFinite(y1)) r1.append(resultRow(`${formatNumber(x1)}% of ${formatNumber(y1)}`, formatNumber(percentOf(x1, y1)), { big: true, copy: plain(percentOf(x1, y1)) }));
    if (Number.isFinite(x2) && Number.isFinite(y2) && y2 !== 0) r2.append(resultRow(`${formatNumber(x2)} of ${formatNumber(y2)}`, pctText(whatPercent(x2, y2)), { big: true, copy: plain(whatPercent(x2, y2)) }));
    if (Number.isFinite(x3) && Number.isFinite(y3) && x3 !== 0) {
      const c = percentChange(x3, y3);
      r3.append(resultRow(c >= 0 ? "Increase" : "Decrease", pctText(Math.abs(c)), { big: true, copy: plain(Math.abs(c)) }), resultRow("Difference", formatNumber(y3 - x3), { copy: plain(y3 - x3) }));
    }
  }
  root.append(h("div", { class: "stack" }, card("What is X% of Y?", h("div", { class: "inputs" }, a1.el, b1.el), r1), card("X is what percent of Y?", h("div", { class: "inputs" }, a2.el, b2.el), r2),
    card("Percentage change", h("div", { class: "inputs" }, a3.el, b3.el), r3)));
  draw();
}

// ------------------------------------------------------------------ tip
export function renderTip(tool, root) {
  const bill = field({ label: "Bill", value: query.get("b", ""), id: "value", autofocus: true, placeholder: "e.g. 64.50", onInput: () => draw() });
  const pct = field({ label: "Tip", value: query.get("t", "18"), suffix: "%", onInput: () => { quick.set(pct.input.value); draw(); } });
  const quick = chips(["10", "15", "18", "20", "25"].map((v) => ({ value: v, label: v + "%" })), query.get("t", "18"), (v) => { pct.input.value = v; draw(); }, { ariaLabel: "Tip percent" });
  const people = field({ label: "People", value: query.get("n", "1"), step: "1", min: 1, onInput: () => draw() });
  let round = query.get("r") === "1";
  const roundBox = h("input", { type: "checkbox", checked: round, onchange: (e) => { round = e.target.checked; draw(); } });
  const out = h("div", { class: "results" });
  function draw() {
    query.set({ b: bill.input.value, t: pct.input.value === "18" ? "" : pct.input.value, n: people.input.value === "1" ? "" : people.input.value, r: round ? "1" : "" });
    clear(out);
    const b = num(bill.input), t = num(pct.input), n = num(people.input) || 1;
    if (!Number.isFinite(b) || !Number.isFinite(t)) { out.append(h("p", { class: "note" }, "Enter the bill to see the tip.")); return; }
    const r = tip({ bill: b, pct: t, people: n, roundUp: round });
    out.append(r.people > 1 ? resultRow("Each person pays", money(r.perPerson), { big: true, copy: plain(Math.round(r.perPerson * 100) / 100) }) : resultRow("Total", money(r.total), { big: true, copy: plain(Math.round(r.total * 100) / 100) }),
      resultRow("Tip", money(r.tip)), r.people > 1 ? resultRow("Total", money(r.total)) : null, r.people > 1 ? resultRow("Tip each", money(r.tipPerPerson)) : null);
  }
  root.append(h("div", { class: "inputs" }, bill.el, people.el), pct.el, quick, h("label", { class: "check" }, roundBox, " Round each share up to a whole amount"), out);
  draw();
}

// ------------------------------------------------------------------ VAT / GST / tax
export function renderVat(tool, root) {
  let mode = query.get("m", "add");
  const amount = field({ label: "Amount", value: query.get("a", ""), id: "value", autofocus: true, onInput: () => draw() });
  const rate = field({ label: "Tax rate", value: query.get("r", "18"), suffix: "%", onInput: () => { quick.set(rate.input.value); draw(); } });
  const quick = chips(["5", "8", "10", "12", "18", "20", "25"].map((v) => ({ value: v, label: v + "%" })), query.get("r", "18"), (v) => { rate.input.value = v; draw(); }, { ariaLabel: "Tax rate" });
  const modeChips = chips([{ value: "add", label: "Add tax" }, { value: "remove", label: "Remove tax" }], mode, (v) => { mode = v; draw(); }, { ariaLabel: "Mode" });
  const out = h("div", { class: "results" });
  function draw() {
    query.set({ a: amount.input.value, r: rate.input.value === "18" ? "" : rate.input.value, m: mode === "add" ? "" : mode });
    clear(out);
    amount.el.querySelector(".field-label").textContent = mode === "add" ? "Price before tax" : "Price including tax";
    const a = num(amount.input), r = num(rate.input);
    if (!Number.isFinite(a) || !Number.isFinite(r)) { out.append(h("p", { class: "note" }, "Enter an amount to see the tax.")); return; }
    const v = vat({ amount: a, rate: r, mode });
    out.append(resultRow(mode === "add" ? "Total with tax" : "Price before tax", money(mode === "add" ? v.gross : v.net), { big: true, copy: plain(Math.round((mode === "add" ? v.gross : v.net) * 100) / 100) }),
      resultRow("Tax", money(v.tax)), resultRow(mode === "add" ? "Price before tax" : "Price including tax", money(mode === "add" ? v.net : v.gross)));
  }
  root.append(modeChips, h("div", { class: "inputs" }, amount.el, rate.el), quick, out);
  draw();
}

// ------------------------------------------------------------------ loan / EMI
export function renderEmi(tool, root) {
  let unit = query.get("u", "years");
  const principal = field({ label: "Loan amount", value: query.get("p", ""), id: "value", autofocus: true, placeholder: "e.g. 250000", onInput: () => draw() });
  const rate = field({ label: "Interest rate (per year)", value: query.get("r", ""), suffix: "%", placeholder: "e.g. 7.5", onInput: () => draw() });
  const term = field({ label: "Term", value: query.get("t", ""), placeholder: "e.g. 20", onInput: () => draw() });
  const unitChips = chips(["years", "months"], unit, (v) => { unit = v; draw(); }, { ariaLabel: "Term unit" });
  const out = h("div", { class: "results" });
  const table = h("div", {});
  function draw() {
    query.set({ p: principal.input.value, r: rate.input.value, t: term.input.value, u: unit === "years" ? "" : unit });
    clear(out); clear(table);
    const p = num(principal.input), r = num(rate.input), t = num(term.input);
    if (![p, r, t].every(Number.isFinite) || p <= 0 || t <= 0) { out.append(h("p", { class: "note" }, "Enter the amount, rate and term.")); return; }
    const months = Math.round(unit === "years" ? t * 12 : t);
    const e = emi({ principal: p, annualRate: r, months });
    out.append(resultRow("Monthly payment", money(e.payment), { big: true, copy: plain(Math.round(e.payment * 100) / 100) }), resultRow("Total interest", money(e.interest)), resultRow("Total paid", money(e.total)));
    const rows = amortization({ principal: p, annualRate: r, months }, Math.min(months, 12));
    table.append(h("details", { class: "more" }, h("summary", {}, "First 12 months"),
      h("table", {}, h("thead", {}, h("tr", {}, ["Month", "Principal", "Interest", "Balance"].map((x) => h("th", {}, x)))),
        h("tbody", {}, rows.map((x) => h("tr", {}, h("td", {}, x.month), h("td", {}, money(x.principal)), h("td", {}, money(x.interest)), h("td", {}, money(x.balance))))))));
  }
  root.append(h("div", { class: "inputs three" }, principal.el, rate.el, term.el), unitChips, out, table);
  draw();
}

// ------------------------------------------------------------------ dates
export function renderDate(tool, root) {
  const today = isoDate(new Date());
  let mode = query.get("m", "diff");
  const modeChips = chips([{ value: "diff", label: "Days between" }, { value: "age", label: "Age" }, { value: "add", label: "Add / subtract days" }], mode, (v) => { mode = v; drawForm(); }, { ariaLabel: "Mode" });
  const form = h("div", {});
  const out = h("div", { class: "results" });
  const fields = {};
  const mk = (key, label, def, type = "date") => (fields[key] = field({ label, type, value: query.get(key, def), step: type === "number" ? "1" : undefined, onInput: () => draw() }));
  function drawForm() {
    clear(form);
    if (mode === "diff") form.append(h("div", { class: "inputs" }, mk("a", "Start date", today).el, mk("b", "End date", today).el));
    if (mode === "age") form.append(h("div", { class: "inputs" }, mk("a", "Date of birth", "").el, mk("b", "As of", today).el));
    if (mode === "add") form.append(h("div", { class: "inputs" }, mk("a", "Start date", today).el, mk("n", "Days (negative to subtract)", "30", "number").el));
    draw();
  }
  function draw() {
    clear(out);
    query.set({ m: mode === "diff" ? "" : mode, a: fields.a?.input.value, b: fields.b?.input.value, n: fields.n?.input.value });
    const A = parseISODate(fields.a?.input.value), B = parseISODate(fields.b?.input.value);
    if (mode === "add") {
      const n = num(fields.n.input);
      if (!A || !Number.isFinite(n)) return;
      const d = addDays(A, Math.round(n));
      out.append(resultRow("Resulting date", d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }), { big: true, copy: isoDate(d) }));
      return;
    }
    if (!A || !B) { out.append(h("p", { class: "note" }, "Pick both dates.")); return; }
    const r = dateDiff(A, B);
    const text = `${r.years} year${r.years === 1 ? "" : "s"}, ${r.months} month${r.months === 1 ? "" : "s"}, ${r.days} day${r.days === 1 ? "" : "s"}`;
    out.append(resultRow(mode === "age" ? "Age" : "Difference", text, { big: true, copy: text }),
      resultRow("Total days", formatNumber(r.totalDays), { copy: String(r.totalDays) }), resultRow("Weeks and days", `${r.weeks} weeks, ${r.remainingDays} days`),
      resultRow("Total months", formatNumber(r.years * 12 + r.months)));
    if (mode === "age") {
      const next = new Date(B.getFullYear(), A.getMonth(), A.getDate());
      if (next < B) next.setFullYear(B.getFullYear() + 1);
      out.append(resultRow("Next birthday in", `${dateDiff(B, next).totalDays} days`));
    }
  }
  root.append(modeChips, form, out);
  drawForm();
}
