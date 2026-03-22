
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
  opportunityScore?: number;
  sourceQuery?: string;
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
  sellerRating?: number | null;
  sellerReviewCount?: number | null;
  availabilityStatus?: string;
}

export interface ProductInsight {
  label: string;
  value: string;
}

export interface ProductOfferSummary {
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
    insights: ProductInsight[];
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
