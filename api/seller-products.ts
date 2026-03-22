import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from './_lib/http.js';
import { fetchSellerCatalogue } from './_lib/takealot-client.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  withCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const rawSellerId = Array.isArray(request.query.sellerId)
    ? request.query.sellerId[0]
    : request.query.sellerId;
  const rawQuery = Array.isArray(request.query.query) ? request.query.query[0] : request.query.query;
  const sellerId = typeof rawSellerId === 'string' ? rawSellerId.trim() : '';
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

  if (!sellerId) {
    return response.status(400).json({ error: 'sellerId is required' });
  }

  try {
    const products = await fetchSellerCatalogue(sellerId, query);
    return response.status(200).json({
      products,
      meta: {
        sellerId,
        total: products.length,
        source: 'public-api',
      },
    });
  } catch (error) {
    console.error('Failed to fetch seller catalogue:', error);
    return response.status(500).json({
      error: 'Failed to fetch seller catalogue.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
