import type { VercelRequest, VercelResponse } from '@vercel/node';

type TakealotProductView = {
  product_views?: {
    core?: {
      id?: number;
      title?: string;
      subtitle?: string;
      slug?: string;
      brand?: string;
    };
    gallery?: {
      images?: string[];
    };
    buybox_summary?: {
      prices?: number[];
      pretty_price?: string;
      product_id?: number;
      tsin?: number | string;
    };
  };
};

type TakealotSearchResponse = {
  sections?: {
    products?: {
      results?: TakealotProductView[];
      paging?: {
        total_num_found?: number;
      };
    };
  };
};

const TAKEALOT_SEARCH_URL = 'https://api.takealot.com/rest/v-1-9-0/searches/products';

function withCors(response: VercelResponse): VercelResponse {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

function buildProductUrl(slug?: string, plid?: number): string | null {
  if (!slug || !plid) return null;
  return `https://www.takealot.com/${slug}/PLID${plid}`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { sellerId, query, rows, start } = request.query;

  if (typeof sellerId !== 'string' || sellerId.trim().length === 0) {
    return response.status(400).json({ error: 'sellerId is required' });
  }

  const trimmedSellerId = sellerId.trim();
  const rowsParam = typeof rows === 'string' && rows ? rows : '36';
  const startParam = typeof start === 'string' && start ? start : '0';
  const queryParam = typeof query === 'string' && query.trim().length > 0 ? query.trim() : '';

  const attempts = [
    new URLSearchParams({
      filter: `SellerId:${trimmedSellerId}`,
      rows: rowsParam,
      start: startParam,
      sort: 'Relevance',
      ...(queryParam ? { q: queryParam } : {}),
    }),
    new URLSearchParams({
      sellers: trimmedSellerId,
      rows: rowsParam,
      start: startParam,
      sort: 'Relevance',
      ...(queryParam ? { q: queryParam } : {}),
    }),
  ];

  let payload: TakealotSearchResponse | null = null;
  let lastError: { status?: number; body?: string } | null = null;

  for (const params of attempts) {
    try {
      const res = await fetch(`${TAKEALOT_SEARCH_URL}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'takealot-seller-product-finder/1.0 (+https://vercel.com/)',
        },
      });

      if (!res.ok) {
        lastError = { status: res.status, body: await res.text() };
        continue;
      }

      const json = (await res.json()) as TakealotSearchResponse;
      const results = json.sections?.products?.results ?? [];

      if (results.length === 0) {
        // keep last response but continue to the fallback attempt
        payload = json;
        continue;
      }

      payload = json;
      break;
    } catch (error) {
      console.error('Error contacting Takealot API', error);
      lastError = { status: 502, body: (error as Error).message };
    }
  }

  if (!payload) {
    return response.status(lastError?.status ?? 502).json({
      error: 'Unable to reach Takealot search API',
      debug: lastError,
    });
  }

  const results = payload.sections?.products?.results ?? [];
  const products = results
    .map((entry, index) => {
      const view = entry.product_views;
      if (!view) return null;

      const core = view.core ?? {};
      const gallery = view.gallery ?? {};
      const buybox = view.buybox_summary ?? {};

      const price = Array.isArray(buybox.prices) && buybox.prices.length > 0 ? buybox.prices[0] : null;
      const imageUrl =
        Array.isArray(gallery.images) && gallery.images.length > 0 ? gallery.images[0].replace('{size}', '400') : null;
      const productUrl = buildProductUrl(core.slug, core.id);

      if (!core.title || price === null || !imageUrl || !productUrl) {
        return null;
      }

      return {
        id: `PLID${core.id ?? index}`,
        name: core.title,
        description: core.subtitle ?? `Listed on Takealot by seller ${sellerId}`,
        price,
        currency: 'R',
        imageUrl,
        productUrl,
        sellerId: sellerId.trim(),
        brand: core.brand ?? undefined,
      };
    })
    .filter((product): product is NonNullable<typeof product> => product !== null);

  return response.status(200).json({
    products,
    meta: {
      total: payload.sections?.products?.paging?.total_num_found ?? products.length,
      sellerId: sellerId.trim(),
      query: typeof query === 'string' ? query.trim() : '',
    },
  });
}
