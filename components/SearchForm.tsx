import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';

export type SearchMode = 'seller' | 'product';

interface SearchFormProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onSellerSearch: (sellerId: string) => void;
  onProductSearch: (description: string) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  mode,
  onModeChange,
  onSellerSearch,
  onProductSearch,
  isLoading,
}) => {
  const [sellerId, setSellerId] = useState('');
  const [productDescription, setProductDescription] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (mode === 'seller') {
      const trimmed = sellerId.trim();
      if (!trimmed) return;
      onSellerSearch(trimmed);
    } else {
      const trimmed = productDescription.trim();
      if (!trimmed) return;
      onProductSearch(trimmed);
    }
  };

  const isSellerMode = mode === 'seller';
  const disableSubmit = isLoading || (isSellerMode ? !sellerId.trim() : !productDescription.trim());
  const placeholder = isSellerMode
    ? 'Seller ID (numeric, e.g., 25539226)'
    : 'Search a product title, keyword, PLID URL, or full Takealot product URL';
  const label = isSellerMode ? 'Seller ID' : 'Product search';
  const submitLabel = isSellerMode ? 'Load catalogue' : 'Find products';

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-3 rounded-lg bg-gray-800 p-3 shadow-md sm:p-4"
    >
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-gray-700">
        <button
          type="button"
          onClick={() => onModeChange('seller')}
          className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
            isSellerMode ? 'bg-brand-cyan/20 text-brand-light' : 'bg-gray-900 text-gray-400'
          }`}
        >
          Seller Lookup
        </button>
        <button
          type="button"
          onClick={() => onModeChange('product')}
          className={`px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
            !isSellerMode ? 'bg-brand-cyan/20 text-brand-light' : 'bg-gray-900 text-gray-400'
          }`}
        >
          Product Analysis
        </button>
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="search-input">
          {label}
        </label>
        <input
          id="search-input"
          type="text"
          value={isSellerMode ? sellerId : productDescription}
          onChange={(event) =>
            isSellerMode
              ? setSellerId(event.target.value)
              : setProductDescription(event.target.value)
          }
          placeholder={placeholder}
          className="w-full rounded-md bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={disableSubmit}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-md bg-brand-cyan px-4 py-2 font-bold text-white whitespace-nowrap transition-all duration-300 hover:bg-brand-cyan/80 disabled:cursor-not-allowed disabled:bg-gray-500 sm:w-auto sm:min-w-[11.5rem]"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white" />
          ) : (
            <>
              <SearchIcon className="mr-2 h-5 w-5" />
              {submitLabel}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {isSellerMode
          ? "Enter a Takealot seller ID to load that seller's catalogue, then filter and compare products."
          : 'Search Takealot products first, then open the exact listing you want to analyse for sourcing, competition, and buybox signals.'}
      </p>
    </form>
  );
};

export default SearchForm;
