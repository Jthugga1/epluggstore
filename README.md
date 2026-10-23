# E Plugg storefront

Your own copy of the E Plugg store. No Emergent, no monthly fee. It's plain HTML/CSS/JS with one small serverless function for Stripe checkout. It runs on Netlify's free plan.

## What's in here

| Path | What it is |
|---|---|
| `index.html` | Page shell (header, bottom nav, footer slots) |
| `assets/styles.css` | All styling (dark + neon green theme) |
| `assets/app.js` | Pages, cart, routing. **Edit the `STORE` block at the top** for contact info, socials, shipping rate, promo codes |
| `data/categories.json` | The 7 categories and their images |
| `data/products.json` | Your products (starts empty) |
| `products.example.json` | One sample product showing every field |
| `netlify/functions/checkout.js` | Creates the Stripe checkout page with prices checked on the server |

## Adding products

Copy the sample from `products.example.json` into `data/products.json` and fill it in:

- `id`: unique, never change it once orders exist
- `slug`: the web address, e.g. `voltrider-x10`
- `category`: one of `electric-scooters`, `electric-bikes`, `folding-e-bikes`, `commuter-e-bikes`, `mobility-accessories`, `electronics`, `gadgets`
- `price` / `compare_at_price`: a compare price higher than the price shows a % off badge and puts the item in Deals
- `featured`, `best_seller`, `new`, `deal`: control which homepage rows the product appears in
- `stock`: set to `0` to show "Sold out"
- `partner_url`: for affiliate items. Shows a "Buy from partner" button instead of add-to-cart

Redeploy after editing and the product appears everywhere.

## Going live on Netlify

1. Deploy this folder to Netlify (drag-and-drop, Git, or ask Claude to deploy it).
2. In **Site configuration → Environment variables** add:
   - `STRIPE_SECRET_KEY`: from Stripe Dashboard → Developers → API keys. Use `sk_test_…` first, then `sk_live_…`
   - `SHIPPING_FLAT_CENTS` (optional, default `999` = $9.99)
   - `FREE_SHIPPING_OVER` (optional, default `150`)
3. Redeploy. Checkout now opens a Stripe-hosted payment page (cards, Apple Pay, Google Pay).
4. Newsletter signups and contact messages appear in Netlify → **Forms**. Turn on email notifications there.

## Promo codes

`PLUGGSTUDENT` = 10% off. To add or change codes, edit both `STORE.promoCodes` in `assets/app.js` and `PROMO_CODES` in `netlify/functions/checkout.js`. The server copy is the one that actually charges.

## Before launch

- Fill in `STORE.email`, `phone`, `address` and `socials`. Empty values are hidden.
- Set your real flat shipping rate.
- Have the Privacy and Terms pages (marked "Template") reviewed.
