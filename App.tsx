
import React, { useState, useCallback, useMemo } from 'react';
import { Product } from './types';
import { fetchSellerProducts } from './services/takealotService';
import SellerSearchForm from './components/SellerSearchForm';
import ProductGrid from './components/ProductGrid';
import Spinner from './components/Spinner';
import SearchGuide from './components/SearchGuide';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState<boolean>(false);
  const [productSearchError, setProductSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [catalogQuery, setCatalogQuery] = useState<string>('');

  const handleSellerSearch = useCallback(async (sellerId: string) => {
    if (!sellerId) return;
    
    setHasSearched(true);
    setIsSearchingProducts(true);
    setProducts([]);
    setProductSearchError(null);
    setCatalogQuery('');

    try {
      const fetchedProducts = await fetchSellerProducts(sellerId);
      if (fetchedProducts.length === 0) {
        setProductSearchError("No products found for this seller. Please check the details and try again.");
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

  const renderContent = () => {
    if (isSearchingProducts) {
      return <div className="mt-20 flex justify-center"><Spinner /></div>;
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
              No products match "{catalogQuery}". Try another keyword.
            </p>
          )}
        </>
      );
    }
    if (hasSearched) {
       return <SearchGuide />;
    }
    return (
      <div className="mt-20 text-center text-gray-300">
        <h2 className="text-2xl font-bold">Welcome!</h2>
        <p className="mt-2">Enter a Takealot Seller ID to list their catalogue.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light font-sans">
      <header className="bg-brand-blue/20 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-cyan tracking-wider">Takealot Seller Product Finder</h1>
          <p className="text-sm text-gray-400 mt-1">Search Takealot directly by seller ID to surface their current catalogue.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <SellerSearchForm onSearch={handleSellerSearch} isLoading={isSearchingProducts} />
        </div>
        <div className="mt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
