import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, ProductOfferSummary } from './types';
import {
  fetchSellerProducts,
  fetchListingProducts,
  fetchProductOffers,
  fetchProductSearchResults,
} from './services/takealotService';
import SearchForm, { SearchMode } from './components/SearchForm';
import ProductGrid from './components/ProductGrid';
import Spinner from './components/Spinner';
import SearchGuide from './components/SearchGuide';
import ProductOfferHighlights from './components/ProductOfferHighlights';
import { CloseIcon } from './components/icons/CloseIcon';

const TAKEALOT_HOST_SNIPPET = 'takealot.com';
const FEATURED_LISTS = [
  {
    label: 'New To Takealot Appliances',
    listingUrl: 'https://www.takealot.com/all?custom=new-to-tal-appliances&sort=ReleaseDate%20Descending',
  },
  {
    label: 'Small Appliances',
    listingUrl: 'https://www.takealot.com/home-kitchen/small--appliances',
  },
  {
    label: 'Airfryers',
    listingUrl: 'https://www.takealot.com/airfryers',
  },
  {
    label: 'Top Rated Kettles',
    listingUrl: 'https://www.takealot.com/home-kitchen/kettles-25790?sort=Rating%20Descending',
  },
] as const;

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
  const [productDiscoveryError, setProductDiscoveryError] = useState<string | null>(null);
  const [isSearchingProductResults, setIsSearchingProductResults] = useState<boolean>(false);
  const [isLoadingSelectedProduct, setIsLoadingSelectedProduct] = useState<boolean>(false);
  const [isLoadingProductDiscovery, setIsLoadingProductDiscovery] = useState<boolean>(false);
  const [isLoadingMoreProductResults, setIsLoadingMoreProductResults] = useState<boolean>(false);
  const [hasSearchedOffers, setHasSearchedOffers] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [lastProductQuery, setLastProductQuery] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);

  const [productResultPages, setProductResultPages] = useState<Product[][]>([]);
  const [productResultsNextAfter, setProductResultsNextAfter] = useState<string | null>(null);
  const [currentProductResultsPage, setCurrentProductResultsPage] = useState<number>(0);

  const [discoveryPages, setDiscoveryPages] = useState<Product[][]>([]);
  const [currentDiscoveryPage, setCurrentDiscoveryPage] = useState<number>(0);
  const [hasMoreDiscoveryProducts, setHasMoreDiscoveryProducts] = useState<boolean>(false);
  const [selectedFeaturedList, setSelectedFeaturedList] = useState<string | null>(null);
  const [featuredListNextAfter, setFeaturedListNextAfter] = useState<string | null>(null);

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

  const handleLoadDiscoveryProducts = useCallback(async () => {
    if (isLoadingProductDiscovery) {
      return;
    }

    const selectedListingUrl = selectedFeaturedList ?? FEATURED_LISTS[0]?.listingUrl;
    if (!selectedListingUrl) {
      return;
    }

    if (currentDiscoveryPage < discoveryPages.length - 1) {
      setCurrentDiscoveryPage((current) => current + 1);
      return;
    }

    setIsLoadingProductDiscovery(true);
    setProductDiscoveryError(null);

    try {
      const featured = await fetchListingProducts(
        selectedListingUrl,
        currentDiscoveryPage === 0 && discoveryPages.length === 0 ? undefined : featuredListNextAfter ?? undefined
      );
      setDiscoveryPages((current) => [...current, featured.products]);
      setCurrentDiscoveryPage(discoveryPages.length);
      setHasMoreDiscoveryProducts(Boolean(featured.meta?.nextAfter));
      setFeaturedListNextAfter(featured.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading product opportunities:', error);
      setProductDiscoveryError('Recommended products took too long to load. You can still search manually.');
    } finally {
      setIsLoadingProductDiscovery(false);
    }
  }, [currentDiscoveryPage, discoveryPages.length, featuredListNextAfter, isLoadingProductDiscovery, selectedFeaturedList]);

  const handleSelectFeaturedList = useCallback(async (listingUrl: string) => {
    setSelectedFeaturedList(listingUrl);
    setDiscoveryPages([]);
    setCurrentDiscoveryPage(0);
    setHasMoreDiscoveryProducts(false);
    setFeaturedListNextAfter(null);

    if (isLoadingProductDiscovery) {
      return;
    }

    setIsLoadingProductDiscovery(true);
    setProductDiscoveryError(null);

    try {
      const featured = await fetchListingProducts(listingUrl);
      setDiscoveryPages([featured.products]);
      setCurrentDiscoveryPage(0);
      setHasMoreDiscoveryProducts(Boolean(featured.meta?.nextAfter));
      setFeaturedListNextAfter(featured.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading featured list:', error);
      setProductDiscoveryError('Unable to load that featured list right now.');
    } finally {
      setIsLoadingProductDiscovery(false);
    }
  }, [isLoadingProductDiscovery]);

  const handleClearFeaturedList = useCallback(() => {
    setSelectedFeaturedList(null);
    setDiscoveryPages([]);
    setCurrentDiscoveryPage(0);
    setHasMoreDiscoveryProducts(false);
    setFeaturedListNextAfter(null);
    setProductDiscoveryError(null);
    setSelectedProductId(null);
  }, []);

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
    setProductResultPages([]);
    setSelectedProductId(null);
    setIsProductModalOpen(false);
    setProductOffers(null);
    setProductOfferError(null);
    setProductResultsError(null);
    setProductResultsNextAfter(null);
    setCurrentProductResultsPage(0);

    try {
      if (params.productUrl) {
        const summary = await fetchProductOffers(params);
        setProductOffers(summary);
        setSelectedProductId(summary.product.id);
        setIsProductModalOpen(true);

        const directResult = [
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
        ];

        setProductResults(directResult);
        setProductResultPages([directResult]);
      } else {
        const results = await fetchProductSearchResults(params.description ?? '');
        if (results.products.length === 0) {
          setProductResultsError('No products matched that search. Try a more specific product name.');
        } else {
          setProductResults(results.products);
          setProductResultPages([results.products]);
          setProductResultsNextAfter(results.meta?.nextAfter ?? null);
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

  const handleNextProductResultsPage = useCallback(async () => {
    if (currentProductResultsPage < productResultPages.length - 1) {
      const nextPage = currentProductResultsPage + 1;
      setCurrentProductResultsPage(nextPage);
      setProductResults(productResultPages[nextPage]);
      return;
    }

    if (!lastProductQuery || !productResultsNextAfter || isLoadingMoreProductResults) {
      return;
    }

    setIsLoadingMoreProductResults(true);
    setProductResultsError(null);

    try {
      const results = await fetchProductSearchResults(lastProductQuery, productResultsNextAfter);
      setProductResultPages((current) => [...current, results.products]);
      setCurrentProductResultsPage((current) => current + 1);
      setProductResults(results.products);
      setProductResultsNextAfter(results.meta?.nextAfter ?? null);
    } catch (error) {
      console.error('Error loading more product results:', error);
      setProductResultsError('Unable to load more products right now.');
    } finally {
      setIsLoadingMoreProductResults(false);
    }
  }, [
    currentProductResultsPage,
    isLoadingMoreProductResults,
    lastProductQuery,
    productResultPages,
    productResultsNextAfter,
  ]);

  const handlePreviousProductResultsPage = useCallback(() => {
    if (currentProductResultsPage === 0) {
      return;
    }

    const previousPage = currentProductResultsPage - 1;
    setCurrentProductResultsPage(previousPage);
    setProductResults(productResultPages[previousPage]);
  }, [currentProductResultsPage, productResultPages]);

  const handlePreviousDiscoveryPage = useCallback(() => {
    if (currentDiscoveryPage === 0) {
      return;
    }

    const previousPage = currentDiscoveryPage - 1;
    setCurrentDiscoveryPage(previousPage);
  }, [currentDiscoveryPage]);

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

  const renderPager = (options: {
    currentPage: number;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
    isLoadingNext?: boolean;
  }) => (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={options.onPrevious}
        disabled={!options.hasPrevious}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-cyan/60 text-lg font-semibold text-brand-light transition-colors hover:bg-brand-cyan/20 disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-500"
      >
        {'<'}
      </button>
      <div className="rounded-full border border-gray-700 bg-gray-800/80 px-4 py-2 text-sm font-semibold text-brand-light">
        Page {options.currentPage}
      </div>
      <button
        type="button"
        onClick={options.onNext}
        disabled={!options.hasNext || options.isLoadingNext}
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-brand-cyan/60 px-3 text-lg font-semibold text-brand-light transition-colors hover:bg-brand-cyan/20 disabled:cursor-not-allowed disabled:border-gray-600 disabled:text-gray-500"
      >
        {options.isLoadingNext ? <Spinner /> : '>'}
      </button>
    </div>
  );

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
            <label htmlFor="catalog-filter" className="mb-2 block text-sm font-medium text-gray-300">
              Filter results
            </label>
            <input
              id="catalog-filter"
              type="text"
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder="Search within this seller's catalogue..."
              className="w-full rounded-md bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
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
          <p className="mt-2 text-sm text-gray-400">
            Use a more specific Takealot listing title or paste the full product URL.
          </p>
        </div>
      );
    }
    if (productResults.length > 0) {
      return (
        <div className="space-y-8">
          <section className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-brand-light">Matching products</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Found {productResults.length} result{productResults.length === 1 ? '' : 's'} for{' '}
                  "{lastProductQuery}". Choose a listing to open its sourcing analysis, including
                  buybox position, delivery speed, seller strength, ratings, and comparison links.
                </p>
              </div>
              {selectedProductId && (
                <p className="break-all text-xs text-brand-cyan">Ready to analyse: {selectedProductId}</p>
              )}
            </div>
            <ProductGrid
              products={productResults}
              onInspectProduct={handleInspectProduct}
              inspectLabel="Open analysis"
              selectedProductId={selectedProductId}
            />
            {(productResultPages.length > 1 || productResultsNextAfter) &&
              renderPager({
                currentPage: currentProductResultsPage + 1,
                onPrevious: handlePreviousProductResultsPage,
                onNext: handleNextProductResultsPage,
                hasPrevious: currentProductResultsPage > 0,
                hasNext:
                  currentProductResultsPage < productResultPages.length - 1 ||
                  Boolean(productResultsNextAfter),
                isLoadingNext: isLoadingMoreProductResults,
              })}
          </section>
        </div>
      );
    }

    const discoveryProducts = discoveryPages[currentDiscoveryPage] ?? [];
    if (discoveryProducts.length > 0) {
      const activeFeaturedList = FEATURED_LISTS.find((item) => item.listingUrl === selectedFeaturedList);
      return (
        <div className="space-y-8">
          <section className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-brand-light">Recommended products to review</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {activeFeaturedList
                    ? `Browsing ${activeFeaturedList.label}. Open any product to inspect its sourcing analysis.`
                    : 'This shortlist surfaces 20 products with comparatively stronger public signals across rating, review depth, seller strength, and buybox structure. Open any product to inspect its full sourcing analysis.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-brand-cyan">Page {currentDiscoveryPage + 1}</p>
                <button
                  type="button"
                  onClick={handleClearFeaturedList}
                  className="inline-flex items-center rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-brand-cyan/60 hover:text-brand-light"
                >
                  Back to front page
                </button>
              </div>
            </div>
            <ProductGrid
              products={discoveryProducts}
              onInspectProduct={handleInspectProduct}
              inspectLabel="Open analysis"
              selectedProductId={selectedProductId}
            />
            {(discoveryPages.length > 1 || hasMoreDiscoveryProducts) &&
              renderPager({
                currentPage: currentDiscoveryPage + 1,
                onPrevious: handlePreviousDiscoveryPage,
                onNext: handleLoadDiscoveryProducts,
                hasPrevious: currentDiscoveryPage > 0,
                hasNext: currentDiscoveryPage < discoveryPages.length - 1 || hasMoreDiscoveryProducts,
                isLoadingNext: isLoadingProductDiscovery,
              })}
          </section>
        </div>
      );
    }

    if (hasSearchedOffers) {
      return (
        <div className="mx-auto mt-12 max-w-xl text-center text-gray-300">
          <h2 className="text-xl font-semibold">No products were found.</h2>
          <p className="mt-2 text-sm text-gray-400">
            Try another description or a more specific product title to surface a list of matching
            Takealot products.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-gray-700 bg-gray-800/60 p-5 text-center text-gray-300 sm:p-6">
          <h2 className="text-2xl font-bold">Analyse Products Before You Source Them</h2>
          <p className="mt-2 text-sm text-gray-400">
            1. Search by product name, keyword, or Takealot URL.
            <br />
            2. Review the matching listings.
            <br />
            3. Open one product to see its sourcing assessment, buybox signals, seller quality, and external comparison links.
          </p>
        </section>

        <section className="rounded-lg border border-gray-700 bg-gray-800/40 p-5 text-gray-300 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-brand-light">Featured source lists</h3>
              <p className="mt-1 text-sm text-gray-400">
                Start from one of these curated listing pages, then page forward with the arrows.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURED_LISTS.map((item) => {
                const isActive = selectedFeaturedList === item.listingUrl;
                return (
                  <button
                    key={item.listingUrl}
                    type="button"
                    onClick={() => void handleSelectFeaturedList(item.listingUrl)}
                    disabled={isLoadingProductDiscovery && isActive}
                    className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-brand-cyan bg-brand-cyan/20 text-brand-light'
                        : 'border-gray-700 bg-gray-800/70 text-gray-300 hover:border-brand-cyan/50 hover:bg-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          {productDiscoveryError && (
            <p className="mt-4 rounded-md border border-amber-700/60 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
              {productDiscoveryError}
            </p>
          )}
        </section>
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
    <div className="min-h-screen bg-brand-dark font-sans text-brand-light">
      <header className="sticky top-0 z-10 bg-brand-blue/20 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/6671601.png"
              alt="Takealot Seller Product Finder"
              className="h-12 w-12 rounded-xl border border-brand-cyan/30 object-cover sm:h-14 sm:w-14"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-brand-cyan sm:text-3xl">
                Takealot Seller Product Finder
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Search Takealot directly by seller ID or describe a product to surface the best offers.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-2xl">
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
          <div className="absolute inset-0 overflow-y-auto p-3 sm:p-6 lg:p-10">
            <div className="mx-auto max-w-6xl">
              <div className="rounded-2xl border border-gray-700 bg-brand-dark shadow-2xl">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-700 bg-brand-dark/95 px-4 py-4 backdrop-blur sm:px-5">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Product Analysis</p>
                    <h2 className="break-words text-base font-semibold text-brand-light sm:text-lg">
                      {productOffers?.product.name ?? (selectedProductId ? `Selected: ${selectedProductId}` : 'Loading')}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-600 p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 sm:p-6">
                  {isLoadingSelectedProduct && (
                    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-5 sm:p-8">
                      <div className="flex flex-col gap-3 text-brand-light sm:flex-row sm:items-center">
                        <Spinner />
                        <div>
                          <p className="font-semibold">Loading product analysis</p>
                          <p className="mt-1 text-sm text-gray-400">
                            Pulling buybox, delivery, seller, product-quality, and sourcing signals for the selected listing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {productOfferError && !isLoadingSelectedProduct && (
                    <div className="py-10 text-center text-red-400">
                      {productOfferError}
                    </div>
                  )}

                  {productOffers && productOffers.offers.length > 0 && !isLoadingSelectedProduct && (
                    <ProductOfferHighlights summary={productOffers} />
                  )}

                  {productOffers && productOffers.offers.length === 0 && !isLoadingSelectedProduct && (
                    <div className="mx-auto max-w-xl py-10 text-center text-gray-300">
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
