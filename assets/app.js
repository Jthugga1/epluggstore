/* E Plugg storefront — no framework, no build step.
   Products live in data/products.json, categories in data/categories.json.
   Edit STORE below for contact info, promo codes, shipping and stats. */

const STORE = {
  name: "E Plugg",
  // Leave a value empty ("") to hide it from the footer and contact page.
  email: "",
  phone: "",
  address: "",
  socials: { instagram: "", x: "", youtube: "", tiktok: "" },
  freeShippingOver: 150,
  flatShipping: 9.99, // charged under the free-shipping threshold — set your real rate
  promoCodes: { PLUGGSTUDENT: 0.10 }, // must match netlify/functions/checkout.js
  heroStats: [["7", "CATEGORIES"], ["TOP", "BRANDS"], ["SECURE", "CHECKOUT ON AMAZON"]],
  heroImage: "https://images.unsplash.com/photo-1594054763281-0946baaad462?crop=entropy&cs=srgb&fm=jpg&q=70&w=1600",
  trailImage: "https://images.unsplash.com/photo-1624243519828-52a0f2c88af3?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400",
  checkoutEndpoint: "/.netlify/functions/checkout",
  // Amazon Associates Store ID. Products with "amazon" set link to Amazon with this tag.
  amazonTag: "epluggstore-20",
};

/* Amazon link for a product: exact item if an ASIN is set, otherwise a search for the exact model. */
function amazonLink(p) {
  const a = p.amazon || {};
  const tag = encodeURIComponent(STORE.amazonTag);
  if (a.asin) return `https://www.amazon.com/dp/${encodeURIComponent(a.asin)}?tag=${tag}`;
  return `https://www.amazon.com/s?k=${encodeURIComponent(a.search || p.name)}&tag=${tag}`;
}
const isPartner = p => !!p.partner_url;
const priceHtml = (p, big) => p.amazon
  ? `<span class="${big ? "price-big-note" : "price-note"}">See price on Amazon</span>`
  : `${money(p.price)}${p.compare_at_price > p.price ? `<s>${money(p.compare_at_price)}</s>` : ""}`;

const TICKER = [
  "⚡ ELECTRIC SCOOTERS · E-BIKES · GADGETS",
  "TOP BRANDS: HIBOY · GOTRAX · JASION · HEYBIKE · JLAB",
  "SECURE CHECKOUT ON AMAZON",
];

const state = { products: [], categories: [], loaded: false };
const $ = (s, el = document) => el.querySelector(s);
const app = $("#app");

/* ---------- utils ---------- */
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => "$" + Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
const ICON = {
  arrow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  undo: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  support: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7H5v10h2M17 7h2v10h-2M21 10v4"/><path d="M13 7l-3 5h4l-3 5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l16 16M20 4L4 20"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.4A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.4a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15V9l5 3z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M16 3c.4 2.3 1.8 3.8 4 4v3c-1.5 0-2.9-.4-4-1.2V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3z"/></svg>',
};

/* ---------- cart ---------- */
const cart = {
  items() { return store.get("eplugg_cart", []); },
  save(items) { store.set("eplugg_cart", items); updateCartCount(); },
  add(id, qty = 1) {
    const items = this.items(); const line = items.find(i => i.id === id);
    if (line) line.qty += qty; else items.push({ id, qty });
    this.save(items);
  },
  setQty(id, qty) { this.save(this.items().map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0)); },
  clear() { this.save([]); },
  lines() {
    return this.items().map(i => ({ ...i, product: state.products.find(p => p.id === i.id) })).filter(l => l.product);
  },
};
function updateCartCount() {
  const n = cart.items().reduce((a, i) => a + i.qty, 0);
  $("#cartCount").textContent = n;
}
function totals(promoCode) {
  const lines = cart.lines();
  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const rate = STORE.promoCodes[(promoCode || "").toUpperCase()] || 0;
  const discount = Math.round(subtotal * rate * 100) / 100;
  const after = subtotal - discount;
  const shipping = lines.length === 0 ? 0 : (after >= STORE.freeShippingOver ? 0 : STORE.flatShipping);
  return { lines, subtotal, discount, shipping, total: after + shipping };
}

/* ---------- shared pieces ---------- */
const catBySlug = slug => state.categories.find(c => c.slug === slug);
const countIn = slug => state.products.filter(p => p.category === slug).length;

function emptyState(title = "New gear is charging up.", body = "Our catalog is being stocked by approved U.S. suppliers — check back soon.") {
  return `<div class="empty"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}
function productCard(p) {
  const img = (p.images && p.images[0]) || "";
  const off = !p.amazon && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;
  return `<a class="prod-card" href="#/product/${esc(p.slug)}">
    <div class="thumb">${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy">` : ""}${off ? `<span class="badge">-${off}%</span>` : p.new ? `<span class="badge">NEW</span>` : ""}</div>
    <div class="info"><span class="brand-line">${esc(p.brand || "")}</span><span class="name">${esc(p.name)}</span>
    <span class="price">${priceHtml(p)}</span></div></a>`;
}
function productGrid(list) {
  return list.length ? `<div class="prod-grid">${list.map(productCard).join("")}</div>` : emptyState();
}
function sectionHead(eyebrow, title, href) {
  return `<div class="section-head"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${href ? `<a class="view-all" href="${href}">View all ${ICON.arrow}</a>` : ""}</div>`;
}
function catCard(c, i) {
  const wide = i === 0 || i === 4;
  return `<a class="cat-card${wide ? " wide" : ""}" href="#/category/${c.slug}">
    <img src="${esc(c.image)}" alt="" loading="lazy">
    <div class="cat-label"><div class="count">${countIn(c.slug)} PRODUCT${countIn(c.slug) === 1 ? "" : "S"}</div><h3>${esc(c.name)}</h3></div></a>`;
}

/* ---------- pages ---------- */
function pageHome() {
  const P = state.products;
  const featured = P.filter(p => p.featured).slice(0, 8);
  const deals = P.filter(p => p.deal).slice(0, 8);
  const ownStock = P.some(p => !isPartner(p));
  const best = P.filter(p => p.best_seller).slice(0, 8);
  const fresh = P.filter(p => p.new).slice(0, 8);
  return `
  <section class="hero">
    <div class="hero-bg" style="background-image:url('${esc(STORE.heroImage)}')"></div>
    <div class="hero-inner wrap">
      <div class="hero-logo"><span class="brand-mark"></span><span class="brand-word"><b>E</b>PLUGG</span></div>
      <span class="pill-tag">THE ELECTRIC SUPERSTORE</span>
      <h1>Plug into the future of <span class="green">how you move.</span></h1>
      <p class="lead">Performance scooters, e-bikes, parts and the latest electronics — shipped across the contiguous US.</p>
      <div class="hero-ctas"><a class="btn btn-green" href="#/shop">Shop now ${ICON.arrow}</a><a class="btn btn-ghost" href="#/shop?deals=1">Today’s deals</a></div>
      <div class="hero-stats">${STORE.heroStats.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}</div>
    </div>
  </section>
  <section class="trust"><div class="wrap trust-grid">
    <div class="trust-item"><div class="trust-icon">${ICON.truck}</div><div><b>Fast delivery</b><small>Shipped by Amazon &amp; its sellers</small></div></div>
    <div class="trust-item"><div class="trust-icon">${ICON.undo}</div><div><b>Easy returns</b><small>Under Amazon’s return policy</small></div></div>
    <div class="trust-item"><div class="trust-icon">${ICON.shield}</div><div><b>Secure checkout</b><small>Pay on Amazon, safely</small></div></div>
    <div class="trust-item"><div class="trust-icon">${ICON.support}</div><div><b>Hand-picked gear</b><small>Riders helping riders</small></div></div>
  </div></section>
  <section class="section wrap">${sectionHead("Browse", "Shop by category", "#/shop")}
    <div class="cat-grid">${state.categories.map(catCard).join("")}</div></section>
  <section class="section wrap">${sectionHead("Hand-picked", "Featured gear", "#/shop")}${productGrid(featured)}</section>
  <section class="section wrap"><div class="deals">
    <p class="eyebrow" style="display:flex;gap:10px;align-items:center">${ICON.bolt} Top value</p>
    <h2>Best bang for the buck</h2>
    <div class="countdown"><a href="#/shop?deals=1">All picks →</a></div>
    ${productGrid(deals)}
  </div></section>
  <section class="section wrap">${sectionHead("Most loved", "Best sellers", "#/shop")}${productGrid(best)}</section>
  <section class="section wrap"><div class="banner"><img src="${esc(STORE.trailImage)}" alt="" loading="lazy">
    <div class="banner-body"><p class="eyebrow">Trail season</p><h2>E-bikes built to climb anything.</h2><a class="btn btn-green" href="#/category/electric-bikes">Shop e-bikes</a></div></div></section>
  ${ownStock ? `<section class="section wrap"><div class="promo">
    <svg class="promo-bolt" viewBox="0 0 24 24" fill="none" stroke="#04150A" stroke-width="2.2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>
    <p class="eyebrow">Students &amp; commuters</p><h2>Save 10% on your first ride.</h2>
    <div class="promo-row"><button class="code-chip" data-copy="PLUGGSTUDENT">PLUGGSTUDENT</button><a class="btn btn-dark" href="#/shop">Shop now</a></div>
  </div></section>` : ""}
  <section class="section wrap">${sectionHead("Just landed", "New arrivals", "#/shop?sort=new")}${productGrid(fresh)}</section>`;
}

function pageShop(params, fixedCat) {
  const cat = fixedCat || params.get("cat") || "";
  const q = (params.get("q") || "").trim().toLowerCase();
  const sort = params.get("sort") || "featured";
  const dealsOnly = params.get("deals") === "1";
  let list = state.products.filter(p =>
    (!cat || p.category === cat) &&
    (!dealsOnly || p.deal) &&
    (!q || [p.name, p.brand, p.short].join(" ").toLowerCase().includes(q)));
  const sorters = {
    featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
    new: (a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0),
    "price-asc": (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9),
    "price-desc": (a, b) => (b.price ?? -1) - (a.price ?? -1),
  };
  list = [...list].sort(sorters[sort] || sorters.featured);
  const c = catBySlug(cat);
  const base = fixedCat ? `#/category/${fixedCat}` : "#/shop";
  const link = (over) => {
    const p = new URLSearchParams(params); Object.entries(over).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    if (fixedCat) p.delete("cat"); const s = p.toString(); return base + (s ? "?" + s : "");
  };
  return `<div class="wrap">
    <div class="page-head"><p class="eyebrow">${dealsOnly ? "Flash deals" : c ? "Category" : "Shop"}</p>
      <h1>${dealsOnly ? "Today’s deals" : c ? esc(c.name) : "All products"}</h1>${c ? `<p class="muted">${esc(c.description)}</p>` : ""}</div>
    <div class="filters">
      <a class="chip ${!cat ? "on" : ""}" href="${fixedCat ? "#/shop" : link({ cat: "" })}">All</a>
      ${state.categories.map(x => `<a class="chip ${x.slug === cat ? "on" : ""}" href="#/category/${x.slug}">${esc(x.name)}</a>`).join("")}
      <a class="chip ${dealsOnly ? "on" : ""}" href="${link({ deals: dealsOnly ? "" : "1" })}">Deals</a>
    </div>
    <form class="toolbar" id="shopForm">
      <input class="field search" name="q" type="search" placeholder="Search products" value="${esc(params.get("q") || "")}">
      <select class="field" name="sort" aria-label="Sort">
        ${[["featured", "Featured"], ["new", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]]
          .map(([v, l]) => `<option value="${v}" ${v === sort ? "selected" : ""}>${l}</option>`).join("")}
      </select>
    </form>
    <p class="muted" style="margin:0 0 14px">${list.length} product${list.length === 1 ? "" : "s"}</p>
    ${productGrid(list)}
  </div>`;
}

function pageProduct(slug) {
  const p = state.products.find(x => x.slug === slug || x.id === slug);
  if (!p) return pageNotFound();
  const c = catBySlug(p.category);
  const imgs = p.images && p.images.length ? p.images : [];
  const off = p.compare_at_price > p.price;
  const out = p.stock === 0;
  const related = state.products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  return `<div class="wrap">
    <div class="crumbs"><a href="#/shop">Shop</a>${c ? ` / <a href="#/category/${c.slug}">${esc(c.name)}</a>` : ""}</div>
    <div class="pdp">
      <div>
        <div class="gallery-main">${imgs[0] ? `<img id="mainImg" src="${esc(imgs[0])}" alt="${esc(p.name)}">` : ""}</div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button class="${i ? "" : "on"}" data-img="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div>
        <p class="eyebrow">${esc(p.brand || "")}</p>
        <h1>${esc(p.name)}</h1>
        <div class="price">${priceHtml(p, true)}</div>
        ${p.short ? `<p class="muted" style="font-size:18px">${esc(p.short)}</p>` : ""}
        ${isPartner(p) ? "" : `<p class="muted" style="font-size:15px">${out ? "Out of stock" : p.price >= STORE.freeShippingOver ? "Ships free to the contiguous US" : `Free shipping on orders over $${STORE.freeShippingOver}`}</p>`}
        ${p.partner_url ? `
          <a class="btn btn-green btn-block" href="${esc(p.partner_url)}" target="_blank" rel="noopener sponsored nofollow">${p.amazon ? "Check price on Amazon" : "Buy from partner"} ${ICON.arrow}</a>
          <p class="muted" style="font-size:13px">${p.amazon ? "Price, shipping and returns are set by Amazon and its sellers. As an Amazon Associate, E Plugg earns from qualifying purchases." : "Sold by a partner retailer. We may earn a commission."}</p>` : `
          <div style="display:flex;gap:12px;align-items:center;margin:18px 0">
            <div class="qty"><button data-q="-1" aria-label="Less">−</button><span id="qty">1</span><button data-q="1" aria-label="More">+</button></div>
            <button class="btn btn-green" style="flex:1" id="addBtn" data-id="${esc(p.id)}" ${out ? "disabled" : ""}>${out ? "Sold out" : "Add to cart"}</button>
          </div>`}
        ${p.description ? `<div class="prose" style="padding:10px 0">${esc(p.description).split(/\n\s*\n/).map(t => `<p>${t}</p>`).join("")}</div>` : ""}
        ${p.specs && Object.keys(p.specs).length ? `<h3 style="margin-top:12px">Specs</h3><table class="specs">${Object.entries(p.specs).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>` : ""}
      </div>
    </div>
    ${related.length ? `<section class="section">${sectionHead("You might like", "More like this")}${productGrid(related)}</section>` : ""}
  </div>`;
}

function pageCart() {
  const promo = store.get("eplugg_promo", "");
  const t = totals(promo);
  if (!t.lines.length) return `<div class="wrap"><div class="page-head"><h1>Your cart</h1></div>${emptyState("Your cart is empty.", "Find something electric to plug into.")}<p style="margin-top:20px"><a class="btn btn-green" href="#/shop">Shop now</a></p></div>`;
  const toFree = STORE.freeShippingOver - (t.subtotal - t.discount);
  return `<div class="wrap"><div class="page-head"><h1>Your cart</h1></div>
  <div class="cart-layout"><div>
    ${t.lines.map(l => `<div class="cart-line">
      ${l.product.images && l.product.images[0] ? `<img src="${esc(l.product.images[0])}" alt="">` : `<div style="width:84px;height:84px;border-radius:14px;background:#0A0E15"></div>`}
      <div><a href="#/product/${esc(l.product.slug)}" style="font-weight:600">${esc(l.product.name)}</a>
        <div class="price" style="font-size:15px">${money(l.product.price)}</div>
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
          <div class="qty"><button data-line="${esc(l.id)}" data-d="-1" aria-label="Less">−</button><span>${l.qty}</span><button data-line="${esc(l.id)}" data-d="1" aria-label="More">+</button></div>
          <button class="link-btn" data-remove="${esc(l.id)}">Remove</button></div></div>
      <div class="price">${money(l.product.price * l.qty)}</div></div>`).join("")}
  </div>
  <div class="summary" style="margin-top:20px">
    <form class="promo-input" id="promoForm"><input class="field" name="code" placeholder="Promo code" value="${esc(promo)}"><button class="btn btn-ghost" style="padding:10px 16px;font-size:16px">Apply</button></form>
    <div class="row"><span class="muted">Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="row green"><span>Discount (${esc(promo.toUpperCase())})</span><span>−${money(t.discount)}</span></div>` : ""}
    <div class="row"><span class="muted">Shipping</span><span>${t.shipping ? money(t.shipping) : "Free"}</span></div>
    ${toFree > 0 ? `<p class="muted" style="margin:0;font-size:14px">Add ${money(toFree)} more for free shipping.</p>` : ""}
    <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
    <button class="btn btn-green btn-block" id="checkoutBtn">Secure checkout ${ICON.arrow}</button>
    <p class="muted" style="margin:0;font-size:13px;text-align:center">Payments processed by Stripe. Shipping to the contiguous US only.</p>
  </div></div></div>`;
}

function pageSuccess() {
  cart.clear(); store.set("eplugg_promo", "");
  return `<div class="wrap prose"><p class="eyebrow">Order placed</p><h1>You’re plugged in. ⚡</h1>
    <p>Thanks for your order. A receipt is on its way to your email, and we’ll send tracking as soon as it ships.</p>
    <p><a href="#/shop">Keep shopping</a></p></div>`;
}

function pageAccount() {
  return `<div class="wrap prose"><p class="eyebrow">Account</p><h1>Your account</h1>
    <div class="notice">Customer accounts are coming soon. You can check out as a guest — your receipt and tracking arrive by email.</div>
    <h2>Need something?</h2>
    <ul><li><a href="#/page/track">Track your order</a></li><li><a href="#/page/returns">Start a return</a></li><li><a href="#/page/contact">Contact support</a></li></ul></div>`;
}

function contactBlock() {
  return [
    STORE.phone && `<div>${ICON.phone}<a href="tel:${esc(STORE.phone.replace(/[^+\d]/g, ""))}">${esc(STORE.phone)}</a></div>`,
    STORE.email && `<div>${ICON.mail}<a href="mailto:${esc(STORE.email)}">${esc(STORE.email)}</a></div>`,
    STORE.address && `<div>${ICON.pin}<span>${esc(STORE.address)}</span></div>`,
  ].filter(Boolean).join("");
}

const PAGES = {
  contact: () => `<p class="eyebrow">Support</p><h1>Contact us</h1>
    <p>Questions about an order, a product or a return? Send us a message and we’ll get back to you within one business day.</p>
    ${contactBlock() ? `<div class="contact-lines">${contactBlock()}</div>` : ""}
    <form class="form-grid" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" id="contactForm">
      <input type="hidden" name="form-name" value="contact"><p hidden><input name="bot-field"></p>
      <label>Name<input class="field" name="name" required></label>
      <label>Email<input class="field" type="email" name="email" required></label>
      <label>Order number (optional)<input class="field" name="order"></label>
      <label>Message<textarea class="field" name="message" rows="5" required></textarea></label>
      <button class="btn btn-green">Send message</button></form>`,
  faqs: () => `<p class="eyebrow">Support</p><h1>FAQs</h1><div class="faq">
    ${[
      ["How does buying work?", "Products on E Plugg are sold and shipped by Amazon and its sellers. Tap “Check price on Amazon” on any product to see the current price and check out on Amazon. Shipping, returns and order support for those items are handled by Amazon. As an Amazon Associate, E Plugg earns from qualifying purchases at no extra cost to you."],
      ["Where do you ship?", "We ship to all addresses in the contiguous United States. We don’t currently ship to Alaska, Hawaii, U.S. territories or internationally."],
      ["How much is shipping?", `Shipping is free on orders over $${STORE.freeShippingOver}. Smaller orders ship at a flat rate shown in your cart before you pay.`],
      ["How long does delivery take?", "Most in-stock items ship within 1–3 business days. Large items like e-bikes may ship by freight and take a few extra days."],
      ["What’s your return policy?", "Unused items in original packaging can be returned within 30 days of delivery. See our Returns & refunds page for details."],
      ["How do I use the student discount?", "Enter PLUGGSTUDENT in the promo code box in your cart to save 10%."],
      ["Are some products sold by partners?", "Yes. Some listings link to partner retailers, who handle that order directly. Those pages are clearly marked."],
    ].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`,
  shipping: () => `<p class="eyebrow">Support</p><h1>Shipping information</h1>
    <p>We ship to the contiguous United States (the lower 48 states and Washington, D.C.).</p>
    <h2>Rates</h2><p>Free standard shipping on orders over $${STORE.freeShippingOver}. Orders under that ship for a flat ${money(STORE.flatShipping)}.</p>
    <h2>Processing</h2><p>In-stock orders usually leave our suppliers within 1–3 business days. You’ll get tracking by email when your order ships.</p>
    <h2>Large items</h2><p>E-bikes and scooters may ship by freight. Inspect the box on delivery and note any visible damage with the carrier.</p>`,
  returns: () => `<p class="eyebrow">Support</p><h1>Returns &amp; refunds</h1>
    <p>You can return most items within 30 days of delivery if they’re unused and in their original packaging.</p>
    <h2>How to start a return</h2><p>Use the <a href="#/page/contact">contact form</a> with your order number and the reason for your return. We’ll reply with instructions.</p>
    <h2>Refunds</h2><p>Once your return is received and inspected, we refund your original payment method. Refunds usually post within 5–10 business days.</p>
    <h2>Exceptions</h2><p>Items that have been ridden, damaged, or are missing parts may not be eligible. Items bought from partner retailers follow that retailer’s policy.</p>`,
  warranty: () => `<p class="eyebrow">Support</p><h1>Warranty</h1>
    <p>Products are covered by their manufacturer’s warranty. Warranty length and coverage are listed on each product page where available.</p>
    <p>To make a claim, <a href="#/page/contact">contact us</a> with your order number, a description of the issue, and photos or video. We’ll help you work with the manufacturer.</p>`,
  track: () => `<p class="eyebrow">Support</p><h1>Track your order</h1>
    <p>When your order ships you’ll get an email with a tracking link from the carrier. That link is the fastest way to see where your package is.</p>
    <p>Can’t find it? <a href="#/page/contact">Contact us</a> with your order number and we’ll look it up.</p>`,
  about: () => `<p class="eyebrow">Company</p><h1>About E Plugg</h1>
    <p>E Plugg is an online store for electric scooters, e-bikes, mobility accessories, electronics and gadgets, shipping across the contiguous United States.</p>
    <p>We work with approved U.S. suppliers and partner retailers to bring next-gen electronics and high-performance electric mobility to riders, students and commuters.</p>`,
  privacy: () => `<p class="eyebrow">Company</p><h1>Privacy policy</h1>
    <p><em>Template — have this reviewed before launch.</em></p>
    <h2>What we collect</h2><p>When you place an order or contact us, we collect your name, email, shipping address and order details. Payments are processed by Stripe; we never see or store your full card number.</p>
    <h2>How we use it</h2><p>To fulfill orders, send receipts and tracking, answer your questions, and, if you sign up, send our newsletter. You can unsubscribe at any time.</p>
    <h2>Sharing</h2><p>We share only what’s needed with suppliers, shipping carriers and payment processors to complete your order. We don’t sell your personal information.</p>
    <h2>Your rights</h2><p>California residents and others may request access to or deletion of their data by contacting us.</p>`,
  terms: () => `<p class="eyebrow">Company</p><h1>Terms &amp; conditions</h1>
    <p><em>Template — have this reviewed before launch.</em></p>
    <h2>Orders</h2><p>All prices are in U.S. dollars. We may cancel an order if an item is unavailable or priced incorrectly, and we’ll refund any payment in full.</p>
    <h2>Shipping</h2><p>We ship only to the contiguous United States. Risk of loss passes to you on delivery.</p>
    <h2>Partner products</h2><p>Some products are sold by partner retailers. Those purchases are governed by the partner’s terms, and we may earn a commission.</p>
    <h2>Safety</h2><p>Electric scooters and e-bikes can be dangerous. Always wear a helmet, follow local laws and the manufacturer’s instructions.</p>`,
};
function pageInfo(name) {
  const fn = PAGES[name]; if (!fn) return pageNotFound();
  return `<div class="wrap prose">${fn()}</div>`;
}
function pageNotFound() {
  return `<div class="wrap">${emptyState("That page is unplugged.", "We couldn’t find what you were looking for.")}<p style="margin-top:20px"><a class="btn btn-green" href="#/">Back home</a></p></div>`;
}

/* ---------- chrome: ticker, drawer, footer ---------- */
function renderChrome() {
  const run = `<span>${TICKER.map(t => `<span>${esc(t)}</span><span>·</span>`).join("")}</span>`;
  $("#ticker").innerHTML = run + run;
  const catLinks = state.categories.map(c => `<a href="#/category/${c.slug}">${esc(c.name)}</a>`).join("");
  $("#deskNav").innerHTML = `<a href="#/shop">Shop</a><a href="#/category/electric-scooters">Scooters</a><a href="#/category/electric-bikes">E-Bikes</a><a href="#/category/electronics">Electronics</a><a href="#/shop?deals=1">Deals</a>`;
  $("#drawer").innerHTML = `<a href="#/" class="brand" style="padding:0"><span class="brand-mark"></span><span class="brand-word"><b>E</b>PLUGG</span></a>
    <h4 class="eyebrow">Shop</h4><a href="#/shop">All products</a>${catLinks}<a href="#/shop?deals=1">Deals</a>
    <h4 class="eyebrow">Help</h4><a href="#/page/contact">Contact us</a><a href="#/page/faqs">FAQs</a><a href="#/page/shipping">Shipping</a><a href="#/page/returns">Returns</a>`;
  const socials = Object.entries(STORE.socials).filter(([, url]) => url)
    .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${k}">${ICON[k]}</a>`).join("");
  $("#footer").innerHTML = `<div class="wrap">
    <a href="#/" class="brand" style="gap:14px"><span class="brand-mark"></span><span class="brand-word"><b>E</b>PLUGG</span></a>
    <p class="tagline">Next-gen electronics &amp; high-performance electric mobility</p>
    <form class="news" id="newsForm" name="newsletter" method="POST" data-netlify="true">
      <input type="hidden" name="form-name" value="newsletter">
      <input type="email" name="email" required placeholder="Email for drops &amp; deals" aria-label="Email">
      <button class="btn btn-green">Join</button></form>
    ${socials ? `<div class="socials">${socials}</div>` : ""}
    <div class="foot-cols">
      <div class="foot-col"><h4>SHOP</h4><a href="#/shop">All products</a>${catLinks}<a href="#/shop?deals=1">Deals</a></div>
      <div class="foot-col"><h4>SUPPORT</h4><a href="#/page/contact">Contact us</a><a href="#/page/faqs">FAQs</a><a href="#/page/shipping">Shipping information</a><a href="#/page/returns">Returns &amp; refunds</a><a href="#/page/warranty">Warranty</a><a href="#/page/track">Track your order</a></div>
      <div class="foot-col"><h4>COMPANY</h4><a href="#/page/about">About us</a><a href="#/page/privacy">Privacy policy</a><a href="#/page/terms">Terms &amp; conditions</a></div>
    </div>
    ${contactBlock() ? `<div class="contact-lines">${contactBlock()}</div>` : `<div style="height:30px"></div>`}
    <div class="legal">© ${new Date().getFullYear()} E Plugg. All prices in USD · Shipping to the contiguous United States. Some products are sold by partner retailers; we may earn a commission. As an Amazon Associate, E Plugg earns from qualifying purchases.
      <div class="pay-badges"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>APPLE PAY</span><span>G PAY</span><span class="stripe">STRIPE SECURE</span></div></div>
  </div>`;
}
function toggleDrawer(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawerBackdrop").classList.toggle("open", open);
}

/* ---------- countdown to local midnight ---------- */
function tickCountdown() {
  const h = $("#cdH"); if (!h) return;
  const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0);
  let s = Math.max(0, Math.floor((end - now) / 1000));
  const pad = n => String(n).padStart(2, "0");
  h.textContent = pad(Math.floor(s / 3600)); $("#cdM").textContent = pad(Math.floor(s % 3600 / 60)); $("#cdS").textContent = pad(s % 60);
}
setInterval(tickCountdown, 1000);

/* ---------- router ---------- */
function route() {
  toggleDrawer(false);
  const hash = location.hash.replace(/^#/, "") || "/";
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query || "");
  const parts = path.split("/").filter(Boolean);
  let html, tab = "";
  if (!state.loaded) html = `<div class="wrap muted" style="padding:60px 16px">Loading…</div>`;
  else if (!parts.length) { html = pageHome(); tab = "home"; }
  else if (parts[0] === "shop") { html = pageShop(params); tab = "shop"; }
  else if (parts[0] === "category") { html = catBySlug(parts[1]) ? pageShop(params, parts[1]) : pageNotFound(); tab = "shop"; }
  else if (parts[0] === "product") { html = pageProduct(decodeURIComponent(parts[1] || "")); tab = "shop"; }
  else if (parts[0] === "cart") { html = pageCart(); tab = "cart"; }
  else if (parts[0] === "success") html = pageSuccess();
  else if (parts[0] === "account") { html = pageAccount(); tab = "account"; }
  else if (parts[0] === "page") html = pageInfo(parts[1]);
  else html = pageNotFound();
  app.innerHTML = html;
  document.querySelectorAll("#bottomNav a").forEach(a => a.classList.toggle("active", a.dataset.tab === tab));
  tickCountdown();
  if (!hash.includes("?") || parts[0] !== "shop") window.scrollTo(0, 0);
}

/* ---------- events ---------- */
document.addEventListener("click", async e => {
  const t = e.target.closest("button, a"); if (!t) return;
  if (t.id === "menuBtn") return toggleDrawer(true);
  if (t.dataset.copy) {
    try { await navigator.clipboard.writeText(t.dataset.copy); toast("Code copied — apply it in your cart"); } catch { toast("Use code " + t.dataset.copy + " in your cart"); }
    store.set("eplugg_promo", t.dataset.copy); return;
  }
  if (t.dataset.img) { $("#mainImg").src = t.dataset.img; document.querySelectorAll(".thumbs button").forEach(b => b.classList.toggle("on", b === t)); return; }
  if (t.dataset.q) { const el = $("#qty"); el.textContent = Math.max(1, Math.min(10, +el.textContent + +t.dataset.q)); return; }
  if (t.id === "addBtn") { cart.add(t.dataset.id, +$("#qty").textContent); toast("Added to cart"); return; }
  if (t.dataset.line) {
    const line = cart.items().find(i => i.id === t.dataset.line);
    if (line) cart.setQty(line.id, Math.min(10, line.qty + +t.dataset.d)); return route();
  }
  if (t.dataset.remove) { cart.setQty(t.dataset.remove, 0); return route(); }
  if (t.id === "checkoutBtn") return startCheckout(t);
});
$("#drawerBackdrop").addEventListener("click", () => toggleDrawer(false));

document.addEventListener("submit", async e => {
  const f = e.target;
  if (f.id === "promoForm") {
    e.preventDefault(); const code = f.code.value.trim().toUpperCase();
    if (!code) { store.set("eplugg_promo", ""); return route(); }
    if (STORE.promoCodes[code]) { store.set("eplugg_promo", code); toast("Promo applied"); } else toast("That code isn’t valid");
    return route();
  }
  if (f.id === "shopForm") {
    e.preventDefault();
    const [path, query] = location.hash.slice(1).split("?"); const p = new URLSearchParams(query || "");
    f.q.value ? p.set("q", f.q.value) : p.delete("q"); p.set("sort", f.sort.value);
    location.hash = path + "?" + p.toString(); return;
  }
  if (f.id === "newsForm" || f.id === "contactForm") {
    e.preventDefault();
    try {
      const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(f)).toString() });
      if (!res.ok) throw new Error();
      f.reset(); toast(f.id === "newsForm" ? "You’re on the list ⚡" : "Message sent — we’ll be in touch");
    } catch { toast("Couldn’t send right now — please try again"); }
  }
});
document.addEventListener("change", e => { if (e.target.form && e.target.form.id === "shopForm") e.target.form.requestSubmit(); });

async function startCheckout(btn) {
  btn.disabled = true; btn.textContent = "Starting checkout…";
  try {
    const res = await fetch(STORE.checkoutEndpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.items(), promo: store.get("eplugg_promo", "") }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Checkout isn’t available yet.");
    location.href = data.url;
  } catch (err) {
    toast(err.message || "Checkout isn’t available yet."); btn.disabled = false; btn.innerHTML = "Secure checkout " + ICON.arrow;
  }
}

/* ---------- boot ---------- */
window.addEventListener("hashchange", route);
(async function boot() {
  route();
  try {
    const [cats, prods] = await Promise.all([
      fetch("data/categories.json").then(r => r.json()),
      fetch("data/products.json").then(r => r.json()),
    ]);
    state.categories = cats;
    state.products = (Array.isArray(prods) ? prods : [])
      .map(p => p.amazon ? { ...p, partner_url: amazonLink(p) } : p);
  } catch (err) { console.error("Couldn’t load catalog", err); }
  state.loaded = true;
  renderChrome(); updateCartCount(); route();
})();
