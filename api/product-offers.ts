import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Page } from 'playwright-core';
import { getBrowser } from './_lib/browser';
import { withCors } from './_lib/http';

const TAKEALOT_SEARCH_BASE = 'https://www.takealot.com/search?query=';
const SEARCH_RESULTS_PER_PAGE = 24;
const MAX_SEARCH_PAGES = 6;
const OFFER_CACHE_TTL_MS = 60_000;
const OFFER_CACHE_MAX_ENTRIES = 32;
const offerCache = new Map<string, { value: ProductOfferResponse; expiresAt: number }>();

type OfferKind = 'best-price' | 'fastest-delivery' | 'other';

type RawOffer = {
  label?: string | null;
  priceText?: string | null;
  listPriceText?: string | null;
  deliveryPromise?: string | null;
  locationCodes: string[];
  locationDetails: string[];
  sellerName?: string | null;
  sellerLink?: string | null;
};

type RawProductOfferPayload = {
  product: {
    id: string;
    name: string;
    productUrl: string;
    imageUrl?: string | null;
    sellerName?: string | null;
    sellerLink?: string | null;
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
  sellerName?: string | null;
  sellerLink?: string | null;
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
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });

  try {
    const page = await context.newPage();
    const normalizedQuery = params.query?.trim();
    const normalizedProductUrl = normalizeProductUrl(params.productUrl);

    if (!normalizedQuery && !normalizedProductUrl) {
      throw new Error('Provide either a product description or a Takealot product URL.');
    }

    let productUrl = normalizedProductUrl ?? '';
    let searchUrl: string | null = null;

    if (!productUrl) {
      const baseSearchUrl = `${TAKEALOT_SEARCH_BASE}${encodeURIComponent(normalizedQuery ?? '')}`;
      let pageIndex = 0;

      while (!productUrl && pageIndex < MAX_SEARCH_PAGES) {
        const startParam = pageIndex * SEARCH_RESULTS_PER_PAGE;
        const pagedUrl =
          pageIndex === 0 ? baseSearchUrl : `${baseSearchUrl}&start=${startParam}`;
        searchUrl = pagedUrl;

        await page.goto(pagedUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 20000,
        });

        await page.waitForSelector('.product-card', { timeout: 15000 });

        const candidates = await page.evaluate(() => {
          const cards = Array.from(document.querySelectorAll<HTMLElement>('.product-card'));
          return cards
            .map((card) => {
              const title =
                card.querySelector<HTMLElement>('.product-card-module_product-title_16xh8');
              const link = card.querySelector<HTMLAnchorElement>('a[href*="/PLID"]');
              return {
                title: title?.textContent?.trim() ?? '',
                url: link?.href ?? '',
                slug: link?.pathname ?? '',
              };
            })
            .filter((item) => item.url && item.title);
        });

        const selected = pickBestMatch(candidates, normalizedQuery ?? '');
        productUrl = selected ?? '';
        if (!productUrl && candidates.length > 0 && pageIndex === 0) {
          productUrl = candidates[0]?.url ?? '';
        }

        pageIndex += 1;
      }
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

        const sellerInfo = document.querySelector<HTMLElement>('.pdp-core-module_main-seller_20BMu');
        const sellerName =
          sellerInfo?.querySelector('a')?.textContent?.trim() ??
          sellerInfo?.textContent?.replace('Sold by', '').trim() ??
          null;
        const sellerLink = sellerInfo?.querySelector('a')?.getAttribute('href') ?? null;

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
          const sellerAnchor = wrapper.querySelector<HTMLAnchorElement>('a[href*="/seller/"]');
          const sellerNameCandidate =
            sellerAnchor?.textContent?.trim() ??
            wrapper
              .querySelector<HTMLElement>('[class*="seller"]')
              ?.textContent?.replace(/Sold by/i, '')
              .trim() ??
            null;
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
            sellerName: sellerNameCandidate,
            sellerLink: sellerAnchor?.href ?? null,
          };
        });

        const idMatch = details.productUrl.match(/(PLID\d+)/i);

        return {
          product: {
            id: idMatch?.[1] ?? details.productUrl,
            name: productName,
            productUrl: details.productUrl,
            imageUrl: heroImage,
            sellerName,
            sellerLink: sellerLink ? new URL(sellerLink, window.location.origin).toString() : null,
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

    const offerCount = await page.$$eval('[data-ref="offer-link"]', (nodes) => nodes.length);
    const offerSellers: Array<{ name: string | null; link: string | null }> = [];

    for (let index = 0; index < offerCount; index++) {
      if (index > 0) {
        await selectOfferByIndex(page, index);
      }
      const sellerInfo = await readActiveSeller(page);
      offerSellers.push(sellerInfo);
    }

    await context.close();

    const offers = rawPayload.offers
      .map(mapOfferHighlight)
      .filter(
        (offer): offer is OfferHighlight =>
          Boolean(offer) && offer.kind !== 'other' && Boolean(offer.label)
      )
      .map((offer, index) => ({
        ...offer,
        sellerName: offerSellers[index]?.name ?? offer.sellerName,
        sellerLink: offerSellers[index]?.link ?? offer.sellerLink,
      }));

    return {
      product: rawPayload.product,
      offers,
      meta: {
        ...rawPayload.meta,
        extractedAt: new Date().toISOString(),
      },
    };
  } finally {
    await context.close();
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
    sellerName: raw.sellerName ?? undefined,
    sellerLink: raw.sellerLink ?? undefined,
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

function pickBestMatch(
  candidates: Array<{ title: string; url: string; slug?: string }>,
  query: string
): string | null {
  if (!query) {
    return null;
  }

  const normalizedQuery = normalizeForMatch(query);
  const normalizedSlugQuery = normalizeSlug(query);
  if (!normalizedQuery) {
    return null;
  }

  if (normalizedSlugQuery) {
    for (const candidate of candidates) {
      const candidateSlug = normalizeSlug(candidate.slug ?? candidate.url);
      if (candidateSlug.includes(normalizedSlugQuery)) {
        return candidate.url;
      }
    }
  }

  for (const candidate of candidates) {
    if (normalizeForMatch(candidate.title) === normalizedQuery) {
      return candidate.url;
    }
  }

  for (const candidate of candidates) {
    if (normalizeForMatch(candidate.title).includes(normalizedQuery)) {
      return candidate.url;
    }
  }

  return null;
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  const normalizedProductUrl = productUrlParam ? normalizeProductUrl(productUrlParam) : null;
  const cacheKey = normalizedProductUrl
    ? `url:${normalizedProductUrl}`
    : searchTerm
      ? `query:${searchTerm.toLowerCase()}`
      : null;

  if (!searchTerm && !productUrlParam) {
    return response
      .status(400)
      .json({ error: 'Provide a description or a Takealot product URL to continue.' });
  }

  if (cacheKey) {
    const cached = getCachedOffers(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
  }

  try {
    const payload = await scrapeProductOffers({
      query: normalizedProductUrl ? undefined : searchTerm || undefined,
      productUrl: normalizedProductUrl ?? productUrlParam || undefined,
    });

    if (payload.offers.length === 0) {
      return response.status(200).json({
        ...payload,
        message:
          'No Best Price or Fastest Delivery blocks were visible for the selected product. Try another item.',
      });
    }

    if (cacheKey) {
      setCachedOffers(cacheKey, payload);
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

async function selectOfferByIndex(page: Page, index: number): Promise<void> {
  await page.evaluate((idx) => {
    if (idx === 0) return;
    const nodes = document.querySelectorAll<HTMLElement>('[data-ref="offer-link"]');
    nodes[idx]?.click();
  }, index);

  if (index > 0) {
    await page.waitForTimeout(500);
  }
}

async function readActiveSeller(
  page: Page
): Promise<{ name: string | null; link: string | null }> {
  return page.evaluate(() => {
    const container = document.querySelector<HTMLElement>('.pdp-core-module_main-seller_20BMu');
    if (!container) {
      return { name: null, link: null };
    }
    const anchor = container.querySelector<HTMLAnchorElement>('a[href*="/seller/"]');
    const fallback = container.textContent?.replace(/Sold by/i, '').trim() ?? null;
    return {
      name: anchor?.textContent?.trim() ?? fallback,
      link: anchor ? new URL(anchor.href, window.location.origin).toString() : null,
    };
  });
}

function getCachedOffers(key: string): ProductOfferResponse | null {
  const record = offerCache.get(key);
  if (!record) {
    return null;
  }
  if (record.expiresAt < Date.now()) {
    offerCache.delete(key);
    return null;
  }
  return record.value;
}

function setCachedOffers(key: string, value: ProductOfferResponse): void {
  offerCache.set(key, { value, expiresAt: Date.now() + OFFER_CACHE_TTL_MS });
  if (offerCache.size > OFFER_CACHE_MAX_ENTRIES) {
    const firstKey = offerCache.keys().next().value;
    if (firstKey) {
      offerCache.delete(firstKey);
    }
  }
}
