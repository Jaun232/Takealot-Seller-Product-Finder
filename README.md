<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Takealot Seller Product Finder

React + Vite application that looks up the live catalogue for a Takealot seller. Provide a seller ID and the app will return their top listings directly from Takealot's public search API. A Vercel serverless function (`api/seller-products.ts`) handles the API call so the browser never talks to Takealot directly (avoiding CORS issues).

## Local Development

**Prerequisites**
- Node.js 20+
- Tailwind CLI (already part of the repo)

### One-time setup

```bash
npm install
npx playwright install chromium
```

### Every time you want to work locally

Use separate terminals for each command.

#### Terminal 1 – local API (port 3000)
```bash
npm run dev:api
```

#### Terminal 2 – Vite front-end (port 5173)
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to use the UI.

### Optional: expose your local API via Tailscale Funnel
If you want the Vercel deployment to use your local scraper:

1. Keep `npm run dev:api` running.
2. In another terminal, run:
   ```bash
   tailscale funnel 3000
   ```
   Copy the public URL that Funnel prints (e.g. `https://yourdevice-yourtailnet.ts.net`).
3. In your Vercel project, set `VITE_API_BASE_URL` to that URL and redeploy.

## Available Scripts

- `npm run dev:api` - start the local serverless API (Playwright scraper) on port 3000.
- `npm run dev` - start the Vite dev server (connects to the API running at port 3000).
- `npm run build` - production build (used by Vercel during deployment).
- `npm run preview` - preview the production build locally.

## Deploying to Vercel

The repository is ready for a [Vercel](https://vercel.com/) deployment:

1. Push the project to your Git provider and import it via the Vercel dashboard **or** run `vercel deploy --prod`.
2. No extra configuration is required - Vercel detects Vite, builds the project, and exposes the serverless function at `/api/seller-products`.
3. Optional: set `VITE_API_BASE_URL` in the Vercel dashboard if you want the client to call a different origin. Leaving it empty uses the same origin as the deployed site.

## Environment Variables

| Name                | Description                                                                                              | Default |
|---------------------|----------------------------------------------------------------------------------------------------------|---------|
| `VITE_API_BASE_URL` | Optional absolute origin for API calls (e.g. `https://takealot-seller-product-finder.vercel.app`). When unset the client uses relative `/api` calls and relies on the Vite proxy in development. | _(empty)_ |

## Styling

Tailwind CSS is compiled locally via PostCSS (see `index.css`, `tailwind.config.ts`, and `postcss.config.cjs`). No CDN assets are required in production builds.
