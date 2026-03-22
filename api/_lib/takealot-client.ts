export type SellerProduct = {
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
    enhanced_ecommerce_click?: {
      ecommerce?: {
        click?: {
          products?: Array<{
            id?: string | null;
          }>;
        };
      };
    };
  };
};

const TAKEALOT_SEARCH_ENDPOINT =
  'https://api.takealot.com/rest/v-1-16-0/searches/products,filters,facets,sort_options,breadcrumbs,slots_audience,context,seo,layout';
const TAKEALOT_ORIGIN = 'https://www.takealot.com';
const MAX_PAGES = 20;
const BROWSER_LIKE_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-ZA,en;q=0.9',
  Origin: TAKEALOT_ORIGIN,
  Referer: `${TAKEALOT_ORIGIN}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
};

export async function fetchSellerCatalogue(
  sellerId: string,
  query?: string
): Promise<SellerProduct[]> {
  const products: SellerProduct[] = [];
  const seen = new Set<string>();
  let after: string | null = null;
  let pageCount = 0;

  do {
    const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
    url.searchParams.set('sellers', sellerId);
    url.searchParams.set('filter', `Sellers:${sellerId}`);
    if (after) {
      url.searchParams.set('after', after);
    }

    const response = await fetch(url, {
      headers: {
        ...BROWSER_LIKE_HEADERS,
        Referer: `${TAKEALOT_ORIGIN}/seller?sellers=${encodeURIComponent(sellerId)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Takealot search request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ProductSearchResponse;
    const pageResults = payload.sections?.products?.results ?? [];

    for (const result of pageResults) {
      const mapped = mapSearchResultToProduct(result, sellerId);
      if (!mapped || seen.has(mapped.productUrl)) {
        continue;
      }

      seen.add(mapped.productUrl);
      products.push(mapped);
    }

    after = payload.sections?.products?.paging?.next_is_after?.trim() || null;
    pageCount += 1;
  } while (after && pageCount < MAX_PAGES);

  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) => {
    const haystack = `${product.name} ${product.description} ${product.brand ?? ''}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

function mapSearchResultToProduct(result: SearchResult, sellerId: string): SellerProduct | null {
  if (result.type !== 'product_views') {
    return null;
  }

  const view = result.product_views;
  const core = view?.core;
  const id =
    view?.enhanced_ecommerce_click?.ecommerce?.click?.products?.[0]?.id?.trim() ||
    (typeof core?.id === 'number' ? `PLID${core.id}` : '');
  const title = core?.title?.trim() || '';
  const slug = core?.slug?.trim() || '';
  const numericPrice = view?.buybox_summary?.prices?.find(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );

  if (!id || !title || typeof numericPrice !== 'number') {
    return null;
  }

  const imageUrl = normalizeImageUrl(view?.gallery?.images?.[0] ?? '');
  const productUrl = slug
    ? `${TAKEALOT_ORIGIN}/${slug}/PLID${id.replace(/^PLID/i, '')}`
    : `${TAKEALOT_ORIGIN}/product/PLID${id.replace(/^PLID/i, '')}`;

  return {
    id,
    name: title,
    description: core?.subtitle?.trim() || '',
    price: numericPrice,
    currency: parseCurrency(view?.buybox_summary?.pretty_price) ?? 'R',
    imageUrl,
    productUrl,
    sellerId,
    brand: core?.brand?.trim() || undefined,
  };
}

function normalizeImageUrl(value: string): string {
  return value.replace('{size}', 'list');
}

function parseCurrency(priceText?: string | null): string | null {
  if (!priceText) {
    return null;
  }

  const match = priceText.match(/[A-Za-z]+|R/);
  return match?.[0] ?? null;
}
