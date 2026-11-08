// Live exchange rates. Tries open.er-api.com (160+ currencies), then Frankfurter (ECB, ~30). Cached for 6 hours.
import { setCurrencyRates } from "./units.js";
import { store } from "./ui.js";

const TTL = 6 * 3600 * 1000;
const SOURCES = [
  {
    name: "Exchange Rate API", url: "https://www.exchangerate-api.com", fetch: async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (j.result !== "success") throw new Error("bad response");
      return { rates: j.rates, date: (j.time_last_update_utc || "").slice(0, 16) };
    },
  },
  {
    name: "Frankfurter (ECB)", url: "https://frankfurter.dev", fetch: async () => {
      const r = await fetch("https://api.frankfurter.dev/v1/latest?base=USD");
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      return { rates: { USD: 1, ...j.rates }, date: j.date };
    },
  },
];

let loading = null;

/** Load rates (cached). Resolves with { rates, date, source, stale }. Rejects if nothing is available. */
export function loadRates() {
  loading ??= (async () => {
    const cached = store.get("rates");
    if (cached && Date.now() - cached.at < TTL) { setCurrencyRates(cached.rates, cached); return { ...cached, stale: false }; }
    for (const s of SOURCES) {
      try {
        const { rates, date } = await s.fetch();
        const entry = { rates, date, source: s.name, url: s.url, at: Date.now() };
        store.set("rates", entry);
        setCurrencyRates(rates, entry);
        return { ...entry, stale: false };
      } catch { /* try next source */ }
    }
    if (cached) { setCurrencyRates(cached.rates, cached); return { ...cached, stale: true }; }
    throw new Error("Could not load exchange rates. Check your connection.");
  })();
  loading.catch(() => { loading = null; });
  return loading;
}
