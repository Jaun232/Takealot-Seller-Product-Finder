import React from 'react';
import type { OfferHighlight, ProductOfferSummary } from '../types';
import ProductComparisonLinks from './ProductComparisonLinks';

interface ProductOfferHighlightsProps {
  summary: ProductOfferSummary;
}

const ProductOfferHighlights: React.FC<ProductOfferHighlightsProps> = ({ summary }) => {
  const { product, offers, message, meta } = summary;

  return (
    <section className="bg-gray-800/70 border border-gray-700 rounded-lg p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {product.imageUrl && (
            <img
              src={product.imageUrl.replace('{size}', '400')}
              alt={product.name}
              className="w-20 h-20 rounded-lg object-cover border border-gray-700"
              loading="lazy"
            />
          )}
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-400">Matched product</p>
            <h2 className="text-xl font-semibold text-brand-light">{product.name}</h2>
            <p className="text-xs text-gray-500 mt-1">Query: "{meta.query}"</p>
            {product.sellerName && (
              <p className="text-xs text-gray-400 mt-1">
                Sold by{' '}
                {product.sellerLink ? (
                  <a
                    href={product.sellerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-cyan hover:underline"
                  >
                    {product.sellerName}
                  </a>
                ) : (
                  product.sellerName
                )}
              </p>
            )}
            {(typeof product.sellerRating === 'number' || typeof product.sellerReviewCount === 'number') && (
              <p className="text-xs text-gray-400 mt-1">
                Seller signal:{' '}
                {typeof product.sellerRating === 'number' ? `${product.sellerRating.toFixed(1)}★` : 'No rating'}{' '}
                {typeof product.sellerReviewCount === 'number'
                  ? `from ${product.sellerReviewCount.toLocaleString('en-ZA')} reviews`
                  : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-brand-cyan/60 text-brand-light hover:bg-brand-cyan/20 transition-colors text-sm font-medium"
          >
            View on Takealot
          </a>
          <a
            href={meta.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            View search page
          </a>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-yellow-300/90 bg-yellow-900/20 border border-yellow-700/60 rounded-md px-3 py-2">
          {message}
        </p>
      )}

      <div className="mt-6">
        <ProductComparisonLinks productName={product.name} expanded />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <OfferCard key={offer.kind} offer={offer} />
        ))}
      </div>
    </section>
  );
};

interface OfferCardProps {
  offer: OfferHighlight;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  const formatPrice = () => {
    if (offer.priceText) {
      return offer.priceText;
    }
    if (offer.currency && typeof offer.price === 'number') {
      return `${offer.currency} ${offer.price.toFixed(2)}`;
    }
    return null;
  };

  const formatListPrice = () => {
    if (offer.listPriceText) {
      return offer.listPriceText;
    }
    if (offer.currency && typeof offer.listPrice === 'number') {
      return `${offer.currency} ${offer.listPrice.toFixed(2)}`;
    }
    return null;
  };

  return (
    <article className="border border-gray-700 rounded-lg p-4 bg-gray-900/40">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-brand-cyan/80">
          {offer.label}
        </span>
        <span className="text-[10px] text-gray-500">Takealot widget</span>
      </div>
      <p className="text-2xl font-bold text-brand-light">{formatPrice() ?? 'N/A'}</p>
      {offer.listPrice && offer.listPrice !== offer.price && (
        <p className="text-sm text-gray-500 line-through">{formatListPrice()}</p>
      )}
      {offer.deliveryPromise && (
        <p className="mt-3 text-sm text-gray-300">{offer.deliveryPromise}</p>
      )}
      {offer.availabilityStatus && offer.availabilityStatus !== offer.deliveryPromise && (
        <p className="mt-2 text-xs text-gray-400">{offer.availabilityStatus}</p>
      )}
      {offer.sellerName && (
        <p className="mt-3 text-sm text-gray-300">
          Sold by{' '}
          {offer.sellerLink ? (
            <a
              href={offer.sellerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cyan hover:underline"
            >
              {offer.sellerName}
            </a>
          ) : (
            offer.sellerName
          )}
        </p>
      )}
      {(typeof offer.sellerRating === 'number' || typeof offer.sellerReviewCount === 'number') && (
        <p className="mt-2 text-xs text-gray-400">
          Seller signal:{' '}
          {typeof offer.sellerRating === 'number' ? `${offer.sellerRating.toFixed(1)}★` : 'No rating'}{' '}
          {typeof offer.sellerReviewCount === 'number'
            ? `from ${offer.sellerReviewCount.toLocaleString('en-ZA')} reviews`
            : ''}
        </p>
      )}
      {offer.locationCodes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {offer.locationCodes.map((code) => (
            <span
              key={code}
              className="px-2 py-0.5 text-xs rounded-full border border-brand-cyan/40 text-brand-cyan"
            >
              {code}
            </span>
          ))}
        </div>
      )}
      {offer.locationDetails.length > 0 && (
        <ul className="mt-3 text-xs text-gray-400 list-disc list-inside space-y-1">
          {offer.locationDetails.map((detail, index) => (
            <li key={`${detail}-${index}`}>{detail}</li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default ProductOfferHighlights;
