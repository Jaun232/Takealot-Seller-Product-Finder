
import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SellerSearchFormProps {
  onSearch: (sellerId: string, productName: string) => void;
  isLoading: boolean;
}

const SellerSearchForm: React.FC<SellerSearchFormProps> = ({ onSearch, isLoading }) => {
  const [sellerId, setSellerId] = useState('');
  const [productName, setProductName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sellerId.trim() && productName.trim() && !isLoading) {
      onSearch(sellerId.trim(), productName.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 p-2 bg-gray-800 rounded-lg shadow-md">
      <input
        type="text"
        value={sellerId}
        onChange={(e) => setSellerId(e.target.value)}
        placeholder="Seller ID (numeric, e.g., 25539226)"
        className="w-full sm:w-1/3 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan rounded-md px-3 py-2"
        disabled={isLoading}
      />
      <input
        type="text"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        placeholder="Exact product name from Takealot"
        className="w-full sm:flex-grow bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan rounded-md px-3 py-2"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !sellerId.trim() || !productName.trim()}
        className="w-full sm:w-auto bg-brand-cyan hover:bg-brand-cyan/80 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : (
          <>
            <SearchIcon className="w-5 h-5 mr-2" />
            Search
          </>
        )}
      </button>
    </form>
  );
};

export default SellerSearchForm;
