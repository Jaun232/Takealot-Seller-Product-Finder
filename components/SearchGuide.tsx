
import React from 'react';

const SearchGuide: React.FC = () => {
  return (
    <div className="mt-12 max-w-lg mx-auto bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-gray-300">
      <h3 className="text-xl font-bold text-brand-cyan mb-4">How To Use Seller Lookup</h3>
      <p className="mb-4">Use seller mode when you want to inspect one seller’s full Takealot catalogue.</p>
      <ol className="list-decimal list-inside space-y-3">
        <li>
          <strong>Find the seller ID:</strong> Open any product sold by that seller, click the seller name, then copy the numeric ID from the seller URL.
        </li>
        <li>
          <strong>Load the catalogue:</strong> Paste the seller ID into the search box and click <code>Load catalogue</code>.
        </li>
        <li>
          <strong>Filter inside the results:</strong> Once the catalogue loads, use the filter box to narrow the products you want to inspect.
        </li>
        <li>
          <strong>If nothing appears:</strong> Confirm the seller storefront is public and has active listings, then try again later if the catalogue recently changed.
        </li>
      </ol>
    </div>
  );
};

export default SearchGuide;
