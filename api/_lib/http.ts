import type { VercelResponse } from '@vercel/node';

export function withCors(response: VercelResponse): VercelResponse {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}
