import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from './_lib/http.js';

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
  'Appliances',
  'Automotive & DIY',
  'Baby & Toddler',
  'Beauty',
  'Books & Courses',
  'Camping & Outdoor',
  'Clothing & Shoes',
  'Electronics',
  'Gaming & Media',
  'Garden, Pool & Patio',
  'Groceries & Household',
  'Health & Personal Care',
  'Homeware',
  'Office & Stationery',
  'Pets',
  'Sport & Training',
  'Toys',
];
const RESULTS_PER_QUERY_SLICE = 2;
const TARGET_RESULTS = 20;
const MAX_DISCOVERY_ROUNDS = 6;
const DISCOVERY_CACHE_TTL_MS = 10 * 60_000;

const discoveryCache = new Map<number, { payload: DiscoveryResponse; expiresAt: number }>();

type SearchResponse = {
  sections?: {
    products?: {
      results?: SearchResult[];
      paging?: {
        next_is_after?: string | null;
      };
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
  sourceQuery: string;
};

type DiscoveryResponse = {
  products: DiscoveryProduct[];
  meta: {
    total: number;
    source: string;
    generatedAt: string;
    page: number;
    hasMore: boolean;
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
    const { products, hasMore } = await buildDiscoveryFeed(page);
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

async function buildDiscoveryFeed(page: number): Promise<{ products: DiscoveryProduct[]; hasMore: boolean }> {
  const candidates = new Map<string, DiscoveryProduct>();
  let hasMore = false;

  for (let round = 0; round < MAX_DISCOVERY_ROUNDS && candidates.size < TARGET_RESULTS; round += 1) {
    const searchPages = await Promise.all(
      DISCOVERY_QUERY_SEEDS.map(async (query) => ({
        query,
        ...await searchProducts(query, page + round),
      }))
    );

    let roundHasMore = false;
    for (const searchPage of searchPages) {
      if (searchPage.hasMore) {
        roundHasMore = true;
        hasMore = true;
      }

      for (const product of searchPage.results.slice(0, RESULTS_PER_QUERY_SLICE)) {
        if (!candidates.has(product.id)) {
          candidates.set(product.id, {
            ...product,
            sourceQuery: searchPage.query,
          });
        }
      }
    }

    if (!roundHasMore) {
      break;
    }
  }

  const products = Array.from(candidates.values()).slice(0, TARGET_RESULTS);

  return {
    products,
    hasMore: hasMore || products.length > 0,
  };
}

async function searchProducts(
  query: string,
  page: number
): Promise<{
  results: Array<Omit<DiscoveryProduct, 'opportunityScore' | 'sourceQuery'>>;
  hasMore: boolean;
}> {
  let after: string | null = null;
  let payload: SearchResponse | null = null;

  for (let currentPage = 0; currentPage <= page; currentPage += 1) {
    const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
    url.searchParams.set('qsearch', query);
    if (after) {
      url.searchParams.set('after', after);
    }

    const response = await fetch(url, {
      headers: {
        ...API_HEADERS,
        Referer: `${TAKEALOT_ORIGIN}/all?qsearch=${encodeURIComponent(query)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Takealot discovery search failed with status ${response.status}`);
    }

    payload = (await response.json()) as SearchResponse;
    after = payload.sections?.products?.paging?.next_is_after?.trim() || null;

    if (!after && currentPage < page) {
      return { results: [], hasMore: false };
    }
  }

  const results = ((payload?.sections?.products?.results) ?? [])
    .map(mapSearchResultToProduct)
    .filter((product): product is Omit<DiscoveryProduct, 'opportunityScore' | 'sourceQuery'> => Boolean(product));

  return {
    results,
    hasMore: Boolean(after),
  };
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
