// Unit data and conversion engine. Pure functions (no DOM), unit-tested in test/units.test.mjs.
// Every unit converts to and from its category's base unit: base = toBase(value).

const lin = (f) => ({ toBase: (v) => v * f, fromBase: (b) => b / f });

/** Build a unit. `f` is the factor to the base unit; pass toBase/fromBase for non-linear units. */
function U(id, name, sym, f, aliases = [], extra = null) {
  const fns = extra || lin(f);
  return { id, name, sym, aliases, ...fns };
}

export const CATEGORIES = [
  {
    id: "length", name: "Length", badge: "m", base: "m", units: [
      U("m", "Meters", "m", 1, ["meter", "meters", "metre", "metres", "m"]),
      U("km", "Kilometers", "km", 1000, ["kilometer", "kilometers", "kilometre", "kilometres", "km", "kms"]),
      U("cm", "Centimeters", "cm", 0.01, ["centimeter", "centimeters", "centimetre", "centimetres", "cm"]),
      U("mm", "Millimeters", "mm", 0.001, ["millimeter", "millimeters", "millimetre", "millimetres", "mm"]),
      U("um", "Micrometers", "µm", 1e-6, ["micrometer", "micrometers", "micron", "microns", "um", "µm"]),
      U("nm", "Nanometers", "nm", 1e-9, ["nanometer", "nanometers", "nm"]),
      U("mi", "Miles", "mi", 1609.344, ["mile", "miles", "mi"]),
      U("yd", "Yards", "yd", 0.9144, ["yard", "yards", "yd", "yds"]),
      U("ft", "Feet", "ft", 0.3048, ["foot", "feet", "ft", "'"]),
      U("in", "Inches", "in", 0.0254, ["inch", "inches", "in", '"']),
      U("nmi", "Nautical miles", "nmi", 1852, ["nautical mile", "nautical miles", "nmi"]),
      U("ly", "Light-years", "ly", 9.4607304725808e15, ["light year", "light years", "lightyear", "lightyears", "ly"]),
    ],
  },
  {
    id: "mass", name: "Weight", badge: "kg", base: "kg", units: [
      U("kg", "Kilograms", "kg", 1, ["kilogram", "kilograms", "kilo", "kilos", "kg", "kgs"]),
      U("g", "Grams", "g", 0.001, ["gram", "grams", "gm", "g"]),
      U("mg", "Milligrams", "mg", 1e-6, ["milligram", "milligrams", "mg"]),
      U("ug", "Micrograms", "µg", 1e-9, ["microgram", "micrograms", "ug", "µg", "mcg"]),
      U("t", "Metric tonnes", "t", 1000, ["tonne", "tonnes", "metric ton", "metric tons", "t"]),
      U("lb", "Pounds", "lb", 0.45359237, ["pound", "pounds", "lb", "lbs"]),
      U("oz", "Ounces", "oz", 0.028349523125, ["ounce", "ounces", "oz"]),
      U("st", "Stone", "st", 6.35029318, ["stone", "stones", "st"]),
      U("ton", "US tons", "ton", 907.18474, ["ton", "tons", "us ton", "us tons", "short ton", "short tons"]),
      U("lton", "UK tons", "long ton", 1016.0469088, ["uk ton", "uk tons", "long ton", "long tons"]),
      U("ct", "Carats", "ct", 0.0002, ["carat", "carats", "ct"]),
    ],
  },
  {
    id: "temperature", name: "Temperature", badge: "°", base: "K", units: [
      U("c", "Celsius", "°C", 1, ["celsius", "centigrade", "c", "°c", "degc", "deg c", "degrees celsius", "degree celsius"], { toBase: (v) => v + 273.15, fromBase: (b) => b - 273.15 }),
      U("f", "Fahrenheit", "°F", 1, ["fahrenheit", "f", "°f", "degf", "deg f", "degrees fahrenheit", "degree fahrenheit"], { toBase: (v) => (v - 32) * 5 / 9 + 273.15, fromBase: (b) => (b - 273.15) * 9 / 5 + 32 }),
      U("k", "Kelvin", "K", 1, ["kelvin", "k"], { toBase: (v) => v, fromBase: (b) => b }),
      U("r", "Rankine", "°R", 1, ["rankine", "°r", "degr"], { toBase: (v) => v * 5 / 9, fromBase: (b) => b * 9 / 5 }),
    ],
  },
  {
    id: "volume", name: "Volume", badge: "L", base: "l", units: [
      U("l", "Liters", "L", 1, ["liter", "liters", "litre", "litres", "l", "ltr"]),
      U("ml", "Milliliters", "mL", 0.001, ["milliliter", "milliliters", "millilitre", "millilitres", "ml"]),
      U("m3", "Cubic meters", "m³", 1000, ["cubic meter", "cubic meters", "cubic metre", "m3", "m³"]),
      U("cm3", "Cubic centimeters", "cm³", 0.001, ["cubic centimeter", "cubic centimeters", "cc", "cm3", "cm³"]),
      U("galus", "US gallons", "gal", 3.785411784, ["gallon", "gallons", "gal", "us gallon", "us gallons", "galus"]),
      U("qtus", "US quarts", "qt", 0.946352946, ["quart", "quarts", "qt", "us quart", "us quarts"]),
      U("ptus", "US pints", "pt", 0.473176473, ["pint", "pints", "pt", "us pint", "us pints"]),
      U("cup", "US cups", "cup", 0.2365882365, ["cup", "cups"]),
      U("floz", "US fluid ounces", "fl oz", 0.0295735295625, ["fluid ounce", "fluid ounces", "fl oz", "floz", "fl. oz"]),
      U("tbsp", "Tablespoons", "tbsp", 0.01478676478125, ["tablespoon", "tablespoons", "tbsp", "tbs"]),
      U("tsp", "Teaspoons", "tsp", 0.00492892159375, ["teaspoon", "teaspoons", "tsp"]),
      U("galuk", "UK gallons", "imp gal", 4.54609, ["uk gallon", "uk gallons", "imperial gallon", "imperial gallons", "imp gal", "galuk"]),
      U("ptuk", "UK pints", "imp pt", 0.56826125, ["uk pint", "uk pints", "imperial pint", "imperial pints", "imp pt"]),
      U("ft3", "Cubic feet", "ft³", 28.316846592, ["cubic foot", "cubic feet", "ft3", "ft³"]),
      U("in3", "Cubic inches", "in³", 0.016387064, ["cubic inch", "cubic inches", "in3", "in³"]),
    ],
  },
  {
    id: "area", name: "Area", badge: "m²", base: "m2", units: [
      U("m2", "Square meters", "m²", 1, ["square meter", "square meters", "square metre", "square metres", "sq m", "sqm", "m2", "m²"]),
      U("km2", "Square kilometers", "km²", 1e6, ["square kilometer", "square kilometers", "sq km", "km2", "km²"]),
      U("cm2", "Square centimeters", "cm²", 1e-4, ["square centimeter", "square centimeters", "sq cm", "cm2", "cm²"]),
      U("ha", "Hectares", "ha", 10000, ["hectare", "hectares", "ha"]),
      U("acre", "Acres", "ac", 4046.8564224, ["acre", "acres", "ac"]),
      U("ft2", "Square feet", "ft²", 0.09290304, ["square foot", "square feet", "sq ft", "sqft", "ft2", "ft²"]),
      U("in2", "Square inches", "in²", 0.00064516, ["square inch", "square inches", "sq in", "in2", "in²"]),
      U("yd2", "Square yards", "yd²", 0.83612736, ["square yard", "square yards", "sq yd", "yd2", "yd²"]),
      U("mi2", "Square miles", "mi²", 2589988.110336, ["square mile", "square miles", "sq mi", "mi2", "mi²"]),
    ],
  },
  {
    id: "speed", name: "Speed", badge: "km/h", base: "ms", units: [
      U("ms", "Meters per second", "m/s", 1, ["meters per second", "metres per second", "m/s", "mps"]),
      U("kmh", "Kilometers per hour", "km/h", 1 / 3.6, ["kilometers per hour", "kilometres per hour", "km/h", "kmh", "kph", "kmph"]),
      U("mph", "Miles per hour", "mph", 0.44704, ["miles per hour", "mph"]),
      U("kn", "Knots", "kn", 0.514444444, ["knot", "knots", "kn", "kt", "kts"]),
      U("fts", "Feet per second", "ft/s", 0.3048, ["feet per second", "ft/s", "fps"]),
      U("mach", "Mach", "Ma", 340.29, ["mach"]),
    ],
  },
  {
    id: "time", name: "Time", badge: "h", base: "s", units: [
      U("s", "Seconds", "s", 1, ["second", "seconds", "sec", "secs", "s"]),
      U("ms_", "Milliseconds", "ms", 0.001, ["millisecond", "milliseconds", "msec", "msecs"]),
      U("us", "Microseconds", "µs", 1e-6, ["microsecond", "microseconds", "µs", "usec"]),
      U("min", "Minutes", "min", 60, ["minute", "minutes", "min", "mins"]),
      U("h", "Hours", "h", 3600, ["hour", "hours", "hr", "hrs", "h"]),
      U("d", "Days", "d", 86400, ["day", "days", "d"]),
      U("wk", "Weeks", "wk", 604800, ["week", "weeks", "wk", "wks"]),
      U("mo", "Months", "mo", 2629800, ["month", "months", "mo", "mos"]),
      U("yr", "Years", "yr", 31557600, ["year", "years", "yr", "yrs", "y"]),
      U("dec", "Decades", "dec", 315576000, ["decade", "decades"]),
      U("cent", "Centuries", "cent", 3155760000, ["century", "centuries"]),
    ],
  },
  {
    id: "data", name: "Data storage", badge: "GB", base: "B", units: [
      U("bit", "Bits", "bit", 0.125, ["bit", "bits"]),
      U("B", "Bytes", "B", 1, ["byte", "bytes", "b"]),
      U("KB", "Kilobytes", "KB", 1e3, ["kilobyte", "kilobytes", "kb"]),
      U("MB", "Megabytes", "MB", 1e6, ["megabyte", "megabytes", "mb"]),
      U("GB", "Gigabytes", "GB", 1e9, ["gigabyte", "gigabytes", "gb", "gig", "gigs"]),
      U("TB", "Terabytes", "TB", 1e12, ["terabyte", "terabytes", "tb"]),
      U("PB", "Petabytes", "PB", 1e15, ["petabyte", "petabytes", "pb"]),
      U("KiB", "Kibibytes", "KiB", 1024, ["kibibyte", "kibibytes", "kib"]),
      U("MiB", "Mebibytes", "MiB", 1048576, ["mebibyte", "mebibytes", "mib"]),
      U("GiB", "Gibibytes", "GiB", 1073741824, ["gibibyte", "gibibytes", "gib"]),
      U("TiB", "Tebibytes", "TiB", 1099511627776, ["tebibyte", "tebibytes", "tib"]),
    ],
  },
  {
    id: "energy", name: "Energy", badge: "kWh", base: "J", units: [
      U("J", "Joules", "J", 1, ["joule", "joules", "j"]),
      U("kJ", "Kilojoules", "kJ", 1000, ["kilojoule", "kilojoules", "kj"]),
      U("cal", "Calories", "cal", 4.184, ["calorie", "calories", "cal"]),
      U("kcal", "Kilocalories (food Calories)", "kcal", 4184, ["kilocalorie", "kilocalories", "kcal", "food calorie", "food calories"]),
      U("Wh", "Watt-hours", "Wh", 3600, ["watt hour", "watt hours", "wh"]),
      U("kWh", "Kilowatt-hours", "kWh", 3.6e6, ["kilowatt hour", "kilowatt hours", "kwh"]),
      U("BTU", "BTU", "BTU", 1055.05585262, ["btu", "btus"]),
      U("ftlb", "Foot-pounds", "ft·lbf", 1.3558179483314, ["foot pound", "foot pounds", "ft lb", "ftlb"]),
      U("eV", "Electronvolts", "eV", 1.602176634e-19, ["electronvolt", "electronvolts", "ev"]),
    ],
  },
  {
    id: "power", name: "Power", badge: "W", base: "W", units: [
      U("W", "Watts", "W", 1, ["watt", "watts", "w"]),
      U("kW", "Kilowatts", "kW", 1000, ["kilowatt", "kilowatts", "kw"]),
      U("MW", "Megawatts", "MW", 1e6, ["megawatt", "megawatts", "mw"]),
      U("hp", "Horsepower (mechanical)", "hp", 745.69987158227, ["horsepower", "hp", "bhp"]),
      U("ps", "Horsepower (metric)", "PS", 735.49875, ["metric horsepower", "ps", "pferdestarke"]),
      U("btuh", "BTU per hour", "BTU/h", 0.29307107, ["btu/h", "btu per hour", "btuh"]),
    ],
  },
  {
    id: "pressure", name: "Pressure", badge: "psi", base: "Pa", units: [
      U("Pa", "Pascals", "Pa", 1, ["pascal", "pascals", "pa"]),
      U("kPa", "Kilopascals", "kPa", 1000, ["kilopascal", "kilopascals", "kpa"]),
      U("MPa", "Megapascals", "MPa", 1e6, ["megapascal", "megapascals", "mpa"]),
      U("bar", "Bar", "bar", 1e5, ["bar", "bars"]),
      U("mbar", "Millibar", "mbar", 100, ["millibar", "millibars", "mbar", "hpa"]),
      U("atm", "Atmospheres", "atm", 101325, ["atmosphere", "atmospheres", "atm"]),
      U("psi", "PSI", "psi", 6894.757293168, ["psi", "pounds per square inch"]),
      U("mmHg", "mmHg (torr)", "mmHg", 133.322387415, ["mmhg", "torr", "millimeters of mercury"]),
      U("inHg", "inHg", "inHg", 3386.389, ["inhg", "inches of mercury"]),
    ],
  },
  {
    id: "angle", name: "Angle", badge: "°", base: "rad", units: [
      U("deg", "Degrees", "°", Math.PI / 180, ["degree", "degrees", "deg", "°"]),
      U("rad", "Radians", "rad", 1, ["radian", "radians", "rad"]),
      U("grad", "Gradians", "grad", Math.PI / 200, ["gradian", "gradians", "grad", "gon"]),
      U("arcmin", "Arcminutes", "′", Math.PI / 10800, ["arcminute", "arcminutes", "arcmin"]),
      U("arcsec", "Arcseconds", "″", Math.PI / 648000, ["arcsecond", "arcseconds", "arcsec"]),
      U("turn", "Turns", "turn", 2 * Math.PI, ["turn", "turns", "revolution", "revolutions", "rev"]),
    ],
  },
  {
    id: "frequency", name: "Frequency", badge: "Hz", base: "Hz", units: [
      U("Hz", "Hertz", "Hz", 1, ["hertz", "hz"]),
      U("kHz", "Kilohertz", "kHz", 1e3, ["kilohertz", "khz"]),
      U("MHz", "Megahertz", "MHz", 1e6, ["megahertz", "mhz"]),
      U("GHz", "Gigahertz", "GHz", 1e9, ["gigahertz", "ghz"]),
      U("rpm", "Revolutions per minute", "rpm", 1 / 60, ["rpm", "revolutions per minute"]),
    ],
  },
  {
    id: "fuel", name: "Fuel economy", badge: "mpg", base: "l100", units: [
      U("l100", "Liters per 100 km", "L/100km", 1, ["l/100km", "l per 100km", "liters per 100 km", "lp100km"]),
      U("kml", "Kilometers per liter", "km/L", 1, ["km/l", "kmpl", "kilometers per liter"], { toBase: (v) => 100 / v, fromBase: (b) => 100 / b }),
      U("mpgus", "Miles per gallon (US)", "mpg", 1, ["mpg", "mpg us", "miles per gallon", "miles per gallon us"], { toBase: (v) => 235.214583 / v, fromBase: (b) => 235.214583 / b }),
      U("mpguk", "Miles per gallon (UK)", "mpg UK", 1, ["mpg uk", "miles per gallon uk", "imperial mpg"], { toBase: (v) => 282.480936 / v, fromBase: (b) => 282.480936 / b }),
    ],
  },
];

// ------------------------------------------------------------------ currency (rates arrive at runtime)
export const POPULAR_CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD", "CHF", "CNY", "MXN", "BRL", "SGD", "AED", "ZAR", "KRW"];
const CURRENCY_WORDS = {
  USD: ["dollar", "dollars", "us dollar", "us dollars", "usd", "$", "bucks"],
  EUR: ["euro", "euros", "eur", "€"],
  GBP: ["british pound", "british pounds", "pound sterling", "sterling", "gbp", "£", "quid"],
  INR: ["rupee", "rupees", "indian rupee", "indian rupees", "inr", "₹", "rs"],
  JPY: ["yen", "jpy", "¥"],
  CAD: ["canadian dollar", "canadian dollars", "cad"],
  AUD: ["australian dollar", "australian dollars", "aud"],
  CNY: ["yuan", "renminbi", "rmb", "cny"],
  CHF: ["swiss franc", "swiss francs", "franc", "francs", "chf"],
  MXN: ["mexican peso", "mexican pesos", "peso", "pesos", "mxn"],
  KRW: ["won", "korean won", "krw", "₩"],
  AED: ["dirham", "dirhams", "aed"],
};

let currencyRates = null; // { base: "USD", rates: { EUR: 0.9, ... }, date, source }

export function currencyCategory(rates) {
  const names = (() => {
    try { return new Intl.DisplayNames(["en"], { type: "currency" }); } catch { return null; }
  })();
  const codes = Object.keys(rates).sort((a, b) => {
    const pa = POPULAR_CURRENCIES.indexOf(a), pb = POPULAR_CURRENCIES.indexOf(b);
    return (pa < 0 ? 99 : pa) - (pb < 0 ? 99 : pb) || a.localeCompare(b);
  });
  return {
    id: "currency", name: "Currency", badge: "$", base: "USD", live: true,
    units: codes.map((code) => {
      const f = 1 / rates[code]; // units of USD per 1 of this currency
      const name = (names && names.of(code)) || code;
      return { id: code, name, sym: code, aliases: [code.toLowerCase(), ...(CURRENCY_WORDS[code] || [])], ...lin(f) };
    }),
  };
}

// ------------------------------------------------------------------ lookup
const norm = (s) => s.toLowerCase().trim().replace(/\./g, "").replace(/\s+/g, " ").replace(/µ/g, "u").replace(/²/g, "2").replace(/³/g, "3");

let cats = [...CATEGORIES];
let aliasIndex = new Map(); // token -> [{ cat, unit }]

function rebuildIndex() {
  aliasIndex = new Map();
  for (const cat of cats) {
    for (const unit of cat.units) {
      const tokens = new Set([unit.id, unit.sym, unit.name, ...unit.aliases].map(norm));
      for (const t of [...tokens]) if (t.endsWith("s") === false && /^[a-z ]{4,}$/.test(t) && cat.id !== "currency") tokens.add(t + "s");
      for (const t of tokens) {
        if (!aliasIndex.has(t)) aliasIndex.set(t, []);
        aliasIndex.get(t).push({ cat, unit });
      }
    }
  }
}
rebuildIndex();

/** Attach live exchange rates (units of each currency per 1 USD). */
export function setCurrencyRates(rates, meta = {}) {
  currencyRates = { rates, ...meta };
  cats = [...CATEGORIES, currencyCategory(rates)];
  rebuildIndex();
}
export const hasCurrencyRates = () => !!currencyRates;
export const getCurrencyMeta = () => currencyRates;
export const allCategories = () => cats;
export const getCategory = (id) => cats.find((c) => c.id === id);

export function lookupUnit(token) { return aliasIndex.get(norm(token)) || []; }

/** Find the category that contains both units. Returns { cat, from, to } or null. */
export function resolvePair(a, b) {
  const A = lookupUnit(a), B = lookupUnit(b);
  for (const x of A) for (const y of B) if (x.cat === y.cat) return { cat: x.cat, from: x.unit, to: y.unit };
  return null;
}
export function resolveOne(a) {
  const A = lookupUnit(a);
  return A.length ? { cat: A[0].cat, from: A[0].unit } : null;
}

// ------------------------------------------------------------------ conversion
export function convert(value, from, to) {
  return to.fromBase(from.toBase(value));
}
export function convertAll(value, cat, from) {
  const base = from.toBase(value);
  return cat.units.map((u) => ({ unit: u, value: u.fromBase(base) }));
}

export function formatNumber(n, maxSig = 8) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) {
    return n.toExponential(Math.max(0, maxSig - 1)).replace(/\.?0+e/, "e").replace("e+", "e");
  }
  const rounded = Number(n.toPrecision(maxSig));
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 10 });
}
