import test from "node:test";
import assert from "node:assert/strict";
import { findPlace, searchPlaces, offsetMinutes, zonedToInstant, parseClock, convertClock, planMeeting, penalty, partsIn, zoneLabel, offsetLabel } from "../tz.js";

test("places and abbreviations", () => {
  assert.equal(findPlace("NYC").tz, "America/New_York");
  assert.equal(findPlace("Bengaluru").tz, "Asia/Kolkata");
  assert.equal(findPlace("são paulo").tz, "America/Sao_Paulo");
  assert.equal(findPlace("pst").tz, "America/Los_Angeles");
  assert.equal(findPlace("zzzzzz"), null);
  assert.ok(searchPlaces("lon").some((p) => p.name === "London"));
  assert.equal(zoneLabel("Asia/Kolkata"), "Mumbai");
});
test("offsets follow daylight saving time", () => {
  assert.equal(offsetMinutes("America/New_York", Date.UTC(2026, 0, 15)), -300);
  assert.equal(offsetMinutes("America/New_York", Date.UTC(2026, 6, 15)), -240);
  assert.equal(offsetMinutes("Asia/Kolkata", Date.UTC(2026, 6, 15)), 330);
  assert.equal(offsetLabel("Asia/Kolkata", Date.UTC(2026, 6, 15)), "UTC+5:30");
});
test("wall clock to instant and back", () => {
  const t = zonedToInstant({ y: 2026, mo: 11, d: 10, h: 15, mi: 0 }, "America/New_York");
  assert.equal(t, Date.UTC(2026, 10, 10, 20, 0)); // EST is UTC-5 in November
  const p = partsIn(t, "Asia/Tokyo");
  assert.deepEqual([p.d, p.h, p.mi], [11, 5, 0]);
  const summer = zonedToInstant({ y: 2026, mo: 7, d: 10, h: 15, mi: 0 }, "America/New_York");
  assert.equal(summer, Date.UTC(2026, 6, 10, 19, 0));
});
test("parseClock", () => {
  assert.deepEqual(parseClock("3pm"), { h: 15, mi: 0 });
  assert.deepEqual(parseClock("12 am"), { h: 0, mi: 0 });
  assert.deepEqual(parseClock("9:30 AM"), { h: 9, mi: 30 });
  assert.deepEqual(parseClock("15:45"), { h: 15, mi: 45 });
  assert.deepEqual(parseClock("noon"), { h: 12, mi: 0 });
  assert.equal(parseClock("25:00"), null);
  assert.equal(parseClock("13pm"), null);
});
test("convertClock crosses the date line", () => {
  const r = convertClock({ h: 15, mi: 0 }, "America/New_York", "Asia/Tokyo", { y: 2026, mo: 11, d: 10 });
  assert.equal(r.to.time, "5:00 AM");
  assert.match(r.to.day, /Nov 11/);
  assert.equal(r.from.time, "3:00 PM");
});
test("penalty ranks hours", () => {
  assert.equal(penalty(10), 0);
  assert.equal(penalty(8.5), 1);
  assert.equal(penalty(21), 3);
  assert.equal(penalty(2), 6);
});
test("meeting planner finds overlap for New York and London", () => {
  const plan = planMeeting(["America/New_York", "Europe/London"], { y: 2026, mo: 11, d: 10 });
  assert.ok(plan.hasOverlap);
  const w = plan.windows[0];
  // 9am-1pm in New York is 2pm-6pm in London (EST is 5 hours behind GMT in November)
  assert.equal(partsIn(w.startMs, "America/New_York").h, 9);
  assert.equal(partsIn(w.endMs, "Europe/London").h, 18);
  assert.equal(plan.best[0].worst, 0);
});
test("meeting planner reports no overlap for New York and Tokyo, and still ranks the least bad", () => {
  const plan = planMeeting(["America/New_York", "Asia/Tokyo"], { y: 2026, mo: 11, d: 10 });
  assert.equal(plan.hasOverlap, false);
  assert.ok(plan.best[0].score < 12);
});
test("three zones: New York, London, Mumbai overlap is empty or in working hours", () => {
  const plan = planMeeting(["America/New_York", "Europe/London", "Asia/Kolkata"], { y: 2026, mo: 11, d: 10 });
  for (const w of plan.windows) {
    for (const tz of ["America/New_York", "Europe/London", "Asia/Kolkata"]) {
      const h = partsIn(w.startMs, tz).h;
      assert.ok(h >= 9 && h < 18, `${tz} ${h}`);
    }
  }
});
