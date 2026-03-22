import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from './_lib/http.js';
import { fetchProductOffers, type ProductOfferResponse } from './product-offers.js';

const TAKEALOT_ORIGIN = 'https://www.takealot.com';
const TAKEALOT_SEARCH_ENDPOINT =
  'https://api.takealot.com/rest/v-1-16-0/searches/products,filters,facets,sort_options,breadcrumbs,slots_audience,context,seo,layout';
const API_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-ZA,en;q=0.9',
  Origin: TAKEALOT_ORIGIN,
  Referer: `${TAKEALOT_ORIGIN}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
};
const DISCOVERY_QUERY_SEEDS = [
  'smart watch',
  'wireless earbuds',
  'car phone holder',
  'desk organiser',
  'led strip lights',
  'pet water fountain',
  'resistance bands',
  'air fryer accessories',
];
const RESULTS_PER_QUERY_SLICE = 4;
const TARGET_RESULTS = 20;
const DISCOVERY_CACHE_TTL_MS = 10 * 60_000;

const discoveryCache = new Map<number, { payload: DiscoveryResponse; expiresAt: number }>();

type SearchResponse = {
  sections?: {
    products?: {
      results?: SearchResult[];
    };
  };
};

type SearchResult = {
  type?: string;
  product_views?: {
    core?: {
      id?: number;
      title?: string | null;
      subtitle?: string | null;
      slug?: string | null;
      brand?: string | null;
    };
    gallery?: {
      images?: Array<string | null>;
    };
    buybox_summary?: {
      pretty_price?: string | null;
      prices?: Array<number | null>;
    };
  };
};

type DiscoveryProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  sellerId: string;
  brand?: string;
  opportunityScore: number;
  sourceQuery: string;
};

type DiscoveryResponse = {
  products: DiscoveryProduct[];
  meta: {
    total: number;
    source: string;
    generatedAt: string;
  };
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const rawPage = Array.isArray(request.query.page) ? request.query.page[0] : request.query.page;
  const page = Math.max(0, Number.parseInt(typeof rawPage === 'string' ? rawPage : '0', 10) || 0);

  const cached = discoveryCache.get(page);
  if (cached && cached.expiresAt > Date.now()) {
    return response.status(200).json(cached.payload);
  }

  try {
    const products = await buildDiscoveryFeed(page);
    const hasMore = products.length === TARGET_RESULTS;
    const payload: DiscoveryResponse = {
      products,
      meta: {
        total: products.length,
        source: 'public-api',
        generatedAt: new Date().toISOString(),
        page,
        hasMore,
      },
    };

    discoveryCache.set(page, { payload, expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS });

    return response.status(200).json(payload);
  } catch (error) {
    console.error('Failed to build product opportunities:', error);
    return response.status(500).json({
      error: 'Failed to load product opportunities.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function buildDiscoveryFeed(page: number): Promise<DiscoveryProduct[]> {
  const searchPages = await Promise.all(
    DISCOVERY_QUERY_SEEDS.map(async (query) => ({
      query,
      results: await searchProducts(query),
    }))
  );

  const candidates = new Map<string, Omit<DiscoveryProduct, 'opportunityScore'>>();

  const sliceStart = page * RESULTS_PER_QUERY_SLICE;
  const sliceEnd = sliceStart + RESULTS_PER_QUERY_SLICE;
  for (const searchPage of searchPages) {
    for (const product of searchPage.results.slice(sliceStart, sliceEnd)) {
      if (!candidates.has(product.id)) {
        candidates.set(product.id, {
          ...product,
          sourceQuery: searchPage.query,
        });
      }
    }
  }

  const detailedProducts = await Promise.all(
    Array.from(candidates.values()).map(async (product) => {
      try {
        const summary = await fetchProductOffers({ productUrl: product.productUrl });
        return {
          ...product,
          opportunityScore: scoreOpportunity(summary),
        };
      } catch (error) {
        console.error(`Failed to score discovery product ${product.id}:`, error);
        return null;
      }
    })
  );

  return detailedProducts
    .filter((product): product is DiscoveryProduct => Boolean(product))
    .sort((left, right) => right.opportunityScore - left.opportunityScore)
    .slice(0, TARGET_RESULTS);
}

async function searchProducts(query: string): Promise<Array<Omit<DiscoveryProduct, 'opportunityScore' | 'sourceQuery'>>> {
  const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
  url.searchParams.set('qsearch', query);

  const response = await fetch(url, {
    headers: {
      ...API_HEADERS,
      Referer: `${TAKEALOT_ORIGIN}/all?qsearch=${encodeURIComponent(query)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Takealot discovery search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SearchResponse;
  return (payload.sections?.products?.results ?? [])
    .map(mapSearchResultToProduct)
    .filter((product): product is Omit<DiscoveryProduct, 'opportunityScore' | 'sourceQuery'> => Boolean(product));
}

function mapSearchResultToProduct(result: SearchResult): Omit<DiscoveryProduct, 'opportunityScore' | 'sourceQuery'> | null {
  if (result.type !== 'product_views') {
    return null;
  }

  const view = result.product_views;
  const core = view?.core;
  const id = typeof core?.id === 'number' ? `PLID${core.id}` : '';
  const title = core?.title?.trim() || '';
  const slug = core?.slug?.trim() || '';
  const numericPrice = view?.buybox_summary?.prices?.find(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );

  if (!id || !title || typeof numericPrice !== 'number') {
    return null;
  }

  const numericId = id.replace(/^PLID/i, '');
  return {
    id,
    name: title,
    description: core?.subtitle?.trim() || '',
    price: numericPrice,
    currency: parseCurrency(view?.buybox_summary?.pretty_price) ?? 'R',
    imageUrl: normalizeImageUrl(view?.gallery?.images?.[0] ?? ''),
    productUrl: slug
      ? `${TAKEALOT_ORIGIN}/${slug}/PLID${numericId}`
      : `${TAKEALOT_ORIGIN}/product/PLID${numericId}`,
    sellerId: '',
    brand: core?.brand?.trim() || undefined,
  };
}

function scoreOpportunity(summary: ProductOfferResponse): number {
  const { product, offers } = summary;
  const bestPrice = offers.find((offer) => offer.kind === 'best-price');
  const fastest = offers.find((offer) => offer.kind === 'fastest-delivery');
  const sellerReviewCount = Math.max(
    product.sellerReviewCount ?? 0,
    ...offers.map((offer) => offer.sellerReviewCount ?? 0)
  );
  const sellerRating = Math.max(
    product.sellerRating ?? 0,
    ...offers.map((offer) => offer.sellerRating ?? 0)
  );

  let score = 50;

  if (typeof product.starRating === 'number') {
    if (product.starRating >= 4.5) score += 15;
    else if (product.starRating >= 4.2) score += 10;
    else if (product.starRating >= 4) score += 6;
    else if (product.starRating > 0 && product.starRating < 3.8) score -= 10;
  } else {
    score -= 8;
  }

  if (typeof product.reviewCount === 'number') {
    if (product.reviewCount >= 100) score += 18;
    else if (product.reviewCount >= 40) score += 12;
    else if (product.reviewCount >= 15) score += 7;
    else if (product.reviewCount >= 5) score += 3;
    else score -= 8;
  } else {
    score -= 10;
  }

  if (sellerReviewCount >= 1000) score -= 10;
  else if (sellerReviewCount >= 250) score -= 6;
  else if (sellerReviewCount > 0 && sellerReviewCount < 50) score += 5;

  if (sellerRating >= 4.6) score -= 4;
  else if (sellerRating > 0 && sellerRating < 4.1) score += 4;

  if (bestPrice && fastest) {
    const gap = (fastest.price ?? 0) - (bestPrice.price ?? 0);
    if (gap >= 150) score += 6;
    else if (gap > 0 && gap < 80) score -= 2;
  } else if (bestPrice || fastest) {
    score += 3;
  }

  if (!product.brand) score += 4;
  if (product.bulletHighlights.some((item) => /free delivery/i.test(item))) score += 3;
  if (product.bulletHighlights.some((item) => /warranty/i.test(item))) score += 2;
  if (product.bulletHighlights.some((item) => /non-returnable/i.test(item))) score -= 4;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeImageUrl(value: string): string {
  return value.replace('{size}', 'pdpxl');
}

function parseCurrency(priceText?: string | null): string | null {
  if (!priceText) {
    return null;
  }

  const match = priceText.match(/[A-Za-z]+|R/);
  return match?.[0] ?? null;
}
