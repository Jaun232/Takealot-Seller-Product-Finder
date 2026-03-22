import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from './_lib/http.js';

const TAKEALOT_ORIGIN = 'https://www.takealot.com';
const TAKEALOT_SEARCH_ENDPOINT =
  'https://api.takealot.com/rest/v-1-16-0/searches/products,filters,facets,sort_options,breadcrumbs,slots_audience,context,seo,layout';
const TAKEALOT_PRODUCT_DETAILS_ENDPOINT = 'https://api.takealot.com/rest/v-1-16-0/product-details';
const OFFER_CACHE_TTL_MS = 60_000;
const OFFER_CACHE_MAX_ENTRIES = 32;
const offerCache = new Map<string, { value: ProductOfferResponse; expiresAt: number }>();
const API_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-ZA,en;q=0.9',
  Origin: TAKEALOT_ORIGIN,
  Referer: `${TAKEALOT_ORIGIN}/`,
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
};

type OfferKind = 'best-price' | 'fastest-delivery' | 'other';

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
  sellerRating?: number | null;
  sellerReviewCount?: number | null;
  availabilityStatus?: string;
};

export type ProductOfferResponse = {
  product: {
    id: string;
    name: string;
    subtitle?: string | null;
    brand?: string | null;
    productUrl: string;
    imageUrl?: string | null;
    starRating?: number | null;
    reviewCount?: number | null;
    sellerName?: string | null;
    sellerLink?: string | null;
    sellerRating?: number | null;
    sellerReviewCount?: number | null;
    variants: Array<{
      label: string;
      type: string;
      selected?: string | null;
      options: Array<{
        name: string;
        value: string;
        isSelected: boolean;
        isEnabled: boolean;
        imageUrl?: string | null;
        productUrl?: string | null;
      }>;
    }>;
    bulletHighlights: string[];
    insights: Array<{ label: string; value: string }>;
  };
  offers: OfferHighlight[];
  meta: {
    query: string;
    productUrl: string;
    searchUrl: string;
    extractedAt: string;
  };
  message?: string;
};

type ProductOfferParams = {
  query?: string;
  productUrl?: string;
};

type SearchResponse = {
  sections?: {
    products?: {
      results?: Array<{
        type?: string;
        product_views?: {
          core?: {
            id?: number;
            title?: string | null;
            slug?: string | null;
          };
        };
      }>;
    };
  };
};

type ProductDetailsResponse = {
  title?: string;
  desktop_href?: string;
  core?: {
    id?: number;
    title?: string | null;
    subtitle?: string | null;
    brand?: string | null;
    slug?: string | null;
    star_rating?: number | null;
    reviews?: number | null;
  };
  gallery?: {
    images?: Array<string | null>;
  };
  reviews?: {
    count?: number | null;
    star_rating?: number | null;
  };
  buybox?: {
    buybox_items_type?: string;
    items?: BuyboxItem[];
  };
  product_information?: {
    items?: Array<{
      display_name?: string | null;
      displayable_text?: string | null;
      item_type?: string | null;
    }>;
  };
  bullet_point_attributes?: {
    items?: Array<{
      text?: string | null;
    }>;
  };
  seller_detail?: SellerDetail | null;
  variants?: {
    selectors?: VariantSelector[];
  } | null;
};

type BuyboxItem = {
  is_selected?: boolean;
  offer_detail?: {
    preference?: string | null;
    display_text?: string | null;
  };
  price?: number | null;
  pretty_price?: string | null;
  listing_price?: number | null;
  stock_availability?: {
    status?: string | null;
    distribution_centres?: Array<{
      text?: string | null;
      description?: string | null;
    }>;
    estimated_delivery?: {
      estimated_dates?: string | null;
    };
  };
  shipping_message?: {
    description?: string | null;
    values?: Array<{
      value?: string | null;
    }>;
  };
};

type SellerDetail = {
  display_name?: string | null;
  seller_reviews?: {
    average_star_rating?: number | null;
    total_count_value?: number | null;
  };
  link_data?: {
    path?: string | null;
    fields?: Record<string, string | undefined>;
  };
};

type VariantSelector = {
  selector_type?: string | null;
  title?: string | null;
  call_to_action?: string | null;
  options?: VariantOption[];
};

type VariantOption = {
  is_enabled?: boolean;
  is_selected?: boolean;
  desktop_href?: string | null;
  value?: {
    name?: string | null;
    value?: string | null;
    type?: string | null;
  };
  image?: Array<string | null>;
};

export async function fetchProductOffers(params: ProductOfferParams): Promise<ProductOfferResponse> {
  const normalizedQuery = params.query?.trim();
  const normalizedProductUrl = normalizeProductUrl(params.productUrl);

  if (!normalizedQuery && !normalizedProductUrl) {
    throw new Error('Provide either a product description or a Takealot product URL.');
  }

  let productUrl = normalizedProductUrl ?? '';
  let searchUrl = normalizedProductUrl ?? '';
  let plid = extractPlid(productUrl);

  if (!plid) {
    const resolved = await resolveProductFromSearch(normalizedQuery ?? '');
    plid = resolved.plid;
    productUrl = resolved.productUrl;
    searchUrl = resolved.searchUrl;
  }

  const variantParams = extractVariantParams(normalizedProductUrl);
  const baseDetails = await fetchProductDetails(plid, undefined, variantParams);
  const allItems = baseDetails.buybox?.items ?? [];

  const preferences = new Set<string>();
  for (const item of allItems) {
    const pref = item.offer_detail?.preference?.trim();
    if (pref) {
      preferences.add(pref);
    }
  }

  const preferredResponses = new Map<string, ProductDetailsResponse>();
  if (preferences.has('lowest_priced')) {
    preferredResponses.set('lowest_priced', await fetchProductDetails(plid, 'lowest_priced', variantParams));
  }
  if (preferences.has('fastest')) {
    preferredResponses.set('fastest', await fetchProductDetails(plid, 'fastest', variantParams));
  }

  const offers: OfferHighlight[] = [];
  const byKind = new Set<OfferKind>();

  for (const [pref, payload] of preferredResponses) {
    const offer = mapPreferredResponseToOffer(payload, pref);
    if (!offer || byKind.has(offer.kind)) {
      continue;
    }
    byKind.add(offer.kind);
    offers.push(offer);
  }

  const sellerLink = buildSellerLink(baseDetails.seller_detail);
  const fallbackOffer = mapPreferredResponseToOffer(baseDetails, 'primary');
  if (fallbackOffer && offers.length === 0) {
    offers.push(fallbackOffer);
  }

  return {
    product: {
      id: plid,
      name: baseDetails.core?.title?.trim() || baseDetails.title || 'Unknown product',
      subtitle: baseDetails.core?.subtitle ?? null,
      brand: baseDetails.core?.brand ?? null,
      productUrl:
        normalizeProductUrl(baseDetails.desktop_href) ??
        productUrl ??
        `${TAKEALOT_ORIGIN}/product/${plid}`,
      imageUrl: normalizeImageUrl(baseDetails.gallery?.images?.[0] ?? null),
      starRating: baseDetails.reviews?.star_rating ?? baseDetails.core?.star_rating ?? null,
      reviewCount: baseDetails.reviews?.count ?? baseDetails.core?.reviews ?? null,
      sellerName: baseDetails.seller_detail?.display_name ?? null,
      sellerLink,
      sellerRating: baseDetails.seller_detail?.seller_reviews?.average_star_rating ?? null,
      sellerReviewCount: baseDetails.seller_detail?.seller_reviews?.total_count_value ?? null,
      variants: extractVariants(baseDetails),
      bulletHighlights: (baseDetails.bullet_point_attributes?.items ?? [])
        .map((item) => item.text?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 6),
      insights: extractProductInsights(baseDetails),
    },
    offers,
    meta: {
      query: normalizedQuery ?? normalizedProductUrl ?? plid,
      productUrl:
        normalizeProductUrl(baseDetails.desktop_href) ??
        productUrl ??
        `${TAKEALOT_ORIGIN}/product/${plid}`,
      searchUrl:
        searchUrl ||
        normalizeProductUrl(baseDetails.desktop_href) ||
        productUrl ||
        `${TAKEALOT_ORIGIN}/product/${plid}`,
      extractedAt: new Date().toISOString(),
    },
  };
}

async function resolveProductFromSearch(
  query: string
): Promise<{ plid: string; productUrl: string; searchUrl: string }> {
  const searchUrl = `${TAKEALOT_ORIGIN}/all?qsearch=${encodeURIComponent(query)}`;
  const url = new URL(TAKEALOT_SEARCH_ENDPOINT);
  url.searchParams.set('qsearch', query);

  const response = await fetch(url, {
    headers: {
      ...API_HEADERS,
      Referer: searchUrl,
    },
  });

  if (!response.ok) {
    throw new Error(`Takealot search request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as SearchResponse;
  const candidates = (payload.sections?.products?.results ?? [])
    .filter((item) => item.type === 'product_views')
    .map((item) => ({
      id: item.product_views?.core?.id ? `PLID${item.product_views.core.id}` : '',
      title: item.product_views?.core?.title?.trim() ?? '',
      slug: item.product_views?.core?.slug?.trim() ?? '',
    }))
    .filter((item) => item.id && item.title);

  const selected = pickBestMatch(candidates, query) ?? candidates[0];
  if (!selected) {
    throw new Error('No products found that match this description.');
  }

  const numericId = selected.id.replace(/^PLID/i, '');
  return {
    plid: selected.id,
    productUrl: `${TAKEALOT_ORIGIN}/${selected.slug}/PLID${numericId}`,
    searchUrl,
  };
}

async function fetchProductDetails(
  plid: string,
  offerPref?: 'lowest_priced' | 'fastest',
  variantParams?: Record<string, string>
): Promise<ProductDetailsResponse> {
  const url = new URL(`${TAKEALOT_PRODUCT_DETAILS_ENDPOINT}/${plid}`);
  url.searchParams.set('platform', 'desktop');
  url.searchParams.set('display_credit', 'true');
  for (const [key, value] of Object.entries(variantParams ?? {})) {
    url.searchParams.set(key, value);
  }
  if (offerPref) {
    url.searchParams.set('offer_pref', offerPref);
  }

  const response = await fetch(url, {
    headers: {
      ...API_HEADERS,
      Referer: `${TAKEALOT_ORIGIN}/-/` + plid,
    },
  });

  if (!response.ok) {
    throw new Error(`Takealot product details request failed with status ${response.status}`);
  }

  return (await response.json()) as ProductDetailsResponse;
}

function mapPreferredResponseToOffer(
  payload: ProductDetailsResponse,
  preference: string
): OfferHighlight | null {
  const selected = payload.buybox?.items?.find((item) => item.is_selected) ?? payload.buybox?.items?.[0];
  if (!selected) {
    return null;
  }

  const label =
    selected.offer_detail?.display_text?.trim() ||
    (preference === 'lowest_priced'
      ? 'Best Price'
      : preference === 'fastest'
        ? 'Fastest Delivery'
        : 'Current Offer');
  if (!label) {
    return null;
  }

  const deliveryPromise =
    selected.stock_availability?.estimated_delivery?.estimated_dates?.trim() ||
    selected.stock_availability?.status?.trim() ||
    undefined;

  const locationCodes = (selected.stock_availability?.distribution_centres ?? [])
    .map((item) => item.text?.trim())
    .filter((value): value is string => Boolean(value));
  const locationDetails = (selected.stock_availability?.distribution_centres ?? [])
    .map((item) => item.description?.trim())
    .filter((value): value is string => Boolean(value));

  const sellerName = payload.seller_detail?.display_name?.trim() || null;
  const sellerLink = buildSellerLink(payload.seller_detail);

  return {
    kind:
      preference === 'lowest_priced'
        ? 'best-price'
        : preference === 'fastest'
          ? 'fastest-delivery'
          : 'other',
    label,
    priceText: selected.pretty_price ?? undefined,
    listPriceText:
      typeof selected.listing_price === 'number' ? formatRand(selected.listing_price) : undefined,
    currency: 'R',
    price: typeof selected.price === 'number' ? selected.price : null,
    listPrice: typeof selected.listing_price === 'number' ? selected.listing_price : null,
    deliveryPromise,
    locationCodes,
    locationDetails,
    sellerName,
    sellerLink,
    sellerRating: payload.seller_detail?.seller_reviews?.average_star_rating ?? null,
    sellerReviewCount: payload.seller_detail?.seller_reviews?.total_count_value ?? null,
    availabilityStatus: selected.stock_availability?.status?.trim() || undefined,
  };
}

function extractProductInsights(payload: ProductDetailsResponse): Array<{ label: string; value: string }> {
  const ignored = new Set(['Categories', 'Barcode']);
  return (payload.product_information?.items ?? [])
    .map((item) => ({
      label: item.display_name?.trim() ?? '',
      value: cleanDisplayValue(item.displayable_text ?? ''),
    }))
    .filter((item) => item.label && item.value && !ignored.has(item.label))
    .slice(0, 8);
}

function extractVariants(payload: ProductDetailsResponse) {
  return (payload.variants?.selectors ?? [])
    .map((selector) => {
      const options = (selector.options ?? [])
        .map((option) => {
          const name = option.value?.name?.trim() || option.value?.value?.trim() || '';
          if (!name) {
            return null;
          }

          return {
            name,
            value: option.value?.value?.trim() || name,
            isSelected: Boolean(option.is_selected),
            isEnabled: option.is_enabled !== false,
            imageUrl: normalizeImageUrl(option.image?.[0] ?? null),
            productUrl: normalizeProductUrl(option.desktop_href),
          };
        })
        .filter((option): option is NonNullable<typeof option> => Boolean(option));

      if (options.length === 0) {
        return null;
      }

      return {
        label: selector.title?.trim() || selector.call_to_action?.trim() || 'Variation',
        type: selector.selector_type?.trim() || 'variant',
        selected: options.find((option) => option.isSelected)?.name ?? null,
        options,
      };
    })
    .filter((selector): selector is NonNullable<typeof selector> => Boolean(selector));
}

function cleanDisplayValue(value: string): string {
  return value
    .replace(/\\-/g, '-')
    .replace(/\\([()])/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^\-\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSellerLink(sellerDetail?: SellerDetail | null): string | null {
  const path = sellerDetail?.link_data?.path;
  if (!path) {
    return null;
  }

  let resolvedPath = path;
  for (const [key, value] of Object.entries(sellerDetail?.link_data?.fields ?? {})) {
    resolvedPath = resolvedPath.replace(`{${key}}`, value ?? '');
  }

  return normalizeProductUrl(`${TAKEALOT_ORIGIN}${resolvedPath}`);
}

function pickBestMatch(
  candidates: Array<{ id: string; title: string; slug: string }>,
  query: string
): { id: string; title: string; slug: string } | null {
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
      if (normalizeSlug(candidate.slug).includes(normalizedSlugQuery)) {
        return candidate;
      }
    }
  }

  for (const candidate of candidates) {
    if (normalizeForMatch(candidate.title) === normalizedQuery) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    if (normalizeForMatch(candidate.title).includes(normalizedQuery)) {
      return candidate;
    }
  }

  return null;
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
    const payload = await fetchProductOffers({
      query: normalizedProductUrl ? undefined : (searchTerm || undefined),
      productUrl: normalizedProductUrl ?? (productUrlParam || undefined),
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

  return url.toString();
}

function extractVariantParams(value?: string | null): Record<string, string> {
  if (!value) {
    return {};
  }

  try {
    const url = value.startsWith('http') ? new URL(value) : new URL(`https://${value}`);
    const params: Record<string, string> = {};
    for (const [key, rawValue] of url.searchParams.entries()) {
      if (/variant/i.test(key) || key === 'colour' || key === 'color') {
        params[key] = rawValue;
      }
    }
    return params;
  } catch {
    return {};
  }
}

function extractPlid(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const match = value.match(/PLID\d+/i);
  return match?.[0]?.toUpperCase() ?? null;
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

function normalizeImageUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace('{size}', 'pdpxl');
}

function formatRand(value: number): string {
  return `R ${value.toLocaleString('en-ZA')}`;
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
