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
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  const after = typeof rawAfter === 'string' ? rawAfter.trim() : '';

  if (!query) {
    return response.status(400).json({ error: 'query is required' });
  }

  try {
    const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
    url.searchParams.set('qsearch', query);
    if (after) {
      url.searchParams.set('after', after);
    }

    const upstream = await fetch(url, {
      headers: {
        ...API_HEADERS,
        Referer: `${TAKEALOT_ORIGIN}/all?qsearch=${encodeURIComponent(query)}`,
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
        query,
        total: products.length,
        source: 'public-api',
        nextAfter,
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
