import { Product, Category, ProductVariant } from '../types/database';
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

const STORAGE_KEY_CATEGORIES = 'arts_demo_categories';
const STORAGE_KEY_PRODUCTS = 'arts_demo_products';

function loadDemoCategories(): Category[] {
  if (typeof window === 'undefined') return [...DEMO_CATEGORIES];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_CATEGORIES];
}

function loadDemoProducts(): Product[] {
  if (typeof window === 'undefined') return [...DEMO_PRODUCTS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_PRODUCTS];
}

let inMemoryCategories: Category[] = loadDemoCategories();
let inMemoryProducts: Product[] = loadDemoProducts();

function saveDemoCategories() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(inMemoryCategories));
  } catch {}
}

function saveDemoProducts() {
  if (typeof window === 'undefined') return;
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
      if (error) {
        throw new Error(`Failed to fetch categories: ${error.message}`);
      }
      // Return authoritative DB data even if empty; never fall back to fake demo data in production
      return data || [];
    }

    if (isDemoMode) {
      return includeInactive ? [...inMemoryCategories] : inMemoryCategories.filter((c) => c.is_active);
    }

    return [];
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single();
      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch category by slug: ${error.message}`);
      }
      return data || null;
    }

    const categories = await this.getCategories(true);
    return categories.find((c) => c.slug === slug) || null;
  },

  async addCategory(cat: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name_en: cat.name_en.trim(),
          name_ur: cat.name_ur?.trim() || null,
          slug: cat.slug.trim(),
          image_url: cat.image_url || null,
          sort_order: cat.sort_order ?? 0,
          is_active: cat.is_active ?? true,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create category: ${error.message}`);
      }
      return data as Category;
    }

    if (isDemoMode) {
      const newCat: Category = {
        ...cat,
        id: `cat-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      inMemoryCategories = [...inMemoryCategories, newCat];
      saveDemoCategories();
      return newCat;
    }

    throw new Error('Database connection is not configured.');
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('categories').update(updates).eq('id', id);
      if (error) {
        throw new Error(`Failed to update category: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryCategories = inMemoryCategories.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveDemoCategories();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete category: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryCategories = inMemoryCategories.filter((c) => c.id !== id);
      saveDemoCategories();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async getProducts(filters?: CatalogFilterOptions): Promise<Product[]> {
    let list: Product[] = [];

    if (!isDemoMode && supabase) {
      let query = supabase
        .from('products')
        .select('*, images:product_images(*), variants:product_variants(*)');

      if (filters?.categorySlug) {
        // Resolve slug to category_id
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', filters.categorySlug).single();
        if (cat?.id) {
          query = query.eq('category_id', cat.id);
        }
      } else if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
      list = data || [];
    } else if (isDemoMode) {
      list = [...inMemoryProducts];
      if (filters?.categorySlug) {
        const cat = inMemoryCategories.find((c) => c.slug === filters.categorySlug);
        if (cat) {
          list = list.filter((p) => p.category_id === cat.id);
        }
      } else if (filters?.categoryId) {
        list = list.filter((p) => p.category_id === filters.categoryId);
      }
    } else {
      return [];
    }

    if (!filters) return list;

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
        (p.name_ur && p.name_ur.includes(q)) ||
        p.fabric.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
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
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*), variants:product_variants(*)')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to load product: ${error.message}`);
      }
      return data || null;
    }

    const products = await this.getProducts();
    return products.find((p) => p.slug === slug) || null;
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'sold_count' | 'rating_avg' | 'rating_count'>): Promise<Product> {
    if (!isDemoMode && supabase) {
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .insert([{
          name_en: product.name_en,
          name_ur: product.name_ur || null,
          slug: product.slug,
          category_id: product.category_id,
          fabric: product.fabric,
          base_price: product.base_price,
          sale_price: product.sale_price || null,
          description_en: product.description_en,
          description_ur: product.description_ur || null,
          tags: product.tags || [],
          seo_title: product.seo_title || null,
          seo_description: product.seo_description || null,
          is_featured: product.is_featured ?? false,
          is_new_arrival: product.is_new_arrival ?? true,
          is_active: product.is_active ?? true,
        }])
        .select()
        .single();

      if (prodErr || !prodData) {
        throw new Error(`Failed to insert product: ${prodErr?.message || 'Unknown database error'}`);
      }

      // Insert images if present
      if (product.images && product.images.length > 0) {
        const imageRows = product.images.map((img, idx) => ({
          product_id: prodData.id,
          url: img.url,
          alt_text: img.alt_text || product.name_en,
          sort_order: idx + 1,
        }));
        const { error: imgErr } = await supabase.from('product_images').insert(imageRows);
        if (imgErr) console.warn('Product images insert warning:', imgErr.message);
      }

      // Insert variants if present
      if (product.variants && product.variants.length > 0) {
        const variantRows = product.variants.map((v) => ({
          product_id: prodData.id,
          size: v.size,
          color: v.color,
          color_hex: v.color_hex || null,
          sku: v.sku || `ARTS-${prodData.id.slice(0, 4)}-${v.size}`,
          price_override: v.price_override || null,
          stock_qty: v.stock_qty,
          is_active: v.is_active ?? true,
        }));
        const { error: varErr } = await supabase.from('product_variants').insert(variantRows);
        if (varErr) console.warn('Product variants insert warning:', varErr.message);
      }

      return prodData as Product;
    }

    if (isDemoMode) {
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
      saveDemoProducts();
      return newProd;
    }

    throw new Error('Database connection is not configured.');
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      delete payload.images;
      delete payload.variants;

      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) {
        throw new Error(`Failed to update product: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryProducts = inMemoryProducts.map((p) => (p.id === id ? { ...p, ...updates } : p));
      saveDemoProducts();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      // Products with existing order references should be soft-deactivated per PRD
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) {
        throw new Error(`Failed to delete or deactivate product: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);
      saveDemoProducts();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async decrementVariantStock(variantId: string, quantity: number): Promise<boolean> {
    // Only executed in Demo Mode on client; in production DB trigger or place_order decrements stock atomically
    if (!isDemoMode) {
      return true;
    }

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
      saveDemoProducts();
    }
    return modified;
  },

  async restoreVariantStock(variantId: string, quantity: number): Promise<boolean> {
    if (!isDemoMode) {
      return true;
    }

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
      saveDemoProducts();
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
