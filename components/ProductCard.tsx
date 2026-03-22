
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
      className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
        isSelected ? 'ring-2 ring-brand-cyan shadow-cyan-500/40' : 'hover:shadow-cyan-500/50'
      }`}
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-900">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex-1">
          {product.brand && (
            <p className="text-xs uppercase tracking-wide text-brand-cyan/80 mb-1">{product.brand}</p>
          )}
          <h3 className="text-lg font-semibold text-brand-light truncate" title={product.name}>
            {product.name}
          </h3>
          <p className="text-sm text-gray-400 mt-2 h-10 overflow-hidden">{product.description}</p>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold text-brand-cyan">{formattedPrice}</p>
          {onInspect && (
            <button
              type="button"
              onClick={() => onInspect(product)}
              className="block w-full mt-3 text-center bg-brand-cyan hover:bg-brand-cyan/80 text-white font-semibold py-2 rounded-md transition-colors duration-300"
            >
              {inspectLabel}
            </button>
          )}
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full text-center ${
              onInspect ? 'mt-2' : 'mt-3'
            } bg-brand-blue hover:bg-brand-cyan text-white font-semibold py-2 rounded-md transition-colors duration-300`}
          >
            View on Takealot
          </a>
          <button
            type="button"
            onClick={() => setShowComparisons((prev) => !prev)}
            className="w-full mt-2 text-center border border-brand-cyan/60 text-brand-light hover:bg-brand-cyan/20 font-semibold py-2 rounded-md transition-colors duration-300"
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
