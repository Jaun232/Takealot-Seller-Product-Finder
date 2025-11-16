import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Browser } from 'playwright-core';
import { launchBrowser } from './_lib/browser';
import { withCors } from './_lib/http';

const TAKEALOT_SEARCH_BASE = 'https://www.takealot.com/search?query=';

type OfferKind = 'best-price' | 'fastest-delivery' | 'other';

type RawOffer = {
  label?: string | null;
  priceText?: string | null;
  listPriceText?: string | null;
  deliveryPromise?: string | null;
  locationCodes: string[];
  locationDetails: string[];
};

type RawProductOfferPayload = {
  product: {
    id: string;
    name: string;
    productUrl: string;
    imageUrl?: string | null;
  };
  offers: RawOffer[];
  meta: {
    query: string;
    productUrl: string;
    searchUrl: string;
  };
};

type OfferHighlight = {
  kind: OfferKind;
  label: string;
  priceText?: string;
  listPriceText?: string;
  currency?: string | null;
  price?: number | null;
  listPrice?: number | null;
  deliveryPromise?: string;
  locationCodes: string[];
  locationDetails: string[];
};

type ProductOfferResponse = {
  product: RawProductOfferPayload['product'];
  offers: OfferHighlight[];
  meta: RawProductOfferPayload['meta'] & { extractedAt: string };
};

type ProductOfferParams = {
  query?: string;
  productUrl?: string;
};

async function scrapeProductOffers(params: ProductOfferParams): Promise<ProductOfferResponse> {
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();
    const normalizedQuery = params.query?.trim();
    const normalizedProductUrl = normalizeProductUrl(params.productUrl);

    if (!normalizedQuery && !normalizedProductUrl) {
      throw new Error('Provide either a product description or a Takealot product URL.');
    }

    let productUrl = normalizedProductUrl ?? '';
    let searchUrl: string | null = null;

    if (!productUrl) {
      searchUrl = `${TAKEALOT_SEARCH_BASE}${encodeURIComponent(normalizedQuery ?? '')}`;
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      await page.waitForSelector('.product-card a[href*="/PLID"]', { timeout: 15000 });

      productUrl = await page.evaluate(() => {
        const anchor = document.querySelector<HTMLAnchorElement>('.product-card a[href*="/PLID"]');
        return anchor?.href ?? null;
      }) ?? '';
    }

    if (!productUrl) {
      throw new Error('No products found that match this description.');
    }

    if (!searchUrl) {
      searchUrl = productUrl;
    }

    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    // Allow the offer widgets to hydrate but do not hard fail if they are missing
    await page.waitForSelector('[data-ref="offer-link"]', { timeout: 12000 }).catch(() => undefined);

    const rawPayload: RawProductOfferPayload = await page.evaluate(
      (details) => {
        const productName =
          document.querySelector<HTMLElement>('[data-ref="product-title"] h1')?.textContent?.trim() ??
          'Unknown product';
        const heroImage =
          document
            .querySelector<HTMLImageElement>('[data-ref="pdp-sticky-nav-imagebox"] img')
            ?.getAttribute('src') ??
          document.querySelector<HTMLImageElement>('.image-gallery img')?.getAttribute('src') ??
          null;

        const offers = Array.from(
          document.querySelectorAll<HTMLElement>('[data-ref="offer-link"]')
        ).map((wrapper) => {
          const label = wrapper
            .querySelector<HTMLElement>('.buybox-offer-module_offer-type_2tIJZ')
            ?.textContent?.trim();
          const priceText = wrapper
            .querySelector<HTMLElement>('[data-ref="price"] .currency')
            ?.textContent?.trim();
          const listPriceText = wrapper
            .querySelector<HTMLElement>('.buybox-offer-module_list-price_2GEsn .currency')
            ?.textContent?.trim();
          const deliveryPromise = wrapper
            .querySelector<HTMLElement>('.in-stock-indicator-module_estimated-delivery-date_2GFYa')
            ?.textContent?.replace(/\s+/g, ' ')
            .replace(/!T&Cs/, '! T&Cs')
            .trim();
          const locationCodes = Array.from(
            wrapper.querySelectorAll<HTMLElement>('.stock-pill-text')
          )
            .map((pill) => pill.textContent?.trim())
            .filter((value): value is string => Boolean(value));
          const locationDetails = Array.from(
            wrapper.querySelectorAll<HTMLElement>('.accessible-text-module_accessible-text_11WAe')
          )
            .map((textNode) => textNode.textContent?.trim())
            .filter((value): value is string => Boolean(value));

          return {
            label,
            priceText,
            listPriceText,
            deliveryPromise,
            locationCodes,
            locationDetails,
          };
        });

        const idMatch = details.productUrl.match(/(PLID\d+)/i);

        return {
          product: {
            id: idMatch?.[1] ?? details.productUrl,
            name: productName,
            productUrl: details.productUrl,
            imageUrl: heroImage,
          },
          offers,
          meta: {
            query: details.query,
            productUrl: details.productUrl,
            searchUrl: details.searchUrl,
          },
        };
      },
      {
        productUrl,
        query: normalizedQuery ?? normalizedProductUrl ?? '',
        searchUrl,
      }
    );

    await context.close();

    const offers = rawPayload.offers
      .map(mapOfferHighlight)
      .filter(
        (offer): offer is OfferHighlight =>
          Boolean(offer) && offer.kind !== 'other' && Boolean(offer.label)
      );

    return {
      product: rawPayload.product,
      offers,
      meta: {
        ...rawPayload.meta,
        extractedAt: new Date().toISOString(),
      },
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function mapOfferHighlight(raw: RawOffer): OfferHighlight | null {
  const label = raw.label?.trim();
  if (!label) {
    return null;
  }

  const normalizedLabel = label.toLowerCase();
  let kind: OfferKind = 'other';
  if (normalizedLabel.includes('best')) {
    kind = 'best-price';
  } else if (normalizedLabel.includes('fast')) {
    kind = 'fastest-delivery';
  }

  const price = parsePrice(raw.priceText);
  const listPrice = parsePrice(raw.listPriceText);

  return {
    kind,
    label,
    priceText: raw.priceText ?? undefined,
    listPriceText: raw.listPriceText ?? undefined,
    currency: price.currency,
    price: price.amount,
    listPrice: listPrice.amount ?? undefined,
    deliveryPromise: raw.deliveryPromise ?? undefined,
    locationCodes: raw.locationCodes ?? [],
    locationDetails: raw.locationDetails ?? [],
  };
}

function parsePrice(value?: string | null): { currency: string | null; amount: number | null } {
  if (!value) {
    return { currency: null, amount: null };
  }
  const text = value.replace(/\s+/g, ' ').trim();
  const match = text.match(/([A-Za-z]+)\s*([\d\s.,]+)/);
  const currency = match?.[1] ?? (/[A-Za-z]+/.exec(text)?.[0] ?? null);
  const numericPart = match?.[2] ?? text.replace(/[^\d.,]/g, '');
  const normalized = numericPart.replace(/\s/g, '').replace(/,/g, '');
  const amount = Number.parseFloat(normalized);
  return {
    currency,
    amount: Number.isFinite(amount) ? amount : null,
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const rawQuery = Array.isArray(request.query.query)
    ? request.query.query[0]
    : request.query.query;
  const rawProductUrl = Array.isArray(request.query.productUrl)
    ? request.query.productUrl[0]
    : request.query.productUrl;

  const searchTerm = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  const productUrlParam = typeof rawProductUrl === 'string' ? rawProductUrl.trim() : '';

  if (!searchTerm && !productUrlParam) {
    return response
      .status(400)
      .json({ error: 'Provide a description or a Takealot product URL to continue.' });
  }

  try {
    const payload = await scrapeProductOffers({
      query: searchTerm || undefined,
      productUrl: productUrlParam || undefined,
    });

    if (payload.offers.length === 0) {
      return response.status(200).json({
        ...payload,
        message:
          'No Best Price or Fastest Delivery blocks were visible for the selected product. Try another item.',
      });
    }

    return response.status(200).json(payload);
  } catch (error) {
    console.error('Failed to fetch product offers:', error);
    return response.status(500).json({
      error: 'Failed to fetch product offers.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function normalizeProductUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
  } catch {
    return null;
  }

  if (!url.hostname.includes('takealot.com')) {
    return null;
  }

  if (!url.pathname.includes('PLID')) {
    return url.toString();
  }

  return url.toString();
}
