import { Product, Category } from '../types/database';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';

export interface CatalogFilterOptions {
  categoryId?: string;
  categorySlug?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  searchQuery?: string;
}

const STORAGE_KEY_CATEGORIES = 'arts_apparel_categories';
const STORAGE_KEY_PRODUCTS = 'arts_apparel_products';

function loadCategories(): Category[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_CATEGORIES];
}

function loadProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_PRODUCTS];
}

let inMemoryCategories: Category[] = loadCategories();
let inMemoryProducts: Product[] = loadProducts();

function saveCategories() {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(inMemoryCategories));
  } catch {}
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(inMemoryProducts));
  } catch {}
}

export const catalogService = {
  async getCategories(includeInactive = false): Promise<Category[]> {
    if (!isDemoMode && supabase) {
      let query = supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data;
    }
    return includeInactive ? [...inMemoryCategories] : inMemoryCategories.filter((c) => c.is_active);
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories(true);
    return categories.find((c) => c.slug === slug) || null;
  },

  async addCategory(cat: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    inMemoryCategories = [...inMemoryCategories, newCat];
    saveCategories();
    if (!isDemoMode && supabase) {
      await supabase.from('categories').insert([newCat]);
    }
    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<boolean> {
    inMemoryCategories = inMemoryCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
    saveCategories();
    if (!isDemoMode && supabase) {
      await supabase.from('categories').update(updates).eq('id', id);
    }
    return true;
  },

  async deleteCategory(id: string): Promise<boolean> {
    inMemoryCategories = inMemoryCategories.filter((c) => c.id !== id);
    saveCategories();
    if (!isDemoMode && supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
    return true;
  },

  async getProducts(filters?: CatalogFilterOptions): Promise<Product[]> {
    let list = [...inMemoryProducts];

    if (!isDemoMode && supabase) {
      const { data } = await supabase
        .from('products')
        .select('*, images:product_images(*), variants:product_variants(*)')
        .eq('is_active', true);
      if (data && data.length > 0) {
        list = data;
      }
    }

    if (!filters) return list;

    if (filters.categorySlug) {
      const cat = inMemoryCategories.find((c) => c.slug === filters.categorySlug);
      if (cat) {
        list = list.filter((p) => p.category_id === cat.id);
      }
    } else if (filters.categoryId) {
      list = list.filter((p) => p.category_id === filters.categoryId);
    }

    if (filters.inStockOnly) {
      list = list.filter((p) => p.variants?.some((v) => v.stock_qty > 0));
    }

    if (filters.onSaleOnly) {
      list = list.filter((p) => p.sale_price !== null && p.sale_price < p.base_price);
    }

    if (filters.size) {
      list = list.filter((p) =>
        p.variants?.some((v) => v.size.toLowerCase() === filters.size!.toLowerCase())
      );
    }

    if (filters.color) {
      list = list.filter((p) =>
        p.variants?.some((v) => v.color.toLowerCase().includes(filters.color!.toLowerCase()))
      );
    }

    if (filters.fabric) {
      list = list.filter((p) =>
        p.fabric.toLowerCase().includes(filters.fabric!.toLowerCase())
      );
    }

    if (filters.minPrice !== undefined) {
      list = list.filter((p) => {
        const price = p.sale_price ?? p.base_price;
        return price >= filters.minPrice!;
      });
    }

    if (filters.maxPrice !== undefined) {
      list = list.filter((p) => {
        const price = p.sale_price ?? p.base_price;
        return price <= filters.maxPrice!;
      });
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((p) =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_ur.includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'price_asc':
          list.sort((a, b) => (a.sale_price ?? a.base_price) - (b.sale_price ?? b.base_price));
          break;
        case 'price_desc':
          list.sort((a, b) => (b.sale_price ?? b.base_price) - (a.sale_price ?? a.base_price));
          break;
        case 'popular':
          list.sort((a, b) => b.sold_count - a.sold_count);
          break;
      }
    }

    return list;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find((p) => p.slug === slug) || null;
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sold_count' | 'rating_avg' | 'rating_count'>): Promise<Product> {
    const newProd: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      sold_count: 0,
      rating_avg: 5.0,
      rating_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryProducts = [newProd, ...inMemoryProducts];
    saveProducts();
    if (!isDemoMode && supabase) {
      await supabase.from('products').insert([newProd]);
    }
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    inMemoryProducts = inMemoryProducts.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveProducts();
    if (!isDemoMode && supabase) {
      await supabase.from('products').update(updates).eq('id', id);
    }
    return true;
  },

  async deleteProduct(id: string): Promise<boolean> {
    inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);
    saveProducts();
    if (!isDemoMode && supabase) {
      await supabase.from('products').delete().eq('id', id);
    }
    return true;
  },

  async decrementVariantStock(variantId: string, quantity: number): Promise<boolean> {
    let modified = false;
    inMemoryProducts = inMemoryProducts.map((p) => {
      if (!p.variants) return p;
      const variantIndex = p.variants.findIndex((v) => v.id === variantId);
      if (variantIndex === -1) return p;
      modified = true;
      const updatedVariants = [...p.variants];
      const target = updatedVariants[variantIndex];
      updatedVariants[variantIndex] = {
        ...target,
        stock_qty: Math.max(0, target.stock_qty - quantity),
      };
      return {
        ...p,
        variants: updatedVariants,
        sold_count: (p.sold_count || 0) + quantity,
      };
    });
    if (modified) {
      saveProducts();
    }
    return modified;
  },

  async restoreVariantStock(variantId: string, quantity: number): Promise<boolean> {
    let modified = false;
    inMemoryProducts = inMemoryProducts.map((p) => {
      if (!p.variants) return p;
      const variantIndex = p.variants.findIndex((v) => v.id === variantId);
      if (variantIndex === -1) return p;
      modified = true;
      const updatedVariants = [...p.variants];
      const target = updatedVariants[variantIndex];
      updatedVariants[variantIndex] = {
        ...target,
        stock_qty: target.stock_qty + quantity,
      };
      return {
        ...p,
        variants: updatedVariants,
        sold_count: Math.max(0, (p.sold_count || 0) - quantity),
      };
    });
    if (modified) {
      saveProducts();
    }
    return modified;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter((p) => p.is_featured);
  },

  async getNewArrivals(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter((p) => p.is_new_arrival);
  },

  async getSaleProducts(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter((p) => p.sale_price !== null && p.sale_price < p.base_price);
  },
};
