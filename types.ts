
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  sellerId: string;
  brand?: string;
}

export type OfferKind = 'best-price' | 'fastest-delivery' | 'other';

export interface OfferHighlight {
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
  sellerName?: string;
  sellerLink?: string;
}

export interface ProductOfferSummary {
  product: {
    id: string;
    name: string;
    productUrl: string;
    imageUrl?: string | null;
    sellerName?: string | null;
    sellerLink?: string | null;
  };
  offers: OfferHighlight[];
  meta: {
    query: string;
    productUrl: string;
    searchUrl: string;
    extractedAt: string;
  };
  message?: string;
}
