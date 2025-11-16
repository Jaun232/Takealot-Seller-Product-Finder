import http from 'http';
import url from 'url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import sellerHandler from './api/seller-products';
import productOffersHandler from './api/product-offers';

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url ?? '', true);

  let routeHandler: typeof sellerHandler | typeof productOffersHandler | null = null;

  if (parsedUrl.pathname?.startsWith('/api/seller-products')) {
    routeHandler = sellerHandler;
  } else if (parsedUrl.pathname?.startsWith('/api/product-offers')) {
    routeHandler = productOffersHandler;
  }

  if (!routeHandler) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const vercelReq = {
    method: req.method,
    query: parsedUrl.query,
  } as unknown as VercelRequest;

  const vercelRes = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    setHeader(key: string, value: string) {
      res.setHeader(key, value);
    },
    status(code: number) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(data: unknown) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
  } as unknown as VercelResponse;

  try {
    await routeHandler(vercelReq, vercelRes);
  } catch (error) {
    console.error('Local API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Local server error.' }));
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(port, () => {
  console.log(`Local API server listening on http://localhost:${port}`);
});
