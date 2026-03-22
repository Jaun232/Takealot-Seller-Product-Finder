import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, ProductOfferSummary } from './types';
import { fetchSellerProducts, fetchProductOffers, fetchProductSearchResults } from './services/takealotService';
import SearchForm, { SearchMode } from './components/SearchForm';
import ProductGrid from './components/ProductGrid';
import Spinner from './components/Spinner';
import SearchGuide from './components/SearchGuide';
import ProductOfferHighlights from './components/ProductOfferHighlights';
import { CloseIcon } from './components/icons/CloseIcon';

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

  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productOffers, setProductOffers] = useState<ProductOfferSummary | null>(null);
  const [productOfferError, setProductOfferError] = useState<string | null>(null);
  const [productResultsError, setProductResultsError] = useState<string | null>(null);
  const [isSearchingProductResults, setIsSearchingProductResults] = useState<boolean>(false);
  const [isLoadingSelectedProduct, setIsLoadingSelectedProduct] = useState<boolean>(false);
  const [hasSearchedOffers, setHasSearchedOffers] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastProductQuery, setLastProductQuery] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  const [searchMode, setSearchMode] = useState<SearchMode>('seller');

  useEffect(() => {
    if (!isProductModalOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProductModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isProductModalOpen]);

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
    setIsSearchingProductResults(true);
    setLastProductQuery(input.trim());
    setProductResults([]);
    setSelectedProductId(null);
    setIsProductModalOpen(false);
    setProductOffers(null);
    setProductOfferError(null);
    setProductResultsError(null);

    try {
      if (params.productUrl) {
        const summary = await fetchProductOffers(params);
        setProductOffers(summary);
        setSelectedProductId(summary.product.id);
        setIsProductModalOpen(true);
        setProductResults([
          {
            id: summary.product.id,
            name: summary.product.name,
            description: '',
            price: summary.offers[0]?.price ?? 0,
            currency: summary.offers[0]?.currency ?? 'R',
            imageUrl: summary.product.imageUrl ?? '',
            productUrl: summary.product.productUrl,
            sellerId: '',
          },
        ]);
      } else {
        const results = await fetchProductSearchResults(params.description ?? '');
        if (results.length === 0) {
          setProductResultsError('No products matched that search. Try a more specific product name.');
        } else {
          setProductResults(results);
        }
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setProductResultsError('Unable to search Takealot products right now.');
    } finally {
      setIsSearchingProductResults(false);
    }
  }, []);

  const handleInspectProduct = useCallback(async (product: Product) => {
    setSelectedProductId(product.id);
    setIsLoadingSelectedProduct(true);
    setProductOfferError(null);
    setProductOffers(null);
    setIsProductModalOpen(true);

    try {
      const summary = await fetchProductOffers({ productUrl: product.productUrl });
      setProductOffers(summary);
    } catch (error) {
      console.error('Error fetching selected product offers:', error);
      setProductOfferError("Unable to load the selected product's offer breakdown.");
    } finally {
      setIsLoadingSelectedProduct(false);
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
    if (isSearchingProductResults) {
      return (
        <div className="mt-20 flex justify-center">
          <Spinner />
        </div>
      );
    }
    if (productResultsError) {
      return (
        <div className="mt-8 text-center text-red-400">
          {productResultsError}
          <p className="text-sm text-gray-400 mt-2">
            Use a more specific Takealot listing title or paste the full product URL.
          </p>
        </div>
      );
    }
    if (productResults.length > 0 || productOffers) {
      return (
        <div className="space-y-8">
          <section className="bg-gray-800/60 border border-gray-700 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-brand-light">Matching products</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Found {productResults.length} result{productResults.length === 1 ? '' : 's'} for
                  {' '}“{lastProductQuery}”. Choose a listing to open its sourcing analysis, including
                  buybox position, delivery speed, seller strength, ratings, and comparison links.
                </p>
              </div>
              {selectedProductId && (
                <p className="text-xs text-brand-cyan">Ready to analyse: {selectedProductId}</p>
              )}
            </div>
            <ProductGrid
              products={productResults}
              onInspectProduct={handleInspectProduct}
              inspectLabel="Open analysis"
              selectedProductId={selectedProductId}
            />
          </section>
        </div>
      );
    }
    if (hasSearchedOffers) {
      return (
        <div className="mt-12 max-w-xl mx-auto text-center text-gray-300">
          <h2 className="text-xl font-semibold">No products were found.</h2>
          <p className="mt-2 text-sm text-gray-400">
            Try another description or a more specific product title to surface a list of matching
            Takealot products.
          </p>
        </div>
      );
    }
    return (
      <div className="mt-20 text-center text-gray-300">
        <h2 className="text-2xl font-bold">Analyse Products Before You Source Them</h2>
        <p className="mt-2 text-sm text-gray-400">
          1. Search by product name, keyword, or Takealot URL.
          <br />
          2. Review the matching listings.
          <br />
          3. Open one product to see its sourcing assessment, buybox signals, seller quality, and external comparison links.
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
            isLoading={isSearchingProducts || isSearchingProductResults || isLoadingSelectedProduct}
          />
        </div>
        <div className="mt-8">{renderContent()}</div>
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close product breakdown"
            onClick={() => setIsProductModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 lg:p-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-2xl border border-gray-700 bg-brand-dark shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-700 bg-brand-dark/95 px-5 py-4 backdrop-blur">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Product Analysis</p>
                    <h2 className="text-lg font-semibold text-brand-light">
                      {productOffers?.product.name ?? (selectedProductId ? `Selected: ${selectedProductId}` : 'Loading')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-600 p-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  {isLoadingSelectedProduct && (
                    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-8">
                      <div className="flex items-center gap-3 text-brand-light">
                        <Spinner />
                        <div>
                          <p className="font-semibold">Loading product analysis</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Pulling buybox, delivery, seller, product-quality, and sourcing signals for the selected listing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productOfferError && !isLoadingSelectedProduct && (
                    <div className="text-center text-red-400 py-10">
                      {productOfferError}
                    </div>
                  )}

                  {productOffers && productOffers.offers.length > 0 && !isLoadingSelectedProduct && (
                    <ProductOfferHighlights summary={productOffers} />
                  )}

                  {productOffers && productOffers.offers.length === 0 && !isLoadingSelectedProduct && (
                    <div className="max-w-xl mx-auto text-center text-gray-300 py-10">
                      <h2 className="text-xl font-semibold">No highlighted offers were found.</h2>
                      <p className="mt-2 text-sm text-gray-400">
                        This product resolved correctly, but Takealot did not expose Best Price or Fastest
                        Delivery cards for it.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
