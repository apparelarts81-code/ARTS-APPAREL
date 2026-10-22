import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService, CatalogFilterOptions } from '../services/catalogService';
import { Category, Product } from '../types/database';
import { ProductGrid } from '../components/store/ProductGrid';
import { FilterPanel } from '../components/store/FilterPanel';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { aiService } from '../services/aiService';
import { useLanguage } from '../i18n/LanguageProvider';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // AI search state
  const [aiSearchInput, setAiSearchInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiUnderstoodChips, setAiUnderstoodChips] = useState<string[]>([]);

  // Filter state synced with URL
  const [filters, setFilters] = useState<CatalogFilterOptions>(() => {
    return {
      categorySlug: searchParams.get('category') || undefined,
      searchQuery: searchParams.get('q') || undefined,
      sortBy: (searchParams.get('sort') as any) || 'newest',
      onSaleOnly: searchParams.get('filter') === 'sale',
      inStockOnly: searchParams.get('stock') === '1',
      size: searchParams.get('size') || undefined,
      fabric: searchParams.get('fabric') || undefined,
    };
  });

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    catalogService.getProducts(filters).then((data) => {
      setProducts(data);
      setIsLoading(false);
    });
  }, [filters]);

  const handleFilterChange = (newFilters: CatalogFilterOptions) => {
    setFilters(newFilters);
    // Sync to URL
    const params = new URLSearchParams();
    if (newFilters.categorySlug) params.set('category', newFilters.categorySlug);
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.sortBy) params.set('sort', newFilters.sortBy);
    if (newFilters.onSaleOnly) params.set('filter', 'sale');
    if (newFilters.size) params.set('size', newFilters.size);
    if (newFilters.fabric) params.set('fabric', newFilters.fabric);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({ sortBy: 'newest' });
    setAiUnderstoodChips([]);
    setSearchParams(new URLSearchParams());
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchInput.trim() || isAiSearching) return;

    setIsAiSearching(true);
    try {
      const result = await aiService.search(aiSearchInput);
      const newFilters = { ...filters };
      const chips: string[] = [];

      if (result.filters?.category_slug) {
        newFilters.categorySlug = result.filters.category_slug;
        chips.push(`Category: ${result.filters.category_slug}`);
      }
      if (result.filters?.color) {
        newFilters.color = result.filters.color;
        chips.push(`Color: ${result.filters.color}`);
      }
      if (result.filters?.size) {
        newFilters.size = result.filters.size;
        chips.push(`Size: ${result.filters.size}`);
      }
      if (result.filters?.max_price) {
        newFilters.maxPrice = result.filters.max_price;
        chips.push(`Max: Rs. ${result.filters.max_price}`);
      }

      setAiUnderstoodChips(chips.length > 0 ? chips : [aiSearchInput]);
      handleFilterChange(newFilters);
    } catch {
      handleFilterChange({ ...filters, searchQuery: aiSearchInput });
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white">
      {/* Top Header & AI Natural Language Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
              {filters.categorySlug
                ? categories.find((c) => c.slug === filters.categorySlug)?.name_en || 'Collection'
                : 'All Menswear'}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Showing {products.length} bespoke pieces engineered for Pakistani gentlemen
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-400 shrink-0">{t('common.sort_by')}:</label>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="bg-[#161616] text-white text-xs border border-neutral-800 rounded px-3 py-2 focus:outline-none focus:border-[#E31B23]"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            {/* Mobile filter button */}
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* AI Natural Language Search Bar */}
        <form onSubmit={handleAiSearch} className="relative flex items-center">
          <input
            type="text"
            value={aiSearchInput}
            onChange={(e) => setAiSearchInput(e.target.value)}
            placeholder='Try natural AI search: e.g. "Black waistcoat under 6000 for wedding" or "Summer white kurta"'
            className="w-full bg-[#141414] border border-neutral-700/80 rounded-[6px] pl-10 pr-28 py-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#E31B23]"
          />
          <span className="absolute left-3.5 text-neutral-400">✨</span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isAiSearching}
            className="absolute right-2 uppercase text-[11px] font-bold"
          >
            AI Search
          </Button>
        </form>

        {/* Understood Filter Chips */}
        {aiUnderstoodChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-neutral-400 font-medium">Understood:</span>
            {aiUnderstoodChips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E31B23]/15 border border-[#E31B23]/40 text-red-200"
              >
                <span>{chip}</span>
              </span>
            ))}
            <button
              onClick={handleClearFilters}
              className="text-xs text-neutral-400 hover:text-white underline ml-2"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block sticky top-28 bg-[#111111] p-6 rounded-[6px] border border-neutral-800">
          <FilterPanel
            categories={categories}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Products"
      >
        <FilterPanel
          categories={categories}
          filters={filters}
          onChange={(f) => {
            handleFilterChange(f);
            setIsMobileFilterOpen(false);
          }}
          onClear={() => {
            handleClearFilters();
            setIsMobileFilterOpen(false);
          }}
        />
      </Drawer>
    </div>
  );
};
