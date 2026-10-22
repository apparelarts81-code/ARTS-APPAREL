import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { catalogService } from '../services/catalogService';
import { Product } from '../types/database';
import { ProductCard } from '../components/store/ProductCard';
import { Button } from '../components/ui/Button';

export const WishlistPage: React.FC = () => {
  const { wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService.getProducts().then((all) => {
      setProducts(all.filter((p) => wishlistIds.includes(p.id)));
      setIsLoading(false);
    });
  }, [wishlistIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white">
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
          My Saved Wishlist
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          {wishlistIds.length} items saved for future tailoring
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs text-neutral-400">Loading wishlist...</p>
      ) : products.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl text-neutral-500">
            ♡
          </div>
          <h3 className="font-serif text-xl font-bold">Your wishlist is currently empty</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Save items you love by clicking the heart icon on any garment card.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="sm">
              Discover Collections
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
