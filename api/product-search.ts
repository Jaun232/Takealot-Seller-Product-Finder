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

type ProductSearchResponse = {
  sections?: {
    products?: {
      results?: SearchResult[];
      paging?: {
        next_is_after?: string | null;
      };
    };
  };
};

type SearchMode = 'query' | 'listing';

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

type SearchProduct = {
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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const rawQuery = Array.isArray(request.query.query) ? request.query.query[0] : request.query.query;
  const rawAfter = Array.isArray(request.query.after) ? request.query.after[0] : request.query.after;
  const rawListingUrl = Array.isArray(request.query.listingUrl)
    ? request.query.listingUrl[0]
    : request.query.listingUrl;
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  const after = typeof rawAfter === 'string' ? rawAfter.trim() : '';
  const listingUrl = typeof rawListingUrl === 'string' ? rawListingUrl.trim() : '';

  if (!query && !listingUrl) {
    return response.status(400).json({ error: 'query or listingUrl is required' });
  }

  try {
    const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
    const searchMode: SearchMode = listingUrl ? 'listing' : 'query';
    if (listingUrl) {
      const listing = new URL(listingUrl);
      for (const [key, value] of listing.searchParams.entries()) {
        if (['qsearch', 'custom', 'filter', 'sort'].includes(key)) {
          url.searchParams.set(key, value);
        }
      }

      if (![...url.searchParams.keys()].some((key) => key === 'qsearch' || key === 'custom' || key === 'filter')) {
        const derivedQuery = deriveQueryFromListingPath(listing.pathname);
        if (!derivedQuery) {
          throw new Error('Unable to derive search parameters from listing URL.');
        }
        url.searchParams.set('qsearch', derivedQuery);
      }
    } else {
      url.searchParams.set('qsearch', query);
    }
    if (after) {
      url.searchParams.set('after', after);
    }

    const referer =
      searchMode === 'listing'
        ? listingUrl
        : `${TAKEALOT_ORIGIN}/all?qsearch=${encodeURIComponent(query)}`;

    const upstream = await fetch(url, {
      headers: {
        ...API_HEADERS,
        Referer: referer,
      },
    });

    if (!upstream.ok) {
      throw new Error(`Takealot search request failed with status ${upstream.status}`);
    }

    const payload = (await upstream.json()) as ProductSearchResponse;
    const products = (payload.sections?.products?.results ?? [])
      .map(mapSearchResultToProduct)
      .filter((product): product is SearchProduct => Boolean(product));
    const nextAfter = payload.sections?.products?.paging?.next_is_after?.trim() || null;

    return response.status(200).json({
      products,
      meta: {
        query: query || listingUrl,
        total: products.length,
        source: 'public-api',
        nextAfter,
        listingUrl: listingUrl || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to search products:', error);
    return response.status(500).json({
      error: 'Failed to search products.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

function deriveQueryFromListingPath(pathname: string): string {
  const normalizedPath = pathname.trim().toLowerCase();
  const explicitMappings: Array<[string, string]> = [
    ['/pool-garden/auto', 'auto parts'],
    ['/pool-garden/diy_auto', 'diy auto'],
    ['/pool-garden/car-care-and-cleaning-', 'car care cleaning'],
    ['/pool-garden/diy-tools-and-machinery-', 'diy tools machinery'],
    ['/pool-garden/industrial-power-tools-', 'industrial power tools'],
    ['/pool-garden/measuring-tools-', 'measuring tools'],
    ['/pool-garden/tool-organisers-', 'tool organisers'],
    ['/pool-garden/workwear-and-ppe-', 'workwear ppe'],
    ['/pool-garden/safety-and-security-', 'safety security'],
    ['/home-kitchen/large-appliances', 'large appliances'],
    ['/home-kitchen/small--appliances', 'small appliances'],
    ['/baby/nappies_changing', 'nappies changing'],
    ['/baby/changing_feeding', 'changing feeding'],
    ['/baby/care_nursery', 'care nursery'],
    ['/baby/baby_clothing', 'baby clothing'],
    ['/baby/out_and_about', 'baby out and about'],
  ];

  const explicitMatch = explicitMappings.find(([fragment]) => normalizedPath.includes(fragment));
  if (explicitMatch) {
    return explicitMatch[1];
  }

  const slug = pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.trim()
    .toLowerCase();

  if (!slug) {
    return '';
  }

  return slug
    .replace(/-\d+$/, '')
    .replace(/--+/g, '-')
    .replace(/-/g, ' ')
    .trim();
}

function mapSearchResultToProduct(result: SearchResult): SearchProduct | null {
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

  return {
    id,
    name: title,
    description: core?.subtitle?.trim() || '',
    price: numericPrice,
    currency: parseCurrency(view?.buybox_summary?.pretty_price) ?? 'R',
    imageUrl: normalizeImageUrl(view?.gallery?.images?.[0] ?? ''),
    productUrl: slug
      ? `${TAKEALOT_ORIGIN}/${slug}/PLID${id.replace(/^PLID/i, '')}`
      : `${TAKEALOT_ORIGIN}/product/${id}`,
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
