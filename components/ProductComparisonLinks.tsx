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
    <div className="surface-muted space-y-2 rounded-2xl p-3">
      <p className="text-xs text-muted">Search this product on:</p>
      <div className={expanded ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3' : 'grid gap-2'}>
        {comparisonLinks.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary block w-full rounded-xl py-2 text-center text-sm font-medium transition-colors duration-300"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ProductComparisonLinks;
