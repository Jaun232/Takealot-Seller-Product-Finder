import React, { useState, useCallback, useMemo } from 'react';
import { Product, ProductOfferSummary } from './types';
import { fetchSellerProducts, fetchProductOffers } from './services/takealotService';
import SearchForm, { SearchMode } from './components/SearchForm';
import ProductGrid from './components/ProductGrid';
import Spinner from './components/Spinner';
import SearchGuide from './components/SearchGuide';
import ProductOfferHighlights from './components/ProductOfferHighlights';

const TAKEALOT_HOST_SNIPPET = 'takealot.com';

function buildProductOfferParams(value: string): {
  description?: string;
  productUrl?: string;
} {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (url.hostname.includes(TAKEALOT_HOST_SNIPPET)) {
      return { productUrl: url.toString() };
    }
  } catch {
    // Not a valid URL, fall back to description.
  }

  return { description: trimmed };
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState<boolean>(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);
  const [hasSearchedSeller, setHasSearchedSeller] = useState<boolean>(false);
  const [catalogQuery, setCatalogQuery] = useState<string>('');

  const [productOffers, setProductOffers] = useState<ProductOfferSummary | null>(null);
  const [productOfferError, setProductOfferError] = useState<string | null>(null);
  const [isSearchingOffers, setIsSearchingOffers] = useState<boolean>(false);
  const [hasSearchedOffers, setHasSearchedOffers] = useState<boolean>(false);

  const [searchMode, setSearchMode] = useState<SearchMode>('seller');

  const handleSellerSearch = useCallback(async (sellerId: string) => {
    if (!sellerId) return;

    setHasSearchedSeller(true);
    setIsSearchingProducts(true);
    setProducts([]);
    setProductSearchError(null);
    setCatalogQuery('');

    try {
      const fetchedProducts = await fetchSellerProducts(sellerId);
      if (fetchedProducts.length === 0) {
        setProductSearchError('No products found for this seller. Please check the details and try again.');
      } else {
        setProducts(fetchedProducts);
      }
    } catch (error) {
      console.error('Error fetching seller products:', error);
      setProductSearchError('An error occurred while searching for products. Please try again.');
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  const handleProductSearch = useCallback(async (input: string) => {
    if (!input) return;

    const params = buildProductOfferParams(input);
    if (!params.description && !params.productUrl) {
      setProductOfferError('Please provide a product description or a valid Takealot product URL.');
      return;
    }

    setHasSearchedOffers(true);
    setIsSearchingOffers(true);
    setProductOffers(null);
    setProductOfferError(null);

    try {
      const summary = await fetchProductOffers(params);
      setProductOffers(summary);
    } catch (error) {
      console.error('Error fetching product offers:', error);
      setProductOfferError("Unable to load the product's Best Price / Fastest Delivery info.");
    } finally {
      setIsSearchingOffers(false);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    if (!catalogQuery.trim()) return products;
    const needle = catalogQuery.trim().toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(needle) ||
        product.description.toLowerCase().includes(needle) ||
        (product.brand ? product.brand.toLowerCase().includes(needle) : false)
      );
    });
  }, [catalogQuery, products]);

  const renderSellerContent = () => {
    if (isSearchingProducts) {
      return (
        <div className="mt-20 flex justify-center">
          <Spinner />
        </div>
      );
    }
    if (productSearchError) {
      return (
        <>
          <p className="mt-8 text-center text-red-400">{productSearchError}</p>
          <SearchGuide />
        </>
      );
    }
    if (products.length > 0) {
      return (
        <>
          <div className="mb-6">
            <label htmlFor="catalog-filter" className="block text-sm font-medium text-gray-300 mb-2">
              Filter results
            </label>
            <input
              id="catalog-filter"
              type="text"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search within this seller's catalogue..."
              className="w-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan rounded-md px-3 py-2"
            />
            <p className="mt-2 text-xs text-gray-400">
              Showing {filteredProducts.length} of {products.length} items.
            </p>
          </div>
          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <p className="mt-10 text-center text-gray-400">
              No products match &quot;{catalogQuery}&quot;. Try another keyword.
            </p>
          )}
        </>
      );
    }
    if (hasSearchedSeller) {
      return <SearchGuide />;
    }
    return (
      <div className="mt-20 text-center text-gray-300">
        <h2 className="text-2xl font-bold">Welcome!</h2>
        <p className="mt-2">Enter a Takealot Seller ID to list their catalogue.</p>
      </div>
    );
  };

  const renderProductContent = () => {
    if (isSearchingOffers) {
      return (
        <div className="mt-20 flex justify-center">
          <Spinner />
        </div>
      );
    }
    if (productOfferError) {
      return (
        <div className="mt-8 text-center text-red-400">
          {productOfferError}
          <p className="text-sm text-gray-400 mt-2">
            Make sure the description matches a product that is available on Takealot.
          </p>
        </div>
      );
    }
    if (productOffers && productOffers.offers.length > 0) {
      return (
        <div className="mt-8">
          <ProductOfferHighlights summary={productOffers} />
        </div>
      );
    }
    if (hasSearchedOffers) {
      return (
        <div className="mt-12 max-w-xl mx-auto text-center text-gray-300">
          <h2 className="text-xl font-semibold">No highlighted offers were found.</h2>
          <p className="mt-2 text-sm text-gray-400">
            Try another description or a more specific product title to surface Takealot's Best Price
            and Fastest Delivery sections.
          </p>
        </div>
      );
    }
    return (
      <div className="mt-20 text-center text-gray-300">
        <h2 className="text-2xl font-bold">Compare Takealot offers</h2>
        <p className="mt-2 text-sm text-gray-400">
          Paste a Takealot product URL or describe the item and we will fetch the Best Price and Fastest
          Delivery cards from that listing.
        </p>
      </div>
    );
  };

  const renderContent = () => {
    if (searchMode === 'product') {
      return renderProductContent();
    }
    return renderSellerContent();
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans">
      <header className="bg-brand-blue/20 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-cyan tracking-wider">
            Takealot Seller Product Finder
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Search Takealot directly by seller ID or describe a product to surface the best offers.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <SearchForm
            mode={searchMode}
            onModeChange={setSearchMode}
            onSellerSearch={handleSellerSearch}
            onProductSearch={handleProductSearch}
            isLoading={isSearchingProducts || isSearchingOffers}
          />
        </div>
        <div className="mt-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
