
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
          <strong>Use the Exact Product Name:</strong> Copy and paste the full, exact product title from the Takealot page into the search field.
        </li>
        <li>
          <strong>Try Another Product:</strong> If nothing comes up, search with another item you know the seller stocks. The Takealot search API sometimes needs a highly specific match.
        </li>
      </ol>
    </div>
  );
};

export default SearchGuide;
