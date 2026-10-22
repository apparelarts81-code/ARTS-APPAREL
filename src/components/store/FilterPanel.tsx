import React from 'react';
import { Category } from '../../types/database';
import { CatalogFilterOptions } from '../../services/catalogService';
import { useLanguage } from '../../i18n/LanguageProvider';

interface FilterPanelProps {
  categories: Category[];
  filters: CatalogFilterOptions;
  onChange: (filters: CatalogFilterOptions) => void;
  onClear: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  filters,
  onChange,
  onClear,
}) => {
  const { language } = useLanguage();

  const sizes = ['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42'];
  const fabrics = ['Tropical', 'Cotton', 'Velvet', 'Raw Silk', 'Wool', 'Lawn'];

  const handleCategoryClick = (slug: string) => {
    onChange({
      ...filters,
      categorySlug: filters.categorySlug === slug ? undefined : slug,
    });
  };

  const handleSizeClick = (size: string) => {
    onChange({
      ...filters,
      size: filters.size === size ? undefined : size,
    });
  };

  const handleFabricClick = (fab: string) => {
    onChange({
      ...filters,
      fabric: filters.fabric === fab ? undefined : fab,
    });
  };

  return (
    <div className="space-y-6 text-xs text-white">
      {/* Active filters header / clear */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <span className="font-serif font-bold uppercase tracking-wider text-sm">Filters</span>
        <button
          onClick={onClear}
          className="text-[11px] text-[#E31B23] hover:underline uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-300 mb-3">
          Categories
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isSelected = filters.categorySlug === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`w-full text-left py-1.5 px-2 rounded flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#E31B23] text-white font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>{language === 'ur' ? cat.name_ur : cat.name_en}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-neutral-800" />

      {/* Size Selector */}
      <div>
        <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-300 mb-3">
          Size
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((s) => {
            const isSelected = filters.size === s;
            return (
              <button
                key={s}
                onClick={() => handleSizeClick(s)}
                className={`py-2 text-center rounded border transition-colors ${
                  isSelected
                    ? 'border-[#E31B23] bg-[#E31B23] text-white font-bold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-neutral-800" />

      {/* Fabric */}
      <div>
        <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-300 mb-3">
          Fabric
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {fabrics.map((f) => {
            const isSelected = filters.fabric === f;
            return (
              <button
                key={f}
                onClick={() => handleFabricClick(f)}
                className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                  isSelected
                    ? 'border-[#E31B23] bg-[#E31B23] text-white font-bold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-neutral-800" />

      {/* Quick Toggles */}
      <div className="space-y-2.5 pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={!!filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 accent-[#E31B23] rounded bg-neutral-900 border-neutral-700"
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white">
          <input
            type="checkbox"
            checked={!!filters.onSaleOnly}
            onChange={(e) => onChange({ ...filters, onSaleOnly: e.target.checked })}
            className="w-4 h-4 accent-[#E31B23] rounded bg-neutral-900 border-neutral-700"
          />
          <span className="text-[#E31B23] font-medium">On Sale Only</span>
        </label>
      </div>
    </div>
  );
};
