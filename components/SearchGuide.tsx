import React from 'react';

const SearchGuide: React.FC = () => {
  return (
    <div className="mt-12 mx-auto max-w-lg rounded-lg border border-gray-700 bg-gray-800/50 p-5 text-gray-300 sm:p-6">
      <h3 className="mb-4 text-xl font-bold text-brand-cyan">How To Use Seller Lookup</h3>
      <p className="mb-4">Use seller mode when you want to inspect one seller's full Takealot catalogue.</p>
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
