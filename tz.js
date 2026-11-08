// Time zone helpers and the meeting planner. Pure functions on top of Intl, unit-tested in test/tz.test.mjs.
import { CITIES, ABBREVIATIONS } from "./cities.js";

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

let allZones = null;
function everyZone() {
  if (!allZones) {
    try { allZones = Intl.supportedValuesOf("timeZone"); } catch { allZones = []; }
  }
  return allZones;
}

export const isValidZone = (tz) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };
export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/** Friendly name for a zone id: the city from our list, else the last path segment. */
export function zoneLabel(tz) {
  const c = CITIES.find((x) => x.tz === tz);
  if (c && tz !== "UTC") return c.name;
  if (tz === "UTC") return "UTC";
  return tz.split("/").pop().replace(/_/g, " ");
}

/** Look up a city or zone from what a person typed. Returns { name, tz } or null. */
export function findPlace(query) {
  const q = norm(query);
  if (!q) return null;
  if (ABBREVIATIONS[q]) return { name: q.toUpperCase(), tz: ABBREVIATIONS[q] };
  const exact = CITIES.find((c) => norm(c.name) === q || c.aliases.some((a) => norm(a) === q));
  if (exact) return { name: exact.name, tz: exact.tz };
  const byCountry = CITIES.find((c) => norm(c.country) === q);
  if (byCountry) return { name: byCountry.name, tz: byCountry.tz };
  const starts = CITIES.find((c) => norm(c.name).startsWith(q));
  if (starts && q.length >= 3) return { name: starts.name, tz: starts.tz };
  const zone = everyZone().find((z) => norm(z.split("/").pop()) === q);
  if (zone) return { name: zoneLabel(zone), tz: zone };
  return null;
}

/** Search suggestions for the "add a city" box. */
export function searchPlaces(query, limit = 8) {
  const q = norm(query);
  if (!q) return [];
  const out = [];
  const seen = new Set();
  const push = (name, tz, country = "") => { const k = name + tz; if (!seen.has(k)) { seen.add(k); out.push({ name, tz, country }); } };
  for (const c of CITIES) if (norm(c.name).startsWith(q) || c.aliases.some((a) => norm(a).startsWith(q))) push(c.name, c.tz, c.country);
  for (const c of CITIES) if (norm(c.name).includes(q) || norm(c.country).startsWith(q)) push(c.name, c.tz, c.country);
  for (const z of everyZone()) if (norm(z.split("/").pop()).includes(q)) push(zoneLabel(z), z, z.split("/")[0]);
  return out.slice(0, limit);
}

// ------------------------------------------------------------------ offsets and conversion
const dtfCache = new Map();
function dtf(tz) {
  if (!dtfCache.has(tz)) {
    dtfCache.set(tz, new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
    }));
  }
  return dtfCache.get(tz);
}

/** Wall-clock parts of an instant in a zone. */
export function partsIn(ms, tz) {
  const o = {};
  for (const p of dtf(tz).formatToParts(new Date(ms))) if (p.type !== "literal") o[p.type] = Number(p.value);
  return { y: o.year, mo: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}

/** UTC offset in minutes for a zone at an instant. */
export function offsetMinutes(tz, ms) {
  const p = partsIn(Math.floor(ms / 1000) * 1000, tz);
  return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000) / 60000);
}

/** The instant (ms) at which the wall clock in `tz` shows the given date and time. */
export function zonedToInstant({ y, mo, d, h = 0, mi = 0 }, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - offsetMinutes(tz, guess) * 60000;
  const off2 = offsetMinutes(tz, t);
  t = guess - off2 * 60000;
  return t;
}

export function formatTime(ms, tz, hour12 = true) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12 }).format(new Date(ms));
}
export function formatDay(ms, tz) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" }).format(new Date(ms));
}
export function zoneAbbr(ms, tz) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName");
  if (!part) return "";
  const m = /^GMT([+-].+)$/.exec(part.value);
  return m ? (m[1] === "+0" ? "GMT" : `UTC${m[1]}`) : part.value;
}
export function offsetLabel(tz, ms) {
  const m = offsetMinutes(tz, ms);
  const sign = m < 0 ? "-" : "+";
  const a = Math.abs(m);
  return `UTC${sign}${Math.floor(a / 60)}${a % 60 ? ":" + String(a % 60).padStart(2, "0") : ""}`;
}

/** Parse "3pm", "3:30 pm", "15:30", "noon", "midnight". Returns { h, mi } or null ("now" returns { now: true }). */
export function parseClock(text) {
  const t = text.trim().toLowerCase();
  if (t === "now") return { now: true };
  if (t === "noon") return { h: 12, mi: 0 };
  if (t === "midnight") return { h: 0, mi: 0 };
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const mi = m[2] ? Number(m[2]) : 0;
  const ap = m[3] && m[3][0];
  if (mi > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    if (ap === "p" && h !== 12) h += 12;
    if (ap === "a" && h === 12) h = 0;
  } else if (h > 23) return null;
  return { h, mi };
}

/** Convert a wall-clock time in one zone to another, on a given date (default: today in the source zone). */
export function convertClock({ h, mi }, fromTz, toTz, dateParts = null, nowMs = Date.now()) {
  const base = dateParts || (({ y, mo, d }) => ({ y, mo, d }))(partsIn(nowMs, fromTz));
  const instant = zonedToInstant({ ...base, h, mi }, fromTz);
  return { instant, from: { time: formatTime(instant, fromTz), day: formatDay(instant, fromTz) }, to: { time: formatTime(instant, toTz), day: formatDay(instant, toTz) } };
}

// ------------------------------------------------------------------ meeting planner
/** How uncomfortable a local time is for a meeting: 0 = working hours, 6 = middle of the night. */
export function penalty(hourFloat, start = 9, end = 18) {
  if (hourFloat >= start && hourFloat < end) return 0;
  if ((hourFloat >= start - 1 && hourFloat < start) || (hourFloat >= end && hourFloat < 20)) return 1;
  if ((hourFloat >= 7 && hourFloat < start - 1) || (hourFloat >= 20 && hourFloat < 22)) return 3;
  return 6;
}

/**
 * Plan a meeting across zones. `date` is { y, mo, d } in the first zone's calendar.
 * Slots are 30 minutes starting at midnight of that date in zones[0].
 */
export function planMeeting(zones, date, { start = 9, end = 18, step = 30 } = {}) {
  const day0 = zonedToInstant({ ...date, h: 0, mi: 0 }, zones[0]);
  const slots = [];
  for (let i = 0; i < (24 * 60) / step; i++) {
    const ms = day0 + i * step * 60000;
    const locals = zones.map((tz) => {
      const p = partsIn(ms, tz);
      const hf = p.h + p.mi / 60;
      const dayDiff = Math.round((Date.UTC(p.y, p.mo - 1, p.d) - Date.UTC(date.y, date.mo - 1, date.d)) / 86400000);
      return { tz, h: p.h, mi: p.mi, hourFloat: hf, dayDiff, penalty: penalty(hf, start, end) };
    });
    const score = locals.reduce((s, l) => s + l.penalty, 0);
    const worst = Math.max(...locals.map((l) => l.penalty));
    slots.push({ ms, locals, score, worst, allWorking: worst === 0 });
  }
  // merge consecutive all-working slots into windows
  const windows = [];
  let cur = null;
  for (const s of slots) {
    if (s.allWorking) {
      if (!cur) cur = { startMs: s.ms, endMs: s.ms + step * 60000 };
      else cur.endMs = s.ms + step * 60000;
    } else if (cur) { windows.push(cur); cur = null; }
  }
  if (cur) windows.push(cur);
  const ranked = [...slots].sort((a, b) => a.score - b.score || a.worst - b.worst || a.ms - b.ms);
  return { slots, windows, best: ranked.slice(0, 3), hasOverlap: windows.length > 0 };
}
