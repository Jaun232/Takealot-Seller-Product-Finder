
import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onInspectProduct?: (product: Product) => void;
  inspectLabel?: string;
  selectedProductId?: string | null;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onInspectProduct,
  inspectLabel,
  selectedProductId,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onInspect={onInspectProduct}
          inspectLabel={inspectLabel}
          isSelected={selectedProductId === product.id}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
