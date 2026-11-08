// Tool metadata: what exists, how it is named, and how it shows up in search engines.
// No DOM here, so the build script can import it to generate one static page per tool.
import { CATEGORIES } from "./units.js";

const unitTool = (id, slug, intro, keywords = []) => {
  const cat = CATEGORIES.find((c) => c.id === id);
  const sample = cat.units.slice(0, 4).map((u) => u.name.toLowerCase()).join(", ");
  return {
    id, slug, kind: "units", group: "Converters", name: cat.name, badge: cat.badge,
    title: `${cat.name} Converter: ${cat.units.slice(0, 3).map((u) => u.sym).join(", ")} and more`,
    description: `Free ${cat.name.toLowerCase()} converter. Type a value and instantly see ${sample} and every other unit at once. No sign-up.`,
    intro, keywords: [cat.name.toLowerCase(), ...keywords],
  };
};

export const TOOLS = [
  unitTool("length", "length-converter", "Convert meters, kilometers, miles, feet, inches and more. Type a number, see every length unit at once.", ["distance", "km", "miles", "feet", "inches", "metres"]),
  unitTool("mass", "weight-converter", "Convert kilograms, pounds, ounces, stone, tonnes and more in one step.", ["mass", "kg", "lbs", "pounds", "ounces", "stone"]),
  unitTool("temperature", "temperature-converter", "Convert Celsius, Fahrenheit, Kelvin and Rankine instantly.", ["celsius", "fahrenheit", "kelvin", "degrees"]),
  unitTool("volume", "volume-converter", "Convert liters, gallons, cups, tablespoons, fluid ounces and more. US and UK measures.", ["liters", "gallons", "cups", "ml", "tablespoons"]),
  unitTool("area", "area-converter", "Convert square meters, square feet, acres, hectares and more.", ["acres", "hectares", "square feet", "sq ft"]),
  unitTool("speed", "speed-converter", "Convert km/h, mph, m/s, knots and Mach.", ["mph", "kmh", "knots", "velocity"]),
  unitTool("time", "duration-converter", "Convert seconds, minutes, hours, days, weeks, months and years.", ["duration", "seconds", "hours", "days"]),
  unitTool("data", "data-storage-converter", "Convert bytes, KB, MB, GB, TB and the binary units KiB, MiB, GiB, TiB.", ["bytes", "megabytes", "gigabytes", "storage", "file size"]),
  unitTool("energy", "energy-converter", "Convert joules, calories, kilocalories, kWh, BTU and more.", ["calories", "kwh", "joules", "btu"]),
  unitTool("power", "power-converter", "Convert watts, kilowatts, horsepower and BTU per hour.", ["watts", "horsepower", "kw", "hp"]),
  unitTool("pressure", "pressure-converter", "Convert pascals, bar, psi, atmospheres and mmHg.", ["psi", "bar", "atm", "pascal"]),
  unitTool("angle", "angle-converter", "Convert degrees, radians, gradians, arcminutes and turns.", ["degrees", "radians"]),
  unitTool("frequency", "frequency-converter", "Convert hertz, kilohertz, megahertz, gigahertz and rpm.", ["hz", "rpm", "ghz"]),
  unitTool("fuel", "fuel-economy-converter", "Convert mpg (US and UK), km/L and L/100km.", ["mpg", "mileage", "fuel consumption", "l/100km"]),
  {
    id: "currency", slug: "currency-converter", kind: "units", group: "Converters", name: "Currency", badge: "$",
    title: "Currency Converter: live exchange rates for 160+ currencies",
    description: "Free currency converter with live exchange rates for USD, EUR, GBP, INR, JPY and 160+ more. Type an amount and see popular currencies instantly.",
    intro: "Live exchange rates for 160+ currencies. Type an amount and see the popular ones at once.", keywords: ["exchange rate", "usd", "eur", "inr", "money", "forex"],
  },
  {
    id: "cooking", slug: "cooking-converter", kind: "special", group: "Converters", name: "Cooking", badge: "cup",
    title: "Cooking Converter: cups to grams, tablespoons, ounces for any ingredient",
    description: "Convert cups to grams and back for flour, sugar, butter and more. Also tablespoons, teaspoons, ounces and milliliters. Free and instant.",
    intro: "Pick an ingredient and an amount. See grams, ounces, cups, tablespoons and teaspoons at once.", keywords: ["cups to grams", "baking", "recipe", "flour", "sugar", "butter"],
  },
  {
    id: "base", slug: "number-base-converter", kind: "special", group: "Converters", name: "Number base", badge: "0x",
    title: "Number Base Converter: binary, decimal, octal, hexadecimal",
    description: "Convert between binary, octal, decimal and hexadecimal instantly. Paste a number in any base and see all four.",
    intro: "Binary, octal, decimal and hexadecimal side by side.", keywords: ["binary", "hex", "hexadecimal", "octal", "decimal"],
  },
  {
    id: "roman", slug: "roman-numeral-converter", kind: "special", group: "Converters", name: "Roman numerals", badge: "XIV",
    title: "Roman Numeral Converter: numbers to Roman numerals and back",
    description: "Convert numbers to Roman numerals and Roman numerals to numbers, from 1 to 3999. Instant and free.",
    intro: "Type a number or a Roman numeral. The other one appears instantly.", keywords: ["roman numerals", "xiv", "mmxxiv"],
  },
  {
    id: "color", slug: "color-converter", kind: "special", group: "Converters", name: "Color", badge: "#",
    title: "Color Converter: HEX, RGB and HSL",
    description: "Convert colors between HEX, RGB and HSL instantly. Pick a color or paste a code, then copy any format.",
    intro: "Pick a color or paste a code. Copy HEX, RGB or HSL with one click.", keywords: ["hex to rgb", "rgb to hex", "hsl", "color picker"],
  },
  {
    id: "unix", slug: "unix-timestamp-converter", kind: "special", group: "Converters", name: "Unix timestamp", badge: "ts",
    title: "Unix Timestamp Converter: epoch time to date and back",
    description: "Convert Unix timestamps (seconds or milliseconds) to readable dates and dates back to timestamps. Shows UTC and your local time.",
    intro: "Paste a timestamp or pick a date. See UTC, local time and the epoch value.", keywords: ["epoch", "unix time", "timestamp"],
  },
  {
    id: "discount", slug: "discount-calculator", kind: "calc", group: "Calculators", name: "Discount", badge: "%",
    title: "Discount Calculator: final price, savings and original price",
    description: "Free discount calculator. Enter the price and percent off to see what you pay and save. Handles extra discounts, flat amounts, tax and reverse (find the original price).",
    intro: "Enter a price and a percent off. See what you pay and what you save.", keywords: ["percent off", "sale price", "savings", "coupon", "markdown"],
  },
  {
    id: "percentage", slug: "percentage-calculator", kind: "calc", group: "Calculators", name: "Percentage", badge: "%",
    title: "Percentage Calculator: percent of, what percent, percent change",
    description: "Free percentage calculator. Find X% of a number, what percent one number is of another, and percentage increase or decrease. All answers live as you type.",
    intro: "Three common percentage questions, answered live.", keywords: ["percent of", "percent change", "percentage increase", "percentage decrease"],
  },
  {
    id: "tip", slug: "tip-calculator", kind: "calc", group: "Calculators", name: "Tip & split", badge: "tip",
    title: "Tip Calculator: tip, total and split the bill",
    description: "Free tip calculator. Enter the bill and tip percent, split between friends, and optionally round up. See tip, total and the amount per person.",
    intro: "Bill, tip percent, number of people. Done.", keywords: ["split bill", "gratuity", "restaurant"],
  },
  {
    id: "vat", slug: "vat-calculator", kind: "calc", group: "Calculators", name: "VAT / GST / tax", badge: "tax",
    title: "VAT, GST and Sales Tax Calculator: add or remove tax",
    description: "Free VAT, GST and sales tax calculator. Add tax to a price or remove it from a total and see net, tax and gross amounts.",
    intro: "Add tax to a price, or take it out of a total.", keywords: ["gst", "sales tax", "vat", "tax inclusive", "tax exclusive"],
  },
  {
    id: "emi", slug: "loan-emi-calculator", kind: "calc", group: "Calculators", name: "Loan / EMI", badge: "EMI",
    title: "Loan and EMI Calculator: monthly payment and total interest",
    description: "Free loan and EMI calculator. Enter the amount, interest rate and term to see your monthly payment, total interest and a month-by-month breakdown.",
    intro: "Amount, rate, term. See the monthly payment and total interest.", keywords: ["emi", "mortgage", "loan payment", "interest"],
  },
  {
    id: "date", slug: "date-calculator", kind: "calc", group: "Calculators", name: "Date & age", badge: "date",
    title: "Date Calculator: days between dates, age and add days",
    description: "Free date calculator. Find the days between two dates, calculate age from a birth date, or add and subtract days from a date.",
    intro: "Days between dates, age, or a date plus or minus days.", keywords: ["days between dates", "age calculator", "add days", "date difference"],
  },
  {
    id: "meeting", slug: "meeting-time-finder", kind: "time", group: "Time zones", name: "Meeting time finder", badge: "🌍",
    title: "Meeting Time Finder: best time across time zones",
    description: "Free meeting planner for any time zones. Add your cities and instantly see the best overlapping working hours, with a ready-to-send invite and calendar link. Handles daylight saving.",
    intro: "Add the cities. See the best time for everyone, right away.", keywords: ["meeting planner", "time zone overlap", "world clock", "schedule across time zones", "booking"],
  },
  {
    id: "timezone", slug: "time-zone-converter", kind: "time", group: "Time zones", name: "Time zone converter", badge: "tz",
    title: "Time Zone Converter: convert a time between cities",
    description: "Free time zone converter. Convert any time from one city to another, or several at once. Understands daylight saving time. Try “3pm New York to London”.",
    intro: "Convert a time from one city to many. Try \"3pm New York to London\".", keywords: ["time converter", "est to pst", "ist to est", "world time", "timezone"],
  },
];

export const GROUPS = ["Converters", "Calculators", "Time zones"];
export const toolById = (id) => TOOLS.find((t) => t.id === id);
export const SITE = { name: "Convertly", tagline: "Every converter and calculator you need, in one click.", url: "https://dhee2211.github.io/Convertly/" };
