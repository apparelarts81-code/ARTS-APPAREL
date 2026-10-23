import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalogService';
import { Category } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminCategoriesPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('1');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await catalogService.getCategories(true);
    setCategories(data);
  };

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
    setSlug('');
    setImageUrl('');
    setSortOrder('1');
    setEditingCategory(null);
    setShowAddModal(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setNameEn(cat.name_en);
    setNameUr(cat.name_ur || '');
    setSlug(cat.slug);
    setImageUrl(cat.image_url || '');
    setSortOrder(String(cat.sort_order));
    setShowAddModal(true);
  };

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;
    setFeedback(null);

    const autoSlug = slug.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, {
          name_en: nameEn.trim(),
          name_ur: nameUr.trim(),
          slug: autoSlug,
          image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800',
          sort_order: parseInt(sortOrder, 10) || 0,
        });
        setFeedback({ type: 'success', message: 'Category updated successfully.' });
      } else {
        await catalogService.addCategory({
          name_en: nameEn.trim(),
          name_ur: nameUr.trim(),
          slug: autoSlug,
          image_url: imageUrl.trim() || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800',
          sort_order: parseInt(sortOrder, 10) || 0,
          is_active: true,
        });
        setFeedback({ type: 'success', message: 'Category created successfully.' });
      }

      resetForm();
      await loadCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save category in database.' });
    }
  };

  const handleToggleActive = async (cat: Category) => {
    if (!isOwner) return;
    setFeedback(null);
    try {
      await catalogService.updateCategory(cat.id, { is_active: !cat.is_active });
      await loadCategories();
      setFeedback({ type: 'success', message: 'Category status updated.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to update category status.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!isOwner) return;
    setFeedback(null);
    if (confirm('Are you sure you want to delete this category? Products associated with it may be unlinked.')) {
      try {
        await catalogService.deleteCategory(id);
        await loadCategories();
        setFeedback({ type: 'success', message: 'Category deleted successfully.' });
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'Failed to delete category from database.' });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Category Management</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Organize garments by classification and sort display order
            </p>
          </div>
          {isOwner && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              + Add Category
            </Button>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3 rounded text-xs border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {feedback.message}
          </div>
        )}


        {/* Modal / Form */}
        {showAddModal && isOwner && (
          <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4">
            <h3 className="font-serif text-base font-bold text-white">
              {editingCategory ? 'Edit Category' : 'Create New Collection Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Category Name (English)"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Waistcoat, Shalwar Kameez"
                  required
                />
                <Input
                  label="Category Name (Urdu)"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="e.g. واسکٹ، شلوار قمیض"
                />
                <Input
                  label="URL Slug (Optional)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. waistcoat"
                />
                <Input
                  label="Sort Order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="1, 2, 3..."
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Image URL (Unsplash or CDN)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900/70 uppercase text-[10px] tracking-wider text-neutral-400 border-b border-neutral-800 font-bold">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Cover</th>
                <th className="py-3 px-4">English Name</th>
                <th className="py-3 px-4">Urdu Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Visibility</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-neutral-400">{cat.sort_order}</td>
                  <td className="py-3 px-4">
                    <img
                      src={cat.image_url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800'}
                      alt={cat.name_en}
                      className="w-10 h-10 object-cover rounded bg-neutral-900 border border-neutral-800"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{cat.name_en}</td>
                  <td className="py-3 px-4 font-urdu text-sm text-neutral-200">{cat.name_ur || '—'}</td>
                  <td className="py-3 px-4 font-mono text-neutral-400">/category/{cat.slug}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      disabled={!isOwner}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-opacity ${
                        cat.is_active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                      } ${!isOwner ? 'cursor-default' : 'hover:opacity-80'}`}
                    >
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  {isOwner && (
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded text-[11px]"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
