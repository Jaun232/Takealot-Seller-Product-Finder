
import React from 'react';

const SearchGuide: React.FC = () => {
  return (
    <div className="mt-12 max-w-lg mx-auto bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-gray-300">
      <h3 className="text-xl font-bold text-brand-cyan mb-4">Having Trouble Finding Products?</h3>
      <p className="mb-4">Here are a few tips to improve your search:</p>
      <ol className="list-decimal list-inside space-y-3">
        <li>
          <strong>Find the Seller ID:</strong> On a Takealot product page, look for the "Sold by" section. Click on the seller's name. The URL of the page you land on will contain their numeric ID (e.g. <code>seller_id=25539226</code>). Copy the number after <code>seller_id=</code>.
        </li>
        <li>
          <strong>Refresh the Seller Page:</strong> If the API still returns nothing, confirm the seller has public listings by loading their Takealot storefront directly.
        </li>
        <li>
          <strong>Retry Later:</strong> Newly listed products can take a few minutes to propagate to the public API. Give it another shot if the catalogue recently changed.
        </li>
      </ol>
    </div>
  );
};

export default SearchGuide;
