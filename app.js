// Page shell: the search box that understands plain-English queries, and mounting the page's tool.
import { h, clear, resultRow, plain, debounce } from "./ui.js";
import { parseQuery } from "./parse.js";
import { convert, convertAll, formatNumber, hasCurrencyRates, POPULAR_CURRENCIES } from "./units.js";
import { discount, percentOf, whatPercent, percentChange, tip, toRoman, convertBase, hexToRgb, rgbToHex, rgbToHsl } from "./calc.js";
import { convertClock, zoneLabel, formatTime, formatDay, zoneAbbr, offsetLabel, zonedToInstant, partsIn, localZone } from "./tz.js";
import { loadRates } from "./currency.js";
import { TOOLS, toolById } from "./tools-meta.js";

const ROOT = document.documentElement.dataset.root || "./";
const toolId = document.body.dataset.tool;
const money = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const href = (slug, params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null && v !== false)).toString();
  return `${ROOT}${slug}/${qs ? "?" + qs : ""}`;
};
const slugOf = (id) => toolById(id).slug;
/** Prefer conversions whose results are a comfortable size to read (not 0.000001 or 5,000,000,000). */
const relevant = (rows) => (rows.length > 30 ? rows.filter((r) => POPULAR_CURRENCIES.includes(r.unit.id)) : [...rows]).sort((a, b) => Math.abs(Math.log10(Math.abs(a.value) || 1e-9) - 1.5) - Math.abs(Math.log10(Math.abs(b.value) || 1e-9) - 1.5));

// ------------------------------------------------------------------ search box
const input = document.getElementById("q");
const answer = document.getElementById("answer");
let ratesRequested = false;

const openLink = (text, url) => h("a", { class: "open", href: url }, text, " →");

function renderAnswer(r) {
  clear(answer);
  if (!r) { answer.hidden = true; return; }
  answer.hidden = false;
  const card = h("div", { class: "answer-card" });

  if (r.type === "units") {
    const label = r.note || `${formatNumber(r.value)} ${r.from.sym}`;
    if (r.to) {
      const v = convert(r.value, r.from, r.to);
      card.append(resultRow(`${label} =`, `${formatNumber(v)} ${r.to.sym}`, { big: true, copy: plain(v), sub: r.to.name }));
      const others = relevant(convertAll(r.value, r.cat, r.from).filter((x) => x.unit.id !== r.from.id && x.unit.id !== r.to.id)).slice(0, 4);
      card.append(h("div", { class: "also" }, others.map((x) => h("span", {}, `${formatNumber(x.value, 6)} ${x.unit.sym}`))));
    } else {
      const rows = relevant(convertAll(r.value, r.cat, r.from).filter((x) => x.unit.id !== r.from.id)).slice(0, 8);
      card.append(h("div", { class: "answer-title" }, `${label} is`), h("div", { class: "results grid" }, rows.map((x) => h("div", { class: "unit-card" }, resultRow(x.unit.name, `${formatNumber(x.value)} ${x.unit.sym}`, { copy: plain(x.value) })))));
    }
    card.append(openLink(`All ${r.cat.name.toLowerCase()} units`, href(slugOf(r.cat.id), { v: r.value === 1 ? "" : r.value, u: r.from.id === r.cat.units[0].id ? "" : r.from.id })));
  } else if (r.type === "discount") {
    const d = discount({ price: r.price, pct: r.pct });
    card.append(resultRow(`${formatNumber(r.pct)}% off ${money(r.price)}`, money(d.final), { big: true, copy: plain(Math.round(d.final * 100) / 100), sub: "you pay" }), resultRow("You save", money(d.saved)),
      openLink("Discount calculator", href(slugOf("discount"), { p: r.price, d: r.pct })));
  } else if (r.type === "percent") {
    if (r.mode === "of") { const v = percentOf(r.pct, r.of); card.append(resultRow(`${formatNumber(r.pct)}% of ${formatNumber(r.of)}`, formatNumber(v), { big: true, copy: plain(v) }), openLink("Percentage calculator", href(slugOf("percentage"), { a1: r.pct, b1: r.of }))); }
    if (r.mode === "what") { const v = whatPercent(r.part, r.whole); card.append(resultRow(`${formatNumber(r.part)} of ${formatNumber(r.whole)}`, `${formatNumber(v, 6)}%`, { big: true, copy: plain(v) }), openLink("Percentage calculator", href(slugOf("percentage"), { a2: r.part, b2: r.whole }))); }
    if (r.mode === "change") { const v = percentChange(r.from, r.to); card.append(resultRow(`${formatNumber(r.from)} → ${formatNumber(r.to)}`, `${v >= 0 ? "+" : "−"}${formatNumber(Math.abs(v), 6)}%`, { big: true, copy: plain(v) }), openLink("Percentage calculator", href(slugOf("percentage"), { a3: r.from, b3: r.to }))); }
  } else if (r.type === "tip") {
    const t = tip({ bill: r.bill, pct: r.pct, people: r.people });
    card.append(resultRow(r.people > 1 ? "Each person pays" : "Total", money(r.people > 1 ? t.perPerson : t.total), { big: true, copy: plain(Math.round((r.people > 1 ? t.perPerson : t.total) * 100) / 100) }), resultRow("Tip", money(t.tip)),
      openLink("Tip calculator", href(slugOf("tip"), { b: r.bill, t: r.pct, n: r.people > 1 ? r.people : "" })));
  } else if (r.type === "time") {
    const from = r.from || { name: zoneLabel(localZone()), tz: localZone() };
    let instant = Date.now();
    if (!r.clock.now) { const p = partsIn(instant, from.tz); instant = zonedToInstant({ y: p.y, mo: p.mo, d: p.d, h: r.clock.h, mi: r.clock.mi }, from.tz); }
    if (r.from) card.append(resultRow(`${from.name} · ${zoneAbbr(instant, from.tz)}`, formatTime(instant, from.tz), { copy: formatTime(instant, from.tz), sub: formatDay(instant, from.tz) }));
    r.to.forEach((p, i) => card.append(resultRow(`${p.name} · ${zoneAbbr(instant, p.tz)}`, formatTime(instant, p.tz), { big: i === 0, copy: formatTime(instant, p.tz), sub: `${formatDay(instant, p.tz)} · ${offsetLabel(p.tz, instant)}` })));
    card.append(openLink("Time zone converter", href(slugOf("timezone"), { t: r.clock.now ? "" : input.value.match(/\d{1,2}(:\d{2})?\s*(am|pm)?|noon|midnight/i)?.[0] || "", from: r.from ? (r.from.name !== zoneLabel(r.from.tz) ? `${r.from.tz}~${r.from.name}` : r.from.tz) : "", to: r.to.map((p) => (p.name !== zoneLabel(p.tz) ? `${p.tz}~${p.name}` : p.tz)).join(",") })));
  } else if (r.type === "meeting") {
    card.append(h("div", { class: "answer-title" }, `Find a meeting time for ${r.places.map((p) => p.name).join(", ")}`), openLink("Open the meeting finder", href(slugOf("meeting"), { z: r.places.map((p) => (p.name && p.name !== zoneLabel(p.tz) ? `${p.tz}~${p.name}` : p.tz)).join(",") })));
  } else if (r.type === "base") {
    const b = convertBase(r.text, r.from);
    if (!b) { answer.hidden = true; return; }
    for (const [label, k, pre] of [["Decimal", "dec", ""], ["Hex", "hex", "0x"], ["Binary", "bin", "0b"], ["Octal", "oct", "0o"]]) card.append(resultRow(label, pre + b[k], { copy: b[k] }));
    card.append(openLink("Number base converter", href(slugOf("base"), { v: r.text, b: r.from === 10 ? "" : r.from })));
  } else if (r.type === "roman") {
    card.append(resultRow(r.roman ? `${r.roman} =` : `${r.n} =`, r.roman ? String(r.n) : toRoman(r.n) || "—", { big: true }), openLink("Roman numeral converter", href(slugOf("roman"), { n: r.n })));
  } else if (r.type === "color") {
    const rgb = r.rgb || hexToRgb(r.hex), hex = rgbToHex(rgb), hsl = rgbToHsl(rgb);
    card.append(h("div", { class: "swatch small", style: { background: hex } }), resultRow("HEX", hex), resultRow("RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`), resultRow("HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`),
      openLink("Color converter", href(slugOf("color"), { c: hex.slice(1).toLowerCase() })));
  }
  answer.append(card);
}

function renderToolMatches(text) {
  const q = text.trim().toLowerCase();
  clear(answer);
  if (!q) { answer.hidden = true; return; }
  const hits = TOOLS.filter((t) => (t.name + " " + t.keywords.join(" ")).toLowerCase().includes(q)).slice(0, 6);
  answer.hidden = false;
  answer.append(h("div", { class: "answer-card" }, hits.length
    ? [h("div", { class: "answer-title" }, "Tools"), h("div", { class: "tool-list" }, hits.map((t) => h("a", { class: "tool-hit", href: href(t.slug) }, h("b", {}, t.name), h("small", {}, t.group))))]
    : h("p", { class: "note" }, "Try “5 km to miles”, “20% off 80”, “3pm New York to London” or “100 usd to eur”.")));
}

async function run() {
  const text = input.value;
  if (!text.trim()) return renderAnswer(null);
  let r = parseQuery(text);
  if (!r && !hasCurrencyRates() && /\d/.test(text) && /[a-z$€£¥₹]/i.test(text) && !ratesRequested) {
    ratesRequested = true;
    try { await loadRates(); if (input.value === text) r = parseQuery(text); } catch { /* offline: ignore */ }
  }
  r ? renderAnswer(r) : renderToolMatches(text);
}
input.addEventListener("input", debounce(run, 60));
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { const a = answer.querySelector("a.open"); if (a) location.href = a.href; }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== input && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); input.select(); }
});
if (new URLSearchParams(location.search).get("q")) { input.value = new URLSearchParams(location.search).get("q"); run(); }

// ------------------------------------------------------------------ mount the page's tool
if (toolId) {
  const tool = toolById(toolId);
  const mount = document.getElementById("tool");
  const load = async () => {
    if (tool.kind === "units") return (await import("./tools-units.js")).renderUnits(tool, mount);
    if (["cooking", "base", "roman", "color", "unix"].includes(tool.id)) {
      const m = await import("./tools-units.js");
      return { cooking: m.renderCooking, base: m.renderBase, roman: m.renderRoman, color: m.renderColor, unix: m.renderUnix }[tool.id](tool, mount);
    }
    if (tool.kind === "calc") {
      const m = await import("./tools-calc.js");
      return { discount: m.renderDiscount, percentage: m.renderPercentage, tip: m.renderTip, vat: m.renderVat, emi: m.renderEmi, date: m.renderDate }[tool.id](tool, mount);
    }
    const m = await import("./tools-time.js");
    return { meeting: m.renderMeeting, timezone: m.renderTimezone }[tool.id](tool, mount);
  };
  load().catch((e) => { console.error(e); mount.replaceChildren(h("p", { class: "error" }, "Something went wrong loading this tool. Please refresh the page.")); });
}
