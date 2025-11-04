import { Product } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const API_PREFIX = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';

interface SellerProductsResponse {
  products: Product[];
  meta?: {
    total?: number;
    sellerId?: string;
    query?: string;
  };
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const searchString = search.toString();
  return searchString ? `?${searchString}` : '';
}

export async function fetchSellerProducts(sellerId: string, productName: string): Promise<Product[]> {
  const url = `${API_PREFIX}/seller-products${buildQueryString({
    sellerId: sellerId.trim(),
    query: productName.trim(),
  })}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: SellerProductsResponse = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}
