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
      className="surface-card w-full rounded-[28px] p-4 sm:p-5"
    >
      <div className="segmented-shell grid grid-cols-2 overflow-hidden rounded-2xl p-1">
        <button
          type="button"
          onClick={() => onModeChange('seller')}
          className={`px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors rounded-xl sm:px-3 sm:text-sm ${
            isSellerMode ? 'segmented-option-active' : 'segmented-option'
          }`}
        >
          Seller Lookup
        </button>
        <button
          type="button"
          onClick={() => onModeChange('product')}
          className={`px-2 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors rounded-xl sm:px-3 sm:text-sm ${
            !isSellerMode ? 'segmented-option-active' : 'segmented-option'
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
          className="input-shell w-full rounded-2xl px-4 py-3"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={disableSubmit}
          className="button-primary inline-flex w-full shrink-0 items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold whitespace-nowrap transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[11.5rem] sm:text-base"
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

      <p className="text-xs text-muted">
        {isSellerMode
          ? "Enter a Takealot seller ID to load that seller's catalogue, then filter and compare products."
          : 'Search Takealot products first, then open the exact listing you want to analyse for sourcing, competition, and buybox signals.'}
      </p>
    </form>
  );
};

export default SearchForm;
