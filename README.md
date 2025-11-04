<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Takealot Seller Product Finder

React + Vite application that looks up the live catalogue for a Takealot seller. Provide a seller ID and the app will return their top listings directly from Takealot's public search API. A Vercel serverless function (`api/seller-products.ts`) handles the API call so the browser never talks to Takealot directly (avoiding CORS issues).

## Local Development

**Prerequisites**
- Node.js 20+
- [Vercel CLI](https://vercel.com/docs/cli) (for running the serverless function locally)

```bash
npm install
```

1. Duplicate `.env.local` if you want to pin a different API host (optional):  
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```
   Without this value the app defaults to `/api`, which works with the proxy configuration described below.
2. In one terminal run the Vercel dev server so the serverless API is available on port 3000:  
   ```bash
   vercel dev
   ```
3. In a second terminal run the Vite dev server (port 5173) which proxies `/api/*` to the Vercel instance:  
   ```bash
- `npm run dev` - start the Vite dev server (expects `vercel dev` in another terminal).
   ```
4. Open the UI at [http://localhost:5173](http://localhost:5173).

## Available Scripts

- `npm run dev` - start the Vite dev server (expects `vercel dev` in another terminal).
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
