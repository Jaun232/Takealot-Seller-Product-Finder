# Takealot Seller Product Finder

Takealot Seller Product Finder is a React + Vite application backed by Playwright-powered Vercel serverless functions. It lets you:

- Look up a seller's full catalogue by seller ID.
- Find the “Best Price” and “Fastest Delivery” cards for any product by description, PLID, or full Takealot URL.
- See seller names, storefront links, prices, delivery promises, and location availability for each highlighted offer.

The browser never contacts Takealot directly; all scraping runs server-side (or on your local dev proxy) so we stay within CORS rules and can be polite with request pacing.

---

## Architecture Overview

```
React (Vite) UI
    ├─ /api/seller-products  ─→ Playwright → https://www.takealot.com/seller?sellers=...
    └─ /api/product-offers   ─→ Playwright → search+pdp → offer widgets
```

- **Front-end**: TypeScript + React 19 via Vite. All state lives inside components (`App.tsx` + children). No global state libraries.
- **Serverless API**: Vercel functions in `api/`. Each handler uses Playwright with @sparticuz/chromium when running serverless, and stock Chromium when running locally.
- **Browser pooling**: `api/_lib/browser.ts` exposes a singleton Playwright browser so each request only creates/closes a *context* + *page* (reduces load on Takealot and speeds up our code).
- **Product-offer scraper** (`api/product-offers.ts`):
  - Accepts descriptions, PLIDs, or full URLs. If only a description is provided, the scraper searches `takealot.com/search?query=` and scans multiple pages until it finds a close match by slug/title.
  - Opens the product PDP, waits for `[data-ref="offer-link"]` cards, and iterates through each card. While iterating it clicks/toggles the card so the DOM exposes the current seller (“Sold by ...”).
  - Extracts price, list price, seller name/link, delivery promise, and location pills. The results are cached in-memory (LRU, 60‑second TTL) keyed by product URL/description to avoid re-scraping the same PDP repeatedly.
- **Seller catalogue scraper** (`api/seller-products.ts`): Loads `https://www.takealot.com/seller?sellers=<id>` and extracts unique product cards (PLID, name, price, image, brand).
- **Dev proxy** (`dev-api.ts`): Lightweight Node HTTP server that mimics Vercel’s request/response objects so `npm run dev:api` can serve both endpoints locally.
- **Optional Tailscale funnel**: A common workflow is to run `npm run dev:api`, expose port 3000 via `tailscale funnel 3000`, and set `VITE_API_BASE_URL` in Vercel so the live UI calls your local scraper.

---

## Local Development

### Prerequisites
- Node.js 20+
- [Vercel CLI](https://vercel.com/docs/cli) (for deploying or running `vercel dev`)
- Optional: [Tailscale](https://tailscale.com/) if you want to expose your local API to production

### Install dependencies
```bash
npm install
```

### Install Playwright Chromium (one time)
```bash
npx playwright install chromium
```

### Everyday workflow
Use two terminals:

#### Terminal 1 – local API (port 3000)
```bash
npm run dev:api
```
This starts `dev-api.ts`, which serves both `/api/seller-products` and `/api/product-offers` using the same code Vercel runs.

#### Terminal 2 – Vite front-end (port 5173)
```bash
npm run dev
```
Vite proxies `/api/*` to http://localhost:3000 so the UI can hit the local API seamlessly. Open http://localhost:5173 to use the app.

### Optional: expose your local API via Tailscale Funnel
If you want the deployed UI to hit your own scraper:
1. Keep `npm run dev:api` running.
2. Run `tailscale funnel 3000` and copy the printed URL (e.g. `https://desktop-xxxx.ts.net`).
3. In Vercel Project Settings set `VITE_API_BASE_URL` to that URL and redeploy. Every production API call now flows through your machine.

### Performance & politeness
- Because contexts are much cheaper than launching browsers, the API reuses a single Playwright instance under the hood.
- Product-offer responses are cached in-memory for 60 seconds to avoid re-hitting Takealot for identical queries.
- If you’re scripting large batches, pace requests (1–2 seconds apart) to stay friendly to Takealot’s infrastructure.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start the local serverless API (Playwright scraper) on port 3000. |
| `npm run dev` | Start the Vite dev server on port 5173 (proxies to 3000). |
| `npm run build` | Production build (used by Vercel). |
| `npm run preview` | Preview the production build locally. |
| `vercel deploy --prod --yes` | Deploy the latest commit to Vercel production. |

---

## Deploying to Vercel

1. Push your changes to GitHub (or any Git provider) and import the repo via Vercel **or** run `vercel deploy --prod` locally.
2. No extra config is needed; Vercel detects Vite and builds the UI + serverless functions automatically.
3. Optional: set `VITE_API_BASE_URL` via Vercel env vars if you want the production UI to hit a different origin (e.g., your Tailscale funnel). Otherwise it defaults to same-origin `/api` calls.

Inspect and logs:
- Latest deploy dashboard: `vercel.com/<team>/<project>/<deployment-id>`
- Logs: `vercel logs takealot-seller-product-finder --prod`

---

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `VITE_API_BASE_URL` | Optional absolute origin for API calls (e.g., `https://desktop-xxxx.ts.net`). Leave empty to use same-origin `/api` (both locally and on Vercel). | _(empty)_ |

---

## Styling

Tailwind CSS is compiled via PostCSS (see `index.css`, `tailwind.config.ts`, `postcss.config.cjs`). No CDN assets are required for production builds.

---

## Technical Deep Dive

### Serverless code
- `api/_lib/browser.ts`: Provides `getBrowser()` which lazily launches Playwright once, reuses it, and recreates it if the browser disconnects.
- `api/product-offers.ts`:
  - Input parsing (description vs PLID vs URL).
  - Multi-page Takealot search scanning + slug/title matching.
  - PDP scraping: extracts prices, list prices, seller names/links, delivery text, location chips, etc.
  - Offer toggling: programmatically clicks each `[data-ref="offer-link"]` card so the “Sold by …” text updates in the DOM, then captures that seller info.
  - In-memory cache (TTL 60s, max 32 entries) keyed by product URL or normalized description.
  - CORS headers via `withCors`, friendly error responses, and fallback messages when no offer cards exist.
- `api/seller-products.ts`: Scrapes seller catalog pages, deduplicates products by URL, normalizes prices/images, and responds with the full array.

### Client code
- `App.tsx` orchestrates both seller and product search flows, handles spinners/empty states, and manages the in-memory catalogue filter.
- `components/ProductOfferHighlights.tsx` renders each offer card plus seller details and storefront links.
- `services/takealotService.ts` centralizes API calls (adds query params, handles JSON parsing, and exposes the new product-offer params).

### dev-api.ts
- A tiny Node HTTP server that routes `/api/seller-products` and `/api/product-offers` to the same handlers Vercel uses. Needed for fast local dev and for tunneling via Tailscale.

---

## Extending the project
If you need additional scraping features or API endpoints, follow the existing pattern:
1. Add a new handler under `api/` (reuse `getBrowser()`, add caching if it makes sense, expose consistent JSON).
2. Update `dev-api.ts` to route to the new handler so `npm run dev:api` serves it locally.
3. Add TypeScript types in `types.ts`, client helpers in `services/`, and UI components under `components/`.
4. Update the README to document new behaviour.

This app is intentionally lightweight but battle-tested for daily use. Keep the scraper polite, cache aggressively when possible, and you can build additional insights on top of Takealot’s public catalogue without overwhelming their infrastructure.
