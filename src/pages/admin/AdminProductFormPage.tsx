import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { catalogService } from '../../services/catalogService';
import { aiService } from '../../services/aiService';
import { Category, ProductVariant } from '../../types/database';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { DEMO_CATEGORIES } from '../../demo/demoData';

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [fabric, setFabric] = useState('');
  const [basePrice, setBasePrice] = useState('5500');
  const [salePrice, setSalePrice] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: 'v-1', product_id: '', size: 'M', color: 'Black', color_hex: '#111111', sku: 'ARTS-NEW-M', price_override: null, stock_qty: 10, is_active: true },
    { id: 'v-2', product_id: '', size: 'L', color: 'Black', color_hex: '#111111', sku: 'ARTS-NEW-L', price_override: null, stock_qty: 10, is_active: true },
  ]);

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [formNotification, setFormNotification] = useState<string | null>(null);

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
    if (id) {
      catalogService.getProducts().then((all) => {
        const prod = all.find((p) => p.id === id);
        if (prod) {
          setNameEn(prod.name_en);
          setNameUr(prod.name_ur);
          setCategoryId(prod.category_id);
          setFabric(prod.fabric);
          setBasePrice(String(prod.base_price));
          setSalePrice(prod.sale_price ? String(prod.sale_price) : '');
          setDescriptionEn(prod.description_en);
          setDescriptionUr(prod.description_ur);
          setImageUrl(prod.images?.[0]?.url || '');
          setTags(prod.tags.join(', '));
          if (prod.variants) setVariants(prod.variants);
        }
      });
    }
  }, [id]);

  const handleAiDescribe = async () => {
    if (!nameEn) {
      setFormNotification('Please enter a Product Name in English first to generate AI descriptions.');
      return;
    }
    setFormNotification(null);
    setIsAiGenerating(true);
    const cat = categories.find((c) => c.id === categoryId)?.name_en || 'Menswear';
    const res = await aiService.generateProductDescription(nameEn, cat, fabric, [
      'Tailored cut',
      'High-grade finish',
      'Nationwide delivery',
    ]);
    setDescriptionEn(res.description_en);
    setDescriptionUr(res.description_ur);
    setIsAiGenerating(false);
  };

  const handleAiSeo = async () => {
    if (!nameEn) return;
    setIsAiGenerating(true);
    const cat = categories.find((c) => c.id === categoryId)?.name_en || 'Menswear';
    const res = await aiService.generateSeo(nameEn, cat, descriptionEn);
    setSeoTitle(res.seo_title);
    setSeoDescription(res.seo_description);
    setTags(res.tags.join(', '));
    setIsAiGenerating(false);
  };

  const handleGenerateStandardSizes = () => {
    const standardSizes = ['S', 'M', 'L', 'XL'];
    const newVars: ProductVariant[] = standardSizes.map((s, idx) => ({
      id: `v-gen-${idx}`,
      product_id: id || '',
      size: s,
      color: 'Primary',
      color_hex: '#111111',
      sku: `ARTS-${nameEn.slice(0, 3).toUpperCase() || 'ITM'}-${s}`,
      price_override: null,
      stock_qty: 8,
      is_active: true,
    }));
    setVariants(newVars);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const basePriceNum = parseFloat(basePrice) || 0;
    const salePriceNum = salePrice ? parseFloat(salePrice) : null;
    const autoSlug = (nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `garment-${Date.now()}`;
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

    const imagesList = imageUrl.trim()
      ? [{ id: `img-${Date.now()}`, product_id: id || '', url: imageUrl.trim(), alt_text: nameEn, sort_order: 1, created_at: new Date().toISOString() }]
      : [{ id: `img-${Date.now()}`, product_id: id || '', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900', alt_text: nameEn, sort_order: 1, created_at: new Date().toISOString() }];

    if (isEditing && id) {
      await catalogService.updateProduct(id, {
        name_en: nameEn.trim(),
        name_ur: nameUr.trim() || nameEn.trim(),
        category_id: categoryId,
        fabric: fabric.trim() || 'Superfine Blend',
        base_price: basePriceNum,
        sale_price: salePriceNum,
        description_en: descriptionEn.trim(),
        description_ur: descriptionUr.trim(),
        tags: tagList,
        seo_title: seoTitle || `${nameEn} | ARTS APPAREL`,
        seo_description: seoDescription || descriptionEn.slice(0, 150),
        images: imagesList,
        variants,
      });
    } else {
      await catalogService.addProduct({
        name_en: nameEn.trim(),
        name_ur: nameUr.trim() || nameEn.trim(),
        slug: autoSlug,
        category_id: categoryId,
        fabric: fabric.trim() || 'Superfine Blend',
        base_price: basePriceNum,
        sale_price: salePriceNum,
        description_en: descriptionEn.trim(),
        description_ur: descriptionUr.trim(),
        tags: tagList,
        seo_title: seoTitle || `${nameEn} | ARTS APPAREL`,
        seo_description: seoDescription || descriptionEn.slice(0, 150),
        is_featured: false,
        is_new_arrival: true,
        is_active: true,
        images: imagesList,
        variants,
      });
    }

    navigate('/admin/products');
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <Link to="/admin/products" className="text-xs text-neutral-400 hover:text-white mb-1 block">
              ← Back to Catalog
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              {isEditing ? `Edit ${nameEn || 'Garment'}` : 'Add New Tailored Garment'}
            </h1>
          </div>
          <Button type="submit" variant="primary" size="md">
            Save Garment
          </Button>
        </div>

        {formNotification && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded text-red-300 text-xs flex items-center justify-between">
            <span>{formNotification}</span>
            <button
              type="button"
              onClick={() => setFormNotification(null)}
              className="text-neutral-400 hover:text-white font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Basics */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">1. Core Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name (English)"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Imperial Jet Black Shalwar Kameez"
              required
            />
            <Input
              label="Product Name (Urdu)"
              value={nameUr}
              onChange={(e) => setNameUr(e.target.value)}
              placeholder="امپیریل جیٹ بلیک شلوار قمیض"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-12 px-4 rounded-[6px] bg-[#161616] text-white border border-neutral-800 text-sm focus:outline-none focus:border-[#E31B23]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} ({c.name_ur})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Fabric Composition"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="e.g. 100% Egyptian Cotton / Wash & Wear"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Price (PKR)"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
            <Input
              label="Sale Price (PKR, Optional)"
              type="number"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Leave empty if not on sale"
            />
          </div>

          <Input
            label="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        {/* Section 2: AI Writer Panel */}
        <div className="p-6 bg-gradient-to-r from-[#141414] to-[#1a1213] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base text-[#E31B23]">✨</span>
              <h3 className="font-serif text-base font-bold text-white">AI Writer & SEO Concierge</h3>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiDescribe}
                isLoading={isAiGenerating}
              >
                Generate Descriptions
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiSeo}
                isLoading={isAiGenerating}
              >
                Auto-Generate SEO & Tags
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-neutral-300 block mb-1">Description (English)</label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                className="w-full h-20 bg-black border border-neutral-700 rounded p-3 text-white text-xs focus:outline-none focus:border-[#E31B23]"
              />
            </div>
            <div>
              <label className="text-neutral-300 block mb-1">Description (Urdu)</label>
              <textarea
                value={descriptionUr}
                onChange={(e) => setDescriptionUr(e.target.value)}
                className="w-full h-20 bg-black border border-neutral-700 rounded p-3 text-white text-xs focus:outline-none focus:border-[#E31B23] font-serif"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Input
              label="SEO Title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Under 60 chars"
            />
            <Input
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="black, formal, shalwar-kameez"
            />
          </div>
        </div>

        {/* Section 3: Variants & Inventory */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-white">3. Sizing & Variant Inventory</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGenerateStandardSizes}
            >
              + Generate Standard (S, M, L, XL)
            </Button>
          </div>

          <div className="overflow-x-auto border border-neutral-800 rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-neutral-400 font-semibold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Color</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Stock Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-200">
                {variants.map((v, idx) => (
                  <tr key={v.id || idx}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={v.size}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].size = e.target.value;
                          setVariants(updated);
                        }}
                        className="bg-black border border-neutral-700 px-2 py-1 rounded w-16 text-white text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].color = e.target.value;
                          setVariants(updated);
                        }}
                        className="bg-black border border-neutral-700 px-2 py-1 rounded w-28 text-white text-xs"
                      />
                    </td>
                    <td className="py-2 px-3 font-mono">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].sku = e.target.value;
                          setVariants(updated);
                        }}
                        className="bg-black border border-neutral-700 px-2 py-1 rounded w-36 text-white text-xs"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        value={v.stock_qty}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].stock_qty = parseInt(e.target.value, 10) || 0;
                          setVariants(updated);
                        }}
                        className="bg-black border border-neutral-700 px-2 py-1 rounded w-20 text-white text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/admin/products">
            <Button variant="outline" size="md">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" size="md">Save Garment</Button>
        </div>
      </form>
    </AdminLayout>
  );
};
