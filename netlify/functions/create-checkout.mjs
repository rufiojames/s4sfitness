// S4S Fitness — creates a Stripe Checkout session for the Perform-Fit Hoodie.
// The price, sizes and delivery charges are set HERE on the server, so nobody
// can change them in their browser before paying.
//
// Needs one environment variable in Netlify (Site configuration → Environment variables):
//   STRIPE_SECRET_KEY = sk_live_...   (or sk_test_... while testing)

const PRODUCT_NAME = "S4S Perform-Fit Full Zip Hoodie";

// ---- Delivery zones (all amounts in pence) -------------------------------
// Based on Royal Mail Tracked for a packed hoodie under 500g.
// first = charge for the first hoodie, extra = added for each extra hoodie.
// maxQty keeps international parcels under Royal Mail's 2kg small-parcel limit.
const ZONES = {
  uk: {
    label: "UK tracked delivery", first: 599, extra: 0, freeOver: 7500,
    days: [1, 3], maxQty: 20, countries: ["GB"]
  },
  europe: {
    label: "Europe tracked delivery", first: 1499, extra: 200, freeOver: null,
    days: [3, 7], maxQty: 4,
    countries: ["IE","FR","DE","ES","IT","NL","BE","LU","PT","AT","DK","SE","NO","FI","IS","PL","CZ","SK","HU",
                "SI","HR","RO","BG","GR","CY","MT","EE","LV","LT","CH","LI","MC","AD","GI","JE","GG","IM"]
  },
  world: {
    label: "International tracked delivery", first: 2599, extra: 499, freeOver: null,
    days: [5, 10], maxQty: 4,
    countries: ["US","CA","AU","NZ","AE","SA","QA","KW","BH","OM","IL","SG","HK","JP","KR","MY","TH","PH","IN","ZA","MX","BR"]
  }
};

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });

  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return json(500, { error: "Checkout isn't set up yet. Please try again shortly." });
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    console.error("STRIPE_SECRET_KEY doesn't look like a Stripe secret key (starts with " + key.slice(0, 8) + ")");
    return json(500, { error: "Checkout isn't set up correctly yet. [Setup: the Stripe key in Netlify should start sk_test_ or sk_live_, not " + key.slice(0, 3) + "…]" });
  }

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Bad request." }); }

  // Use the address the customer is actually on (works on the .netlify.app address
  // and on s4sfitness.com), so links back from Stripe always land on a working page.
  const site = new URL(req.url).origin;

  // Sold-out sizes. If the stock file can't be read, don't block the sale:
  // fall back to treating every size as available and log it.
  let stock = { price_pence: 3499, sizes: { S: true, M: true, L: true, XL: true, XXL: true } };
  try {
    const r = await fetch(`${site}/stock.json`, { headers: { "Cache-Control": "no-cache" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const s = await r.json();
    if (s && s.sizes && Number.isInteger(s.price_pence)) stock = s;
  } catch (e) {
    console.error("Couldn't read stock.json from", site, "-", e && e.message);
  }

  const size = String(body.size || "");
  const qty = Math.floor(Number(body.qty));
  const region = body.region in ZONES ? body.region : "uk";
  const zone = ZONES[region];

  if (!(size in stock.sizes)) return json(400, { error: "Please choose a size." });
  if (!stock.sizes[size]) return json(409, { error: `Size ${size} has just sold out.` });
  if (!Number.isFinite(qty) || qty < 1) return json(400, { error: "Please choose a quantity." });
  if (qty > zone.maxQty) return json(400, { error: region === "uk"
    ? `You can order up to ${zone.maxQty} at once. For more, use our team orders form.`
    : `International orders are limited to ${zone.maxQty} hoodies. For more, email us or use our team orders form.` });

  const subtotal = stock.price_pence * qty;

  const free = zone.freeOver !== null && subtotal > zone.freeOver;
  const shipping = {
    name: free ? "Free " + zone.label : zone.label,
    amount: free ? 0 : zone.first + zone.extra * (qty - 1),
    min: zone.days[0], max: zone.days[1], countries: zone.countries
  };

  const p = new URLSearchParams();
  p.append("mode", "payment");
  p.append("success_url", `${site}/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}`);
  p.append("cancel_url", `${site}/perform-fit-hoodie.html`);
  p.append("line_items[0][quantity]", String(qty));
  p.append("line_items[0][price_data][currency]", "gbp");
  p.append("line_items[0][price_data][unit_amount]", String(stock.price_pence));
  p.append("line_items[0][price_data][product_data][name]", `${PRODUCT_NAME} – Size ${size}`);
  p.append("line_items[0][price_data][product_data][description]", "Grey marl / charcoal / sky blue");
  p.append("line_items[0][price_data][product_data][images][0]", `${site}/img/graffiti-hands-on-hips-sm.jpg`);
  p.append("line_items[0][price_data][product_data][metadata][size]", size);
  shipping.countries.forEach((c, i) => p.append(`shipping_address_collection[allowed_countries][${i}]`, c));
  p.append("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  p.append("shipping_options[0][shipping_rate_data][display_name]", shipping.name);
  p.append("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shipping.amount));
  p.append("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "gbp");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", String(shipping.min));
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  p.append("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", String(shipping.max));
  if (region !== "uk") {
    p.append("custom_text[shipping_address][message]",
      "Orders outside the UK may have import VAT or customs charges to pay on delivery. These are set by your country and aren't included in our price.");
  }
  p.append("phone_number_collection[enabled]", "true");
  p.append("allow_promotion_codes", "true");
  p.append("metadata[size]", size);
  p.append("metadata[qty]", String(qty));
  p.append("metadata[region]", region);
  p.append("payment_intent_data[description]", `S4S Perform-Fit Hoodie ×${qty} (${size})`);

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
    // While testing (sk_test_ key) show Stripe's reason on screen to make setup easier.
    // With a live key, customers only ever see the friendly message.
    const detail = key.startsWith("sk_test_") ? ` [Stripe test mode: ${err.message || "HTTP " + res.status}]` : "";
    return json(502, { error: "Checkout couldn't start. Please try again, or email us." + detail });
  }
  return json(200, { url: data.url });
};

export const config = { path: "/api/checkout" };
