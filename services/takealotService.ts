import { Product, ProductOfferSummary } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const API_PREFIX = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

interface SellerProductsResponse {
  products: Product[];
  meta?: {
    total?: number;
    sellerId?: string;
    query?: string;
    nextAfter?: string | null;
    hasMore?: boolean;
    page?: number;
  };
}

type ProductOffersResponse = ProductOfferSummary;
const DISCOVERY_REQUEST_TIMEOUT_MS = 8000;

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const searchString = search.toString();
  return searchString ? `?${searchString}` : '';
}

export async function fetchSellerProducts(sellerId: string, productName?: string): Promise<Product[]> {
  const url = `${API_PREFIX}/seller-products${buildQueryString({
    sellerId: sellerId.trim(),
    query: productName?.trim(),
  })}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: SellerProductsResponse = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}

export async function fetchProductSearchResults(query: string, after?: string): Promise<SellerProductsResponse> {
  const url = `${API_PREFIX}/product-search${buildQueryString({
    query: query.trim(),
    after: after?.trim(),
  })}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: SellerProductsResponse = await response.json();
  return {
    products: Array.isArray(data.products) ? data.products : [],
    meta: data.meta,
  };
}

export async function fetchProductOpportunities(page = 0): Promise<SellerProductsResponse> {
  const url = `${API_PREFIX}/product-opportunities${buildQueryString({ page })}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DISCOVERY_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data: SellerProductsResponse = await response.json();
    return {
      products: Array.isArray(data.products) ? data.products : [],
      meta: data.meta,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Product shortlist request timed out.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

interface ProductOfferParams {
  description?: string;
  productUrl?: string;
}

export async function fetchProductOffers(params: ProductOfferParams): Promise<ProductOfferSummary> {
  const url = `${API_PREFIX}/product-offers${buildQueryString({
    query: params.description?.trim(),
    productUrl: params.productUrl?.trim(),
  })}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: ProductOffersResponse = await response.json();
  return data;
}
