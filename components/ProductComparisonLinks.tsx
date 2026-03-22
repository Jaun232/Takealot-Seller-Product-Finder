import React, { useMemo } from 'react';

interface ProductComparisonLinksProps {
  productName: string;
  expanded?: boolean;
}

const ProductComparisonLinks: React.FC<ProductComparisonLinksProps> = ({
  productName,
  expanded = false,
}) => {
  const comparisonLinks = useMemo(() => {
    const encodedName = encodeURIComponent(productName);
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
  }, [productName]);

  return (
    <div className="space-y-2 bg-gray-900/60 border border-gray-700 rounded-md p-3">
      <p className="text-xs text-gray-400">Search this product on:</p>
      <div className={expanded ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-2'}>
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
  );
};

export default ProductComparisonLinks;
