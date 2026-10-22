import React from 'react';
import { Product } from '../../types/database';
import { ProductCard } from './ProductCard';
import { Skeleton } from '../ui/Skeleton';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="w-full aspect-[4/5] rounded" />
            <Skeleton className="w-3/4 h-4 mt-2" />
            <Skeleton className="w-1/2 h-3" />
            <Skeleton className="w-1/3 h-4" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl text-neutral-500 mb-4">
          🔍
        </div>
        <h3 className="font-serif text-xl font-bold text-white mb-2">No garments found</h3>
        <p className="text-xs text-neutral-400 max-w-sm">
          Try adjusting your search criteria, price range, or clearing active filters to view our full collection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
