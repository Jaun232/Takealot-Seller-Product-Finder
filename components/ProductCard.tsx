
import React, { useState } from 'react';
import { Product } from '../types';
import ProductComparisonLinks from './ProductComparisonLinks';

interface ProductCardProps {
  product: Product;
  onInspect?: (product: Product) => void;
  inspectLabel?: string;
  isSelected?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onInspect,
  inspectLabel = 'Open analysis',
  isSelected = false,
}) => {
  const formattedPrice = `${product.currency} ${product.price.toFixed(2)}`;
  const [showComparisons, setShowComparisons] = useState<boolean>(false);

  return (
    <article
      className={`surface-card overflow-hidden rounded-[24px] transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-brand-cyan shadow-cyan-500/20' : ''
      }`}
    >
      <div className="relative h-44 w-full overflow-hidden bg-[var(--bg-muted)] sm:h-48">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-3 p-3.5 sm:p-4">
        <div className="flex-1">
          {product.brand && (
            <p className="mb-1 text-xs uppercase tracking-wide text-accent">{product.brand}</p>
          )}
          {typeof product.opportunityScore === 'number' && (
            <p className="mb-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 sm:text-[11px]">
              Opportunity Score {product.opportunityScore}/100
            </p>
          )}
          <h3 className="line-clamp-2 text-[15px] font-semibold sm:text-lg" title={product.name}>
            {product.name}
          </h3>
          <p className="text-muted mt-2 min-h-10 line-clamp-2 text-sm">{product.description}</p>
          {product.sourceQuery && (
            <p className="text-faint mt-2 text-xs">Discovery theme: {product.sourceQuery}</p>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold text-accent">{formattedPrice}</p>
          {onInspect && (
            <button
              type="button"
              onClick={() => onInspect(product)}
            className="button-primary mt-3 block w-full rounded-xl py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-300"
            >
              {inspectLabel}
            </button>
          )}
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`button-secondary block w-full rounded-xl py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${
              onInspect ? 'mt-2' : 'mt-3'
            }`}
          >
            View on Takealot
          </a>
          <button
            type="button"
            onClick={() => setShowComparisons((prev) => !prev)}
            className="button-ghost mt-2 w-full rounded-xl py-2.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-300"
          >
            {showComparisons ? 'Hide price comparison' : 'Compare prices'}
          </button>
          {showComparisons && <div className="mt-3"><ProductComparisonLinks productName={product.name} /></div>}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
