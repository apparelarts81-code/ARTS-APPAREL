import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import { Category, Product } from '../types/database';
import { ProductGrid } from '../components/store/ProductGrid';
import { useLanguage } from '../i18n/LanguageProvider';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    catalogService.getCategoryBySlug(slug).then((cat) => {
      setCategory(cat);
      if (cat) {
        catalogService.getProducts({ categorySlug: slug }).then((prods) => {
          setProducts(prods);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });
  }, [slug]);

  if (!isLoading && !category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white">
        <h2 className="font-serif text-3xl font-bold mb-4">Category Not Found</h2>
        <Link to="/shop" className="text-[#E31B23] underline text-sm">
          Return to All Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white">
      {/* Category Header with Hero Image background */}
      {category && (
        <div className="relative rounded-[8px] overflow-hidden bg-neutral-900 border border-neutral-800 p-8 sm:p-12">
          {category.image_url && (
            <img
              src={category.image_url}
              alt={category.name_en}
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
          )}
          <div className="relative z-10 max-w-xl space-y-2">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23]">
              Curated Category
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white">
              {language === 'ur' ? category.name_ur : category.name_en}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300">
              Explore our master-tailored {category.name_en} pieces made from Pakistan's most refined textiles.
            </p>
          </div>
        </div>
      )}

      {/* Products in this category */}
      <ProductGrid products={products} isLoading={isLoading} />
    </div>
  );
};
