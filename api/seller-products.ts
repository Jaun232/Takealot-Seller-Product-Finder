import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBrowser } from './_lib/browser';
import { withCors } from './_lib/http';

type ScrapedProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  sellerId: string;
  brand?: string;
};

const TAKEALOT_SELLER_BASE = 'https://www.takealot.com/seller?sellers=';

function parsePrice(priceText: string | null | undefined): number | null {
  if (!priceText) return null;
  const match = priceText.match(/R\s*([\d\s.,]+)/i);
  if (!match) return null;
  const normalized = match[1].replace(/[\s,]/g, '');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

async function scrapeSellerCatalogue(sellerId: string): Promise<ScrapedProduct[]> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  try {
    const page = await context.newPage();
    await page.goto(`${TAKEALOT_SELLER_BASE}${sellerId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for product cards to hydrate (if they exist)
    await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => undefined);

    const scraped = await page.evaluate(
      ({ sellerId: sId }) => {
        const cards = Array.from(document.querySelectorAll<HTMLElement>('.product-card'));
        const seen = new Map<string, ScrapedProduct>();

        for (const card of cards) {
          const linkEl = card.querySelector<HTMLAnchorElement>('a[href*="/PLID"]');
          if (!linkEl) continue;

          const href = linkEl.href;
          if (seen.has(href)) continue;

          const titleEl = card.querySelector<HTMLElement>('.product-card-module_product-title_16xh8');
          const priceEl = card.querySelector<HTMLElement>('.product-card-price-module_price_westP');
          const imageEl = card.querySelector<HTMLImageElement>('img');
          const brandEl = card.querySelector<HTMLElement>('.product-card-module_product-title-wrapper_JD-kc span');

          const priceText = priceEl?.textContent ?? '';
          const match = priceText.match(/R\s*([\d\s.,]+)/i);
          const currency = match ? 'R' : '';

          seen.set(href, {
            id: href.split('/PLID')[1] ? `PLID${href.split('/PLID')[1]}` : href,
            name: titleEl?.textContent?.trim() ?? 'Unnamed product',
            description: '',
            price: match ? Number(match[1].replace(/[\s,]/g, '')) : NaN,
            currency,
            imageUrl: imageEl?.src ?? '',
            productUrl: href,
            sellerId: sId,
            brand: brandEl?.textContent?.trim() || undefined,
          });
        }

        return Array.from(seen.values());
      },
      { sellerId }
    );

    return scraped
      .filter((item) => Number.isFinite(item.price))
      .map((item) => ({
        ...item,
        price: Number(item.price),
        imageUrl: item.imageUrl.replace('{size}', '400'),
      }));
  } finally {
    await context.close();
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { sellerId } = request.query;

  if (typeof sellerId !== 'string' || sellerId.trim().length === 0) {
    return response.status(400).json({ error: 'sellerId is required' });
  }

  try {
    const products = await scrapeSellerCatalogue(sellerId.trim());

    if (products.length === 0) {
      return response.status(200).json({
        products: [],
        meta: {
          sellerId: sellerId.trim(),
          total: 0,
          note: 'No visible products found on the seller storefront.',
        },
      });
    }

    return response.status(200).json({
      products,
      meta: {
        sellerId: sellerId.trim(),
        total: products.length,
        source: 'scrape',
      },
    });
  } catch (error) {
    console.error('Failed to scrape seller catalogue:', error);
    return response.status(500).json({
      error: 'Failed to scrape seller catalogue.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
