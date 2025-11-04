
import React, { useMemo, useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const formattedPrice = `${product.currency} ${product.price.toFixed(2)}`;
  const [showComparisons, setShowComparisons] = useState<boolean>(false);

  const comparisonLinks = useMemo(() => {
    const encodedName = encodeURIComponent(product.name);
    return [
      {
        label: 'Google Shopping',
        url: `https://www.google.com/search?tbm=shop&q=${encodedName}`,
      },
      {
        label: 'Google Search',
        url: `https://www.google.com/search?q=${encodedName}+best+price`,
      },
      {
        label: 'Amazon',
        url: `https://www.amazon.com/s?k=${encodedName}`,
      },
      {
        label: 'Temu',
        url: `https://www.temu.com/search_result.html?search_key=${encodedName}`,
      },
      {
        label: 'Shein',
        url: `https://www.shein.com/search/${encodedName}.html`,
      },
      {
        label: 'Alibaba',
        url: `https://www.alibaba.com/trade/search?fsb=y&IndexArea=product_en&SearchText=${encodedName}`,
      },
    ];
  }, [product.name]);

  return (
    <article className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1">
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
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-3 text-center bg-brand-blue hover:bg-brand-cyan text-white font-semibold py-2 rounded-md transition-colors duration-300"
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
          {showComparisons && (
            <div className="mt-3 space-y-2 bg-gray-900/60 border border-gray-700 rounded-md p-3">
              <p className="text-xs text-gray-400">Search this product on:</p>
              <div className="grid gap-2">
                {comparisonLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-light text-sm font-medium py-2 rounded-md transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
