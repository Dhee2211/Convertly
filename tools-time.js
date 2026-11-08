// Time zone tools: the meeting time finder and the time zone converter.
import { h, clear, field, select, resultRow, copyText, query, store, toast } from "./ui.js";
import { localZone, searchPlaces, findPlace, zoneLabel, planMeeting, partsIn, formatTime, formatDay, zoneAbbr, offsetLabel, parseClock, convertClock, zonedToInstant } from "./tz.js";
import { isoDate, parseISODate } from "./calc.js";

/** A text box that suggests cities as you type. Calls onPick({ name, tz }). */
function placePicker(onPick, placeholder = "Add a city…") {
  const input = h("input", { type: "text", placeholder, "aria-label": placeholder, autocomplete: "off", class: "picker-input" });
  const list = h("ul", { class: "suggest", role: "listbox", hidden: true });
  let items = [], active = -1;
  const close = () => { list.hidden = true; active = -1; };
  const pick = (p) => { onPick(p); input.value = ""; close(); input.focus(); };
  const draw = () => {
    items = searchPlaces(input.value, 7);
    clear(list);
    items.forEach((p, i) => list.append(h("li", { role: "option", class: i === active ? "on" : "", onmousedown: (e) => { e.preventDefault(); pick(p); } }, h("strong", {}, p.name), h("span", {}, p.country))));
    list.hidden = !items.length;
  };
  input.addEventListener("input", () => { active = -1; draw(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(items.length - 1, active + 1); draw(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); draw(); }
    else if (e.key === "Enter") { e.preventDefault(); const p = items[Math.max(0, active)] || findPlace(input.value); if (p) pick(p); }
    else if (e.key === "Escape") close();
  });
  input.addEventListener("blur", () => setTimeout(close, 100));
  return h("div", { class: "picker" }, input, list);
}

/** Zones travel as "tz" or "tz~Display Name" so "Bangalore" stays "Bangalore" even though it shares Asia/Kolkata. */
export const zParse = (str) => { const [tz, name] = str.split("~"); return { tz, name: name || zoneLabel(tz) }; };
export const zStr = (z) => (z.name && z.name !== zoneLabel(z.tz) ? `${z.tz}~${z.name}` : z.tz);

const todayIn = (tz) => { const p = partsIn(Date.now(), tz); return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; };
const gcalStamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// ------------------------------------------------------------------ meeting time finder
export function renderMeeting(tool, root) {
  const here = localZone();
  let zones = (query.get("z") ? query.get("z").split(",") : store.get("zones") || []).filter(Boolean).map(zParse);
  if (!zones.length) zones = [here, here === "America/New_York" ? "Europe/London" : "America/New_York"].map(zParse);
  let date = query.get("d") || todayIn(zones[0].tz);
  let hours = query.get("h", "9-18");
  let chosen = null; // ms of the selected slot start

  const dateField = field({ label: "Date", type: "date", value: date, onInput: (e) => { date = e.target.value || date; chosen = null; draw(); } });
  const hoursSel = select([{ value: "9-18", label: "9 am – 6 pm" }, { value: "8-17", label: "8 am – 5 pm" }, { value: "10-16", label: "10 am – 4 pm" }, { value: "7-21", label: "7 am – 9 pm" }], hours, (v) => { hours = v; chosen = null; draw(); }, { label: "Working hours" });
  const chipsBox = h("div", { class: "zone-chips" });
  const bestBox = h("div", {});
  const grid = h("div", { class: "timeline", role: "table", "aria-label": "Hourly overlap" });
  const detail = h("div", {});
  const picker = placePicker((p) => { if (!zones.some((z) => z.tz === p.tz && z.name === p.name)) { zones.push({ tz: p.tz, name: p.name }); chosen = null; draw(); } else toast(`${p.name} is already added`); });

  function draw() {
    store.set("zones", zones.map(zStr));
    query.set({ z: zones.map(zStr).join(","), d: date === todayIn(zones[0].tz) ? "" : date, h: hours === "9-18" ? "" : hours });
    const [start, end] = hours.split("-").map(Number);
    const d = parseISODate(date);
    const dateParts = d ? { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate() } : partsIn(Date.now(), zones[0].tz);
    const tzs = zones.map((z) => z.tz);

    clear(chipsBox);
    zones.forEach((z, i) => chipsBox.append(h("span", { class: "zone-chip" }, z.name, i === 0 ? h("em", {}, " (you)") : null,
      zones.length > 2 || i > 1 ? h("button", { type: "button", "aria-label": `Remove ${z.name}`, onclick: () => { zones.splice(i, 1); chosen = null; draw(); } }, "×") : null)));

    if (zones.length < 2) { clear(bestBox); clear(grid); clear(detail); bestBox.append(h("p", { class: "note" }, "Add at least one more city.")); return; }
    const plan = planMeeting(tzs, dateParts, { start, end });

    clear(bestBox);
    const picks = plan.hasOverlap
      ? plan.windows.slice(0, 3).map((w) => ({ ms: w.startMs, endMs: w.endMs, label: "Everyone is in working hours" }))
      : plan.best.map((s) => ({ ms: s.ms, endMs: s.ms + 1800000, label: "Nobody is perfectly placed, these are the least bad times" }));
    bestBox.append(h("h2", {}, plan.hasOverlap ? "Best times" : "No full overlap"), h("p", { class: "note" }, picks[0].label + "."));
    const cards = h("div", { class: "best" });
    picks.forEach((p) => cards.append(h("button", { type: "button", class: "best-card" + (chosen === p.ms ? " on" : ""), onclick: () => { chosen = p.ms; draw(); } },
      zones.map((z) => h("span", { class: "best-line" }, h("b", {}, z.name), `${formatTime(p.ms, z.tz)} – ${formatTime(p.endMs, z.tz)}`, h("small", {}, formatDay(p.ms, z.tz)))))));
    bestBox.append(cards);

    clear(grid);
    grid.style.setProperty("--cols", plan.slots.length);
    zones.forEach((z, zi) => {
      const row = h("div", { class: "tl-row" }, h("div", { class: "tl-name" }, h("b", {}, z.name), h("small", {}, `${zoneAbbr(plan.slots[0].ms, z.tz)} · ${offsetLabel(z.tz, plan.slots[0].ms)}`)));
      const cells = h("div", { class: "tl-cells" });
      plan.slots.forEach((s) => {
        const local = s.locals[zi];
        const cls = ["tl-cell", `p${local.penalty === 0 ? 0 : local.penalty === 1 ? 1 : local.penalty === 3 ? 2 : 3}`];
        if (chosen === s.ms) cls.push("sel");
        const cell = h("button", { type: "button", class: cls.join(" "), title: `${z.name}: ${formatTime(s.ms, z.tz)} ${formatDay(s.ms, z.tz)}`, "aria-label": `${z.name} ${formatTime(s.ms, z.tz)}`, onclick: () => { chosen = s.ms; draw(); } });
        if (local.mi === 0 && local.h % 3 === 0) cell.append(h("i", {}, local.h === 0 ? "12a" : local.h < 12 ? `${local.h}a` : local.h === 12 ? "12p" : `${local.h - 12}p`));
        cells.append(cell);
      });
      row.append(cells);
      grid.append(row);
    });

    clear(detail);
    if (chosen != null) {
      const endMs = chosen + 3600000;
      const lines = zones.map((z) => `${z.name}: ${formatDay(chosen, z.tz)}, ${formatTime(chosen, z.tz)} – ${formatTime(endMs, z.tz)} ${zoneAbbr(chosen, z.tz)}`);
      const text = `Proposed meeting time (1 hour)\n${lines.join("\n")}`;
      const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Meeting")}&dates=${gcalStamp(chosen)}/${gcalStamp(endMs)}&details=${encodeURIComponent(lines.join("\n"))}`;
      detail.append(h("section", { class: "card" }, h("h2", {}, "Selected time"), ...lines.map((l) => h("p", { class: "line" }, l)),
        h("div", { class: "row" }, h("button", { class: "btn primary", type: "button", onclick: () => copyText(text, "Invite copied") }, "Copy invite text"), h("a", { class: "btn", href: gcal, target: "_blank", rel: "noopener" }, "Add to Google Calendar"))));
    } else {
      detail.append(h("p", { class: "note" }, "Tap a time in the grid or a best-time card to build an invite."));
    }
  }

  root.append(h("div", { class: "inputs" }, dateField.el, h("label", { class: "field" }, h("span", { class: "field-label" }, "Working hours"), hoursSel)),
    h("div", { class: "row wrap" }, chipsBox, picker), bestBox,
    h("div", { class: "legend" }, h("span", { class: "k p0" }, "Working hours"), h("span", { class: "k p1" }, "Early / late"), h("span", { class: "k p2" }, "Inconvenient"), h("span", { class: "k p3" }, "Night")),
    h("div", { class: "scroll" }, grid), detail);
  draw();
}

// ------------------------------------------------------------------ time zone converter
export function renderTimezone(tool, root) {
  const here = localZone();
  let from = query.get("from") ? zParse(query.get("from")) : { tz: here, name: zoneLabel(here) };
  let targets = (query.get("to") ? query.get("to").split(",") : store.get("tzTargets") || ["America/New_York", "Europe/London", "Asia/Tokyo"]).filter(Boolean).map(zParse).filter((z) => z.tz !== from.tz || z.name !== from.name);
  const time = field({ label: "Time (try 3pm, 15:30, noon, now)", type: "text", value: query.get("t", "now"), id: "value", autofocus: true, onInput: () => draw() });
  const fromBox = h("div", { class: "from-box" });
  const toBox = h("div", { class: "zone-chips" });
  const out = h("div", { class: "results" });
  const fromPicker = placePicker((p) => { from = { tz: p.tz, name: p.name }; draw(); }, "Change source city…");
  const toPicker = placePicker((p) => { if (!targets.some((z) => z.tz === p.tz && z.name === p.name)) { targets.push({ tz: p.tz, name: p.name }); draw(); } }, "Add a city…");

  function draw() {
    store.set("tzTargets", targets.map(zStr));
    query.set({ t: time.input.value === "now" ? "" : time.input.value, from: from.tz === here && from.name === zoneLabel(here) ? "" : zStr(from), to: targets.map(zStr).join(",") });
    clear(fromBox); fromBox.append(h("span", { class: "field-label" }, "From"), h("span", { class: "zone-chip" }, from.name), fromPicker);
    clear(toBox);
    targets.forEach((z, i) => toBox.append(h("span", { class: "zone-chip" }, z.name, h("button", { type: "button", "aria-label": `Remove ${z.name}`, onclick: () => { targets.splice(i, 1); draw(); } }, "×"))));
    clear(out);
    const clock = parseClock(time.input.value || "now");
    if (!clock) { out.append(h("p", { class: "note" }, "Enter a time like 3pm, 15:30, noon or now.")); return; }
    const now = Date.now();
    let instant = now;
    if (!clock.now) { const p = partsIn(now, from.tz); instant = zonedToInstant({ y: p.y, mo: p.mo, d: p.d, h: clock.h, mi: clock.mi }, from.tz); }
    out.append(resultRow(`${from.name} · ${zoneAbbr(instant, from.tz)}`, formatTime(instant, from.tz), { big: true, copy: formatTime(instant, from.tz), sub: formatDay(instant, from.tz) }));
    for (const z of targets) out.append(resultRow(`${z.name} · ${zoneAbbr(instant, z.tz)}`, formatTime(instant, z.tz), { copy: formatTime(instant, z.tz), sub: `${formatDay(instant, z.tz)} · ${offsetLabel(z.tz, instant)}` }));
  }
  root.append(h("div", { class: "inputs" }, time.el, fromBox), h("div", { class: "row wrap" }, h("span", { class: "field-label" }, "To"), toBox, toPicker), out);
  draw();
}
