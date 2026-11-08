// Tiny DOM helpers shared by every tool.
export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "value") el.value = v;
    else if (k === "checked" || k === "selected" || k === "disabled" || k === "hidden") el[k] = !!v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const clear = (el) => { el.replaceChildren(); return el; };

let toastTimer;
export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = h("div", { id: "toast", role: "status" }); document.body.append(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

export async function copyText(text, label = "Copied") {
  try { await navigator.clipboard.writeText(text); toast(`${label}: ${text.length > 40 ? text.slice(0, 40) + "…" : text}`); }
  catch { toast("Press Ctrl/Cmd+C to copy"); }
}

export const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/** Read and write tool state in the URL query string so every result is shareable. */
export const query = {
  get: (k, d = "") => new URLSearchParams(location.search).get(k) ?? d,
  set(obj) {
    const p = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(obj)) (v === "" || v == null ? p.delete(k) : p.set(k, v));
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  },
};

export const store = {
  get(k, d = null) { try { const v = localStorage.getItem("convertly:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("convertly:" + k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/** A labelled number/text input. Returns { el, input }. */
export function field({ label, value = "", type = "number", step = "any", min, prefix, suffix, placeholder = "", onInput, id, autofocus = false, inputmode }) {
  const input = h("input", { id, type, value, step, min, placeholder, autofocus, inputmode: inputmode || (type === "number" ? "decimal" : null), autocomplete: "off" });
  if (onInput) input.addEventListener("input", onInput);
  const el = h("label", { class: "field" },
    h("span", { class: "field-label" }, label),
    h("span", { class: "field-box" }, prefix ? h("span", { class: "affix" }, prefix) : null, input, suffix ? h("span", { class: "affix" }, suffix) : null));
  return { el, input };
}

export function chips(options, current, onPick, { ariaLabel = "" } = {}) {
  const wrap = h("div", { class: "chips", role: "radiogroup", "aria-label": ariaLabel });
  const draw = (cur) => {
    clear(wrap);
    for (const o of options) {
      const val = typeof o === "object" ? o.value : o, text = typeof o === "object" ? o.label : String(o);
      wrap.append(h("button", {
        type: "button", class: "chip" + (String(val) === String(cur) ? " on" : ""), role: "radio", "aria-checked": String(val) === String(cur),
        onclick: () => { draw(val); onPick(val); },
      }, text));
    }
  };
  draw(current);
  wrap.set = draw;
  return wrap;
}

export function select(options, value, onChange, { label = "", id } = {}) {
  const sel = h("select", { id, "aria-label": label || null },
    options.map((o) => h("option", { value: o.value ?? o, selected: String(o.value ?? o) === String(value) }, o.label ?? o)));
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

/** A result line. Click to copy: pass `copy` as the text to copy (or false to disable). */
export const resultRow = (label, value, { big = false, copy = null, sub = "" } = {}) => {
  const text = copy === null ? String(value) : copy;
  const row = h("div", { class: "result" + (big ? " big" : ""), role: text === false ? null : "button", tabindex: text === false ? null : "0", title: text === false ? null : "Click to copy" },
    h("span", { class: "result-label" }, label, sub ? h("small", {}, sub) : null), h("span", { class: "result-value" }, value));
  if (text !== false) {
    const go = () => copyText(text);
    row.addEventListener("click", go);
    row.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }
  return row;
};

export const plain = (n) => (Number.isFinite(n) ? String(Number(n.toPrecision(12))) : "");
