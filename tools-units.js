// Unit converters (one generic UI for every category) plus currency and the small special converters.
import { h, clear, field, select, chips, resultRow, copyText, query, store, plain, debounce } from "./ui.js";
import { getCategory, convertAll, formatNumber, POPULAR_CURRENCIES } from "./units.js";
import { loadRates } from "./currency.js";
import { toRoman, fromRoman, convertBase, hexToRgb, rgbToHex, rgbToHsl, hslToRgb, INGREDIENTS } from "./calc.js";

// ------------------------------------------------------------------ generic units
export async function renderUnits(tool, root) {
  const isCurrency = tool.id === "currency";
  const note = h("p", { class: "note" });
  const results = h("div", { class: "results grid" });
  const more = h("button", { type: "button", class: "link", hidden: true }, "");
  const filter = h("input", { type: "search", class: "filter", placeholder: "Filter currencies…", "aria-label": "Filter currencies", hidden: true });
  let showAll = false;

  if (isCurrency) {
    root.append(h("p", { class: "note" }, "Loading live rates…"));
    try {
      const r = await loadRates();
      clear(root);
      note.append(`Rates as of ${r.date}${r.stale ? " (offline copy)" : ""} · `, h("a", { href: r.url, target: "_blank", rel: "noopener" }, `Rates by ${r.source}`),
        ". Mid-market rates for reference. Your bank or card will charge a little more.");
    } catch (e) {
      clear(root);
      root.append(h("p", { class: "error" }, e.message));
      return;
    }
  }

  const cat = getCategory(tool.id);
  const savedUnit = store.get("unit:" + tool.id);
  const defaultUnit = isCurrency ? "USD" : cat.units[0].id;
  const unitOf = (id) => cat.units.find((u) => u.id === id) || cat.units.find((u) => u.id === defaultUnit);
  let from = unitOf(query.get("u") || savedUnit || defaultUnit);

  const valueField = field({ label: "Amount", value: query.get("v", "1"), id: "value", autofocus: true, onInput: () => draw() });
  const unitSelect = select(cat.units.map((u) => ({ value: u.id, label: isCurrency ? `${u.id} · ${u.name}` : `${u.name} (${u.sym})` })), from.id, (id) => {
    from = unitOf(id);
    store.set("unit:" + tool.id, id);
    draw();
  }, { label: "Convert from" });

  function draw() {
    const raw = valueField.input.value.trim();
    const v = Number(raw.replace(/,/g, ""));
    query.set({ v: raw === "1" ? "" : raw, u: from.id === defaultUnit ? "" : from.id });
    clear(results);
    if (raw === "" || !Number.isFinite(v)) { results.append(h("p", { class: "note" }, "Type a number to see the conversions.")); return; }
    let rows = convertAll(v, cat, from);
    if (isCurrency) {
      const q = filter.value.trim().toLowerCase();
      const pinned = new Set([...POPULAR_CURRENCIES, from.id]);
      rows = rows.filter((r) => (q ? (r.unit.id + " " + r.unit.name).toLowerCase().includes(q) : showAll || pinned.has(r.unit.id)));
      more.hidden = !!q || cat.units.length <= pinned.size;
      more.textContent = showAll ? "Show fewer currencies" : `Show all ${cat.units.length} currencies`;
      filter.hidden = !showAll;
    }
    for (const { unit, value } of rows) {
      const isSource = unit.id === from.id;
      results.append(h("div", { class: "unit-card" + (isSource ? " source" : "") },
        resultRow(isCurrency ? unit.id : unit.name, `${formatNumber(value)}${isCurrency ? "" : " " + unit.sym}`, { copy: plain(value), sub: isCurrency ? unit.name : unit.sym })));
    }
  }
  more.addEventListener("click", () => { showAll = !showAll; draw(); });
  filter.addEventListener("input", debounce(draw, 80));
  root.append(h("div", { class: "inputs" }, valueField.el, h("label", { class: "field" }, h("span", { class: "field-label" }, "From"), unitSelect)), results);
  if (isCurrency) root.append(h("div", { class: "row" }, filter, more), note);
  draw();
}

// ------------------------------------------------------------------ cooking
export function renderCooking(tool, root) {
  const units = [["cup", "Cups", 1], ["tbsp", "Tablespoons", 16], ["tsp", "Teaspoons", 48], ["g", "Grams", null], ["oz", "Ounces (weight)", null], ["ml", "Milliliters", null]];
  const ing = select(INGREDIENTS.map(([n], i) => ({ value: i, label: n })), Number(query.get("i", 0)), () => draw(), { label: "Ingredient" });
  const amt = field({ label: "Amount", value: query.get("v", "1"), onInput: () => draw(), autofocus: true });
  const unit = select(units.map(([id, n]) => ({ value: id, label: n })), query.get("u", "cup"), () => draw(), { label: "Unit" });
  const out = h("div", { class: "results grid" });
  function draw() {
    const gPerCup = INGREDIENTS[Number(ing.value)][1];
    const v = Number(amt.input.value);
    query.set({ i: ing.value === "0" ? "" : ing.value, v: amt.input.value === "1" ? "" : amt.input.value, u: unit.value === "cup" ? "" : unit.value });
    clear(out);
    if (!Number.isFinite(v)) return;
    const mlPerCup = 236.5882365;
    let cups;
    switch (unit.value) {
      case "cup": cups = v; break;
      case "tbsp": cups = v / 16; break;
      case "tsp": cups = v / 48; break;
      case "g": cups = v / gPerCup; break;
      case "oz": cups = (v * 28.349523125) / gPerCup; break;
      default: cups = v / mlPerCup;
    }
    const rows = [["Cups", cups], ["Tablespoons", cups * 16], ["Teaspoons", cups * 48], ["Grams", cups * gPerCup], ["Ounces (weight)", (cups * gPerCup) / 28.349523125], ["Milliliters", cups * mlPerCup]];
    for (const [label, val] of rows) out.append(h("div", { class: "unit-card" }, resultRow(label, formatNumber(val, 4), { copy: plain(val) })));
  }
  root.append(h("div", { class: "inputs three" }, h("label", { class: "field" }, h("span", { class: "field-label" }, "Ingredient"), ing), amt.el,
    h("label", { class: "field" }, h("span", { class: "field-label" }, "Unit"), unit)), out,
  h("p", { class: "note" }, "Weights are typical values per US cup (240 mL). Real ingredients vary with how they are packed."));
  draw();
}

// ------------------------------------------------------------------ number base
export function renderBase(tool, root) {
  const input = field({ label: "Number", type: "text", value: query.get("v", "255"), id: "value", autofocus: true, onInput: () => draw() });
  let from = Number(query.get("b", 10));
  const base = chips([{ value: 10, label: "Decimal" }, { value: 16, label: "Hex" }, { value: 2, label: "Binary" }, { value: 8, label: "Octal" }], from, (v) => { from = Number(v); draw(); }, { ariaLabel: "Input base" });
  const out = h("div", { class: "results grid" });
  function draw() {
    query.set({ v: input.input.value === "255" ? "" : input.input.value, b: from === 10 ? "" : from });
    clear(out);
    const r = convertBase(input.input.value, from);
    if (!r) { out.append(h("p", { class: "note" }, "Enter a valid number for the chosen base.")); return; }
    for (const [label, key, prefix] of [["Decimal", "dec", ""], ["Hexadecimal", "hex", "0x"], ["Binary", "bin", "0b"], ["Octal", "oct", "0o"]]) {
      out.append(h("div", { class: "unit-card" }, resultRow(label, prefix + r[key], { copy: r[key] })));
    }
  }
  root.append(h("div", { class: "inputs" }, input.el, h("div", { class: "field" }, h("span", { class: "field-label" }, "Input is"), base)), out);
  draw();
}

// ------------------------------------------------------------------ roman numerals
export function renderRoman(tool, root) {
  const num = field({ label: "Number (1-3999)", value: query.get("n", "2024"), autofocus: true, min: 1, onInput: () => fromNum() });
  const rom = field({ label: "Roman numeral", type: "text", value: "", onInput: () => fromRom() });
  const msg = h("p", { class: "note" });
  function fromNum() {
    const n = Number(num.input.value);
    const r = toRoman(n);
    rom.input.value = r || "";
    msg.textContent = r ? "" : "Enter a whole number from 1 to 3999.";
    query.set({ n: num.input.value === "2024" ? "" : num.input.value });
  }
  function fromRom() {
    const n = fromRoman(rom.input.value.trim());
    num.input.value = n ?? "";
    msg.textContent = n ? "" : rom.input.value ? "That is not a valid Roman numeral." : "";
  }
  root.append(h("div", { class: "inputs" }, num.el, rom.el), msg, h("button", { class: "btn", type: "button", onclick: () => copyText(rom.input.value) }, "Copy Roman numeral"));
  fromNum();
}

// ------------------------------------------------------------------ color
export function renderColor(tool, root) {
  const start = "#" + (query.get("c", "d97706").replace("#", ""));
  const hex = field({ label: "HEX", type: "text", value: start.toUpperCase(), id: "value", autofocus: true, onInput: () => fromHex() });
  const picker = h("input", { type: "color", value: start, "aria-label": "Pick a color", class: "picker", oninput: (e) => { hex.input.value = e.target.value.toUpperCase(); fromHex(); } });
  const swatch = h("div", { class: "swatch" });
  const out = h("div", { class: "results grid" });
  function show(rgb) {
    const hsl = rgbToHsl(rgb), hx = rgbToHex(rgb);
    swatch.style.background = hx;
    picker.value = hx.toLowerCase();
    query.set({ c: hx.slice(1).toLowerCase() === "d97706" ? "" : hx.slice(1).toLowerCase() });
    clear(out);
    for (const [label, text] of [["HEX", hx], ["RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`], ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`]]) {
      out.append(h("div", { class: "unit-card" }, resultRow(label, text, { copy: text })));
    }
  }
  function fromHex() {
    const rgb = hexToRgb(hex.input.value);
    if (rgb) show(rgb);
  }
  root.append(h("div", { class: "inputs" }, hex.el, h("div", { class: "field" }, h("span", { class: "field-label" }, "Pick"), picker)), swatch, out,
    h("p", { class: "note" }, "Tip: paste a code like #D97706 or D97706."));
  fromHex();
}

// ------------------------------------------------------------------ unix timestamp
export function renderUnix(tool, root) {
  const ts = field({ label: "Timestamp (seconds or milliseconds)", type: "text", value: query.get("t", String(Math.floor(Date.now() / 1000))), id: "value", autofocus: true, onInput: () => fromTs() });
  const dt = field({ label: "Or pick a date and time", type: "datetime-local", value: "", onInput: () => fromDate() });
  const out = h("div", { class: "results grid" });
  function fromTs() {
    clear(out);
    const raw = ts.input.value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(raw)) { out.append(h("p", { class: "note" }, "Enter a number such as 1700000000.")); return; }
    let n = Number(raw);
    const ms = Math.abs(n) > 1e11 ? n : n * 1000; // heuristic: >1e11 means milliseconds
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return;
    query.set({ t: raw });
    const pad = (x) => String(x).padStart(2, "0");
    dt.input.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    for (const [label, text] of [["UTC", d.toUTCString()], ["Your local time", d.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" })], ["ISO 8601", d.toISOString()],
      ["Seconds", String(Math.floor(ms / 1000))], ["Milliseconds", String(ms)]]) out.append(h("div", { class: "unit-card" }, resultRow(label, text, { copy: text })));
  }
  function fromDate() {
    if (!dt.input.value) return;
    ts.input.value = String(Math.floor(new Date(dt.input.value).getTime() / 1000));
    fromTs();
  }
  root.append(h("div", { class: "inputs" }, ts.el, dt.el), h("button", { class: "btn", type: "button", onclick: () => { ts.input.value = String(Math.floor(Date.now() / 1000)); fromTs(); } }, "Use current time"), out);
  fromTs();
}
