// S4S Fitness — creates a Stripe Checkout session for whatever is in the basket.
// Prices, stock and delivery are all worked out HERE on the server from stock.json,
// so nobody can change them in their browser before paying.
//
// Needs one environment variable in Netlify (Site configuration → Environment variables):
//   STRIPE_SECRET_KEY = sk_live_... / rk_live_...   (or sk_test_... while testing)
//
// Request body: { region: "uk"|"europe"|"world", items: [{ id, size?, qty }] }
//   id is a key of stock.json → products (hoodie, grips, wraps, chalk, kit).
//   hoodie and kit need a size. The old shape { size, qty, region } still works.

// ---- Delivery zones (all amounts in pence) -------------------------------
// Based on Royal Mail Tracked for a packed hoodie under 500g.
// first = charge for the first parcel unit, extra = each further unit (rounded up).
// A hoodie is 1 unit, the Training Kit 2, a small accessory ½.
// maxUnits keeps international parcels under Royal Mail's 2kg small-parcel limit.
const ZONES = {
  uk: {
    label: "UK tracked delivery", first: 599, extra: 0, freeOver: 6500, // 2+ hoodies (£69.98) ship free
    days: [1, 3], maxUnits: 20, countries: ["GB"]
  },
  europe: {
    label: "Europe tracked delivery", first: 1499, extra: 200, freeOver: null,
    days: [3, 7], maxUnits: 4,
    countries: ["IE","FR","DE","ES","IT","NL","BE","LU","PT","AT","DK","SE","NO","FI","IS","PL","CZ","SK","HU",
                "SI","HR","RO","BG","GR","CY","MT","EE","LV","LT","CH","LI","MC","AD","GI","JE","GG","IM"]
  },
  world: {
    label: "International tracked delivery", first: 2599, extra: 499, freeOver: null,
    days: [5, 10], maxUnits: 4,
    countries: ["US","CA","AU","NZ","AE","SA","QA","KW","BH","OM","IL","SG","HK","JP","KR","MY","TH","PH","IN","ZA","MX","BR"]
  }
};

const DEFAULT_STOCK = {
  sizes: { S: true, M: true, L: true, XL: true, XXL: true },
  products: {
    hoodie: { name: "S4S Perform-Fit Full Zip Hoodie", price_pence: 3499, units: 1 }
  }
};
const SIZED = new Set(["hoodie", "kit"]);
const PAGES = { hoodie: "perform-fit-hoodie.html", grips: "taffer-lifting-grips.html", wraps: "taffer-wrist-wraps.html",
                chalk: "beast-liquid-chalk.html", kit: "training-kit.html" };
const IMAGES = { hoodie: "img/graffiti-hands-on-hips-sm.jpg", kit: "img/graffiti-hands-on-hips-sm.jpg",
                 chalk: "img/products/beast-liquid-chalk-sm.jpg" };

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return json(500, { error: "Checkout isn't set up yet. Please try again shortly." });
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    console.error("STRIPE_SECRET_KEY doesn't look like a Stripe secret key (starts with " + key.slice(0, 8) + ")");
    return json(500, { error: "Checkout isn't set up correctly yet. [Setup: the Stripe key in Netlify should start sk_ or rk_, not " + key.slice(0, 3) + "…]" });
  }

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Bad request." }); }

  // Use the address the customer is actually on, so links back from Stripe land on a working page.
  const site = new URL(req.url).origin;

  // Stock + prices. If the file can't be read, fall back to the hoodie only and log it.
  let stock = DEFAULT_STOCK;
  try {
    const r = await fetch(`${site}/stock.json`, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const s = await r.json();
    if (s && s.sizes && s.products && s.products.hoodie) stock = s;
  } catch (e) {
    console.error("Couldn't read stock.json from", site, "-", e && e.message);
  }
  const P = stock.products;

  const region = body.region in ZONES ? body.region : "uk";
  const zone = ZONES[region];

  // Accept the old single-hoodie request shape too.
  let items = Array.isArray(body.items) ? body.items : [{ id: "hoodie", size: body.size, qty: body.qty }];
  items = items.slice(0, 20).map(i => ({ id: String(i.id || ""), size: i.size ? String(i.size) : "", qty: Math.floor(Number(i.qty)) }));
  if (!items.length) return json(400, { error: "Your basket is empty." });

  // Validate every line.
  for (const it of items) {
    const p = P[it.id];
    if (!p) return json(400, { error: "Something in your basket is no longer available. Please remove it and try again." });
    if (!Number.isFinite(it.qty) || it.qty < 1 || it.qty > 20) return json(400, { error: "Please check the quantities in your basket." });
    if (SIZED.has(it.id)) {
      if (!(it.size in stock.sizes)) return json(400, { error: "Please choose a hoodie size." });
      if (!stock.sizes[it.size]) return json(409, { error: `Hoodie size ${it.size} has just sold out.`, id: it.id, size: it.size });
    }
    if (p.in_stock === false) return json(409, { error: `${p.name} has just sold out.`, id: it.id });
    for (const inc of p.includes || []) {
      if (P[inc] && P[inc].in_stock === false) return json(409, { error: `${p.name} is sold out (the ${P[inc].name} has gone).`, id: it.id });
    }
    if (p.uk_only && region !== "uk") return json(400, { error: `${p.name} can only be sent within the UK. Please remove it for international delivery.` });
  }

  // Price the lines. Wrist wraps get the add-on price, one pair per hoodie bought on its own.
  const hoodies = items.filter(i => i.id === "hoodie").reduce((a, i) => a + i.qty, 0);
  const lines = [];
  for (const it of items) {
    const p = P[it.id];
    let qtyAtFull = it.qty, qtyAddon = 0;
    if (it.id === "wraps" && p.addon_pence) { qtyAddon = Math.min(it.qty, hoodies); qtyAtFull = it.qty - qtyAddon; }
    const name = SIZED.has(it.id) ? `${p.name} – Size ${it.size}` : p.name;
    if (qtyAtFull) lines.push({ it, name, unit: p.price_pence, qty: qtyAtFull });
    if (qtyAddon) lines.push({ it, name: `${p.name} (add-on price with a hoodie)`, unit: p.addon_pence, qty: qtyAddon });
  }
  const subtotal = lines.reduce((a, l) => a + l.unit * l.qty, 0);

  const units = items.reduce((a, i) => a + (Number(P[i.id].units) || 1) * i.qty, 0);
  if (units > zone.maxUnits) return json(400, { error: region === "uk"
    ? "That's a big order! For more than this, please use our team orders form."
    : "International orders are limited to 4 hoodies (or 2 Training Kits) per parcel. For more, email us or use our team orders form." });

  const free = zone.freeOver !== null && subtotal > zone.freeOver;
  const shipAmount = free ? 0 : zone.first + zone.extra * Math.max(0, Math.ceil(units) - 1);

  const p = new URLSearchParams();
  p.append("mode", "payment");
  p.append("success_url", `${site}/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}`);
  p.append("cancel_url", `${site}/${PAGES[items[0].id] || "shop.html"}`);
  lines.forEach((l, n) => {
    p.append(`line_items[${n}][quantity]`, String(l.qty));
    p.append(`line_items[${n}][price_data][currency]`, "gbp");
    p.append(`line_items[${n}][price_data][unit_amount]`, String(l.unit));
    p.append(`line_items[${n}][price_data][product_data][name]`, l.name);
    if (l.it.id === "hoodie") p.append(`line_items[${n}][price_data][product_data][description]`, "Grey marl / charcoal / sky blue");
    if (l.it.id === "kit") p.append(`line_items[${n}][price_data][product_data][description]`, "Perform-Fit Hoodie + TAFFER Pro Lifting Grips + TAFFER Wrist Wraps");
    if (IMAGES[l.it.id]) p.append(`line_items[${n}][price_data][product_data][images][0]`, `${site}/${IMAGES[l.it.id]}`);
    p.append(`line_items[${n}][price_data][product_data][metadata][id]`, l.it.id);
    if (l.it.size) p.append(`line_items[${n}][price_data][product_data][metadata][size]`, l.it.size);
  });
  zone.countries.forEach((c, i) => p.append(`shipping_address_collection[allowed_countries][${i}]`, c));
  p.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  p.append("shipping_options[0][shipping_rate_data][display_name]", free ? "Free " + zone.label : zone.label);
  p.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shipAmount));
  p.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "gbp");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", String(zone.days[0]));
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", String(zone.days[1]));
  if (region !== "uk") {
    p.append("custom_text[shipping_address][message]",
      "Orders outside the UK may have import VAT or customs charges to pay on delivery. These are set by your country and aren't included in our price.");
  }
  p.append("phone_number_collection[enabled]", "true");
  p.append("allow_promotion_codes", "true");
  const summary = items.map(i => `${i.qty}× ${i.id}${i.size ? " " + i.size : ""}`).join(", ");
  p.append("metadata[items]", summary.slice(0, 480));
  p.append("metadata[region]", region);
  p.append("payment_intent_data[description]", `S4S order: ${summary}`.slice(0, 900));

  let res, data;
  try {
    res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: p.toString()
    });
    data = await res.json();
  } catch {
    return json(502, { error: "Couldn't reach the payment provider. Please try again." });
  }
  if (!res.ok || !data.url) {
    const err = (data && data.error) || {};
    console.error("Stripe error:", res.status, JSON.stringify(err));
    const detail = key.startsWith("sk_test_") ? ` [Stripe test mode: ${err.message || "HTTP " + res.status}]` : "";
    return json(502, { error: "Checkout couldn't start. Please try again, or email us." + detail });
  }
  return json(200, { url: data.url, value: (subtotal + shipAmount) / 100 });
};

export const config = { path: "/api/checkout" };
