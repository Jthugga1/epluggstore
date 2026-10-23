// Creates a Stripe Checkout session. Prices are looked up here on the server from
// data/products.json, so nobody can change a price in their browser.
//
// Netlify environment variables (Site configuration → Environment variables):
//   STRIPE_SECRET_KEY      sk_live_... (or sk_test_... while testing) — required
//   SHIPPING_FLAT_CENTS    flat shipping under the free threshold, in cents (default 999)
//   FREE_SHIPPING_OVER     dollars (default 150)

const products = require("../../data/products.json");

const PROMO_CODES = { PLUGGSTUDENT: 0.10 }; // keep in sync with STORE.promoCodes in assets/app.js
const MAX_QTY = 10;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(503, { error: "Checkout isn’t set up yet — add your Stripe key in Netlify." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }

  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const rate = PROMO_CODES[String(body.promo || "").toUpperCase()] || 0;

  const lines = [];
  let subtotalCents = 0;
  for (const it of items) {
    const p = products.find((x) => x.id === it.id);
    const qty = Math.min(MAX_QTY, Math.max(1, parseInt(it.qty, 10) || 0));
    if (!p || p.partner_url || p.stock === 0 || !(p.price > 0)) continue;
    const unit = Math.round(p.price * (1 - rate) * 100);
    subtotalCents += unit * qty;
    lines.push({ p, qty, unit });
  }
  if (!lines.length) return json(400, { error: "Your cart is empty." });

  const freeOver = Number(process.env.FREE_SHIPPING_OVER || 150) * 100;
  const flat = parseInt(process.env.SHIPPING_FLAT_CENTS || "999", 10);
  const shipCents = subtotalCents >= freeOver ? 0 : flat;

  const proto = event.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${event.headers.host}`;

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/#/success`);
  form.set("cancel_url", `${origin}/#/cart`);
  form.set("shipping_address_collection[allowed_countries][0]", "US");
  form.set("billing_address_collection", "auto");
  form.set("phone_number_collection[enabled]", "true");
  if (rate) form.set("metadata[promo]", String(body.promo).toUpperCase());

  lines.forEach(({ p, qty, unit }, i) => {
    form.set(`line_items[${i}][quantity]`, String(qty));
    form.set(`line_items[${i}][price_data][currency]`, "usd");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(unit));
    form.set(`line_items[${i}][price_data][product_data][name]`, p.name + (rate ? ` (${Math.round(rate * 100)}% off)` : ""));
    form.set(`line_items[${i}][price_data][product_data][metadata][product_id]`, p.id);
    const img = p.images && p.images[0];
    if (img && /^https:\/\//.test(img)) form.set(`line_items[${i}][price_data][product_data][images][0]`, img);
  });

  form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  form.set("shipping_options[0][shipping_rate_data][display_name]", shipCents ? "Standard shipping" : "Free shipping");
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shipCents));
  form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Stripe error", data.error && data.error.message);
      return json(502, { error: "Payment provider error. Please try again." });
    }
    return json(200, { url: data.url });
  } catch (err) {
    console.error(err);
    return json(502, { error: "Couldn’t reach the payment provider." });
  }
};
