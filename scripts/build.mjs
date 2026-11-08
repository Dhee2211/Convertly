// Generates one static, crawlable HTML page per tool (plus the home page, sitemap and robots.txt).
// Run with: node scripts/build.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOOLS, GROUPS, SITE } from "../tools-meta.js";
import { CATEGORIES, convert, formatNumber } from "../units.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TODAY = new Date().toISOString().slice(0, 10);

const EXAMPLES = ["5 km to miles", "20% off 80", "3pm New York to London", "100 usd to eur", "72 f to c", "tip 18% on 64.50 split 3", "meeting new york, london, tokyo", "255 to hex"];

const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`;

function head({ title, description, path, root, extraLd = [] }) {
  const url = SITE.url + path;
  const ld = [{
    "@type": "WebApplication", name: title, url, description, applicationCategory: "UtilitiesApplication", operatingSystem: "Any",
    isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, codeRepository: "https://github.com/Dhee2211/Convertly",
  }, ...extraLd];
  return `<!doctype html>
<html lang="en" data-root="${root}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#0d9488">
  <link rel="canonical" href="${url}">
  <link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
  <link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE.url}og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE.url}og-image.png">
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": ld })}</script>
  <link rel="stylesheet" href="${root}style.css">
</head>`;
}

function header(root, tool) {
  return `<body${tool ? ` data-tool="${tool.id}"` : ""}>
<div class="shell">
  <header class="top">
    <a class="brand" href="${root}"><span class="logo" aria-hidden="true">⇄</span>${SITE.name}</a>
    <nav aria-label="Main"><a href="${root}currency-converter/">Currency</a><a href="${root}discount-calculator/">Discount</a><a href="${root}meeting-time-finder/">Meeting finder</a></nav>
  </header>`;
}

const search = (root, autofocus) => `
  <div class="search" role="search">
    ${icon}
    <input id="q" type="search" placeholder="Try: 5 km to miles, 20% off 80, 3pm New York to London" aria-label="Search converters and calculators" autocomplete="off" spellcheck="false"${autofocus ? " autofocus" : ""}>
    <kbd>/</kbd>
  </div>
  <div id="answer" aria-live="polite" hidden></div>`;

const footer = (root) => `
  <footer>
    <span><a href="https://github.com/Dhee2211/Convertly">Open source · MIT</a></span>
    <span>No sign-up · no tracking · your numbers stay in your browser</span>
  </footer>
</div>
<script type="module" src="${root}app.js"></script>
</body>
</html>
`;

const tile = (t, root) => `<a class="tile" href="${root}${t.slug}/"><span class="b">${esc(t.badge)}</span>${esc(t.name)}</a>`;

function factsFor(tool) {
  const cat = CATEGORIES.find((c) => c.id === tool.id);
  if (!cat) return "";
  const u = cat.units.slice(0, 6);
  const items = [];
  for (let i = 0; i < u.length; i++) for (let j = 0; j < u.length; j++) {
    if (i === j || items.length >= 24) continue;
    if (j < i && Math.abs(i - j) > 1) continue;
    items.push(`<li>1 ${esc(u[i].name.toLowerCase())} = ${formatNumber(convert(1, u[i], u[j]), 7)} ${esc(u[j].sym)}</li>`);
  }
  return `<h2>Common ${esc(tool.name.toLowerCase())} conversions</h2><ul class="facts">${items.join("")}</ul>`;
}

// ---------------------------------------------------------------- home
function home() {
  const groups = GROUPS.map((g) => `<h2 class="group-title">${g}</h2><div class="tiles">${TOOLS.filter((t) => t.group === g).map((t) => tile(t, "./")).join("")}</div>`).join("\n");
  const faq = [
    ["What can Convertly do?", "Convert units (length, weight, temperature, volume and more), convert live currencies, calculate discounts, percentages, tips, tax and loan payments, and find the best meeting time across time zones."],
    ["How do I use it?", "Type what you want in the search box, such as '5 km to miles' or '20% off 80', and the answer appears instantly. Or open a tool and type a number."],
    ["Is it free and private?", "Yes. It is free and open source, with no sign-up. Calculations happen in your browser."],
  ];
  const ld = [{ "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }];
  const title = `${SITE.name}: Unit, Currency and Time Zone Converters, Discount Calculator and More`;
  const description = "Free converters and calculators in one place. Convert units and currency, calculate discounts, tips, tax and loans, and find the best meeting time across time zones. Just type.";
  return head({ title, description, path: "", root: "./", extraLd: ld }) + header("./") + `
  <h1>Every converter and calculator,<br>one search away.</h1>
  <p class="lead">Just type what you need. The answer appears instantly, no clicks.</p>
  ${search("./", true)}
  <div class="examples">${EXAMPLES.map((e) => `<a href="./?q=${encodeURIComponent(e)}">${esc(e)}</a>`).join("")}</div>
  ${groups}
  <section class="seo"><h2>Frequently asked questions</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}</section>` + footer("./");
}

// ---------------------------------------------------------------- tool pages
function toolPage(t) {
  const root = "../";
  const related = TOOLS.filter((x) => x.group === t.group && x.id !== t.id).slice(0, 12);
  const faq = [
    [`How do I use the ${t.name.toLowerCase()} ${t.kind === "calc" ? "calculator" : t.kind === "time" ? "tool" : "converter"}?`, t.intro],
    ["Is it free?", "Yes. It is free, open source and needs no sign-up."],
    ["Is my data sent anywhere?", t.id === "currency" ? "Only a request for current exchange rates is made. The amounts you type stay in your browser." : "No. Everything is calculated in your browser."],
  ];
  const ld = [
    { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url }, { "@type": "ListItem", position: 2, name: t.name, item: `${SITE.url}${t.slug}/` }] },
  ];
  return head({ title: `${t.title} | ${SITE.name}`, description: t.description, path: `${t.slug}/`, root, extraLd: ld }) + header(root, t) + `
  <h1>${esc(t.title.split(":")[0])}</h1>
  <p class="lead">${esc(t.intro)}</p>
  ${search(root, false)}
  <main id="tool" class="tool"><noscript><p class="error">This tool needs JavaScript.</p></noscript></main>
  <section class="seo">
    ${factsFor(t)}
    <h2>Frequently asked questions</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join("")}
    <h2>More tools</h2><div class="related">${related.map((x) => `<a href="${root}${x.slug}/">${esc(x.name)}</a>`).join("")}<a href="${root}">All tools</a></div>
  </section>` + footer(root);
}

// ---------------------------------------------------------------- write
const write = (path, content) => { mkdirSync(dirname(join(ROOT, path)), { recursive: true }); writeFileSync(join(ROOT, path), content); };
write("index.html", home());
for (const t of TOOLS) write(`${t.slug}/index.html`, toolPage(t));
write("404.html", head({ title: `Page not found | ${SITE.name}`, description: "This page does not exist. Use search to find the converter you need.", path: "404.html", root: "/Convertly/" }).replace('content="index, follow, max-image-preview:large"', 'content="noindex"') + header("/Convertly/") + `
  <h1>Page not found</h1><p class="lead">Try searching for what you need.</p>${search("/Convertly/", true)}` + footer("/Convertly/"));
const urls = ["", ...TOOLS.map((t) => `${t.slug}/`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u, i) => `  <url><loc>${SITE.url}${u}</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>${i === 0 ? "1.0" : "0.8"}</priority></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}sitemap.xml\n`);
console.log(`Built ${TOOLS.length + 1} pages.`);
