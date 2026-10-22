import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalogService';
import { Product } from '../../types/database';
import { formatPKR } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminProductsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    catalogService.getProducts().then(setProducts);
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name_en.toLowerCase().includes(search.toLowerCase()) ||
      p.name_ur.includes(search) ||
      p.fabric.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!isOwner) return;
    if (confirm('Are you sure you want to delete this garment?')) {
      await catalogService.deleteProduct(id);
      const refreshed = await catalogService.getProducts();
      setProducts(refreshed);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Catalog Management</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Manage clothing items, sizes, fabrics, and inventory
            </p>
          </div>
          <Link to="/admin/products/new">
            <Button variant="primary" size="sm">+ Add New Product</Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, fabric, or tag..."
            className="w-full bg-[#111111] border border-neutral-700 px-3.5 py-2 text-xs rounded text-white focus:outline-none focus:border-[#E31B23]"
          />
        </div>

        {/* Products Table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Garment</th>
                <th className="py-3 px-4">Fabric</th>
                <th className="py-3 px-4">Base Price</th>
                <th className="py-3 px-4">Sale Price</th>
                <th className="py-3 px-4">Total Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {filtered.map((prod) => {
                const totalStock = prod.variants?.reduce((sum, v) => sum + v.stock_qty, 0) ?? 0;
                const img = prod.images?.[0]?.url;

                return (
                  <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {img && (
                          <img src={img} alt="" className="w-10 h-12 object-cover rounded bg-neutral-900 border border-neutral-800 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-white text-xs">{prod.name_en}</p>
                          <span className="text-[11px] text-neutral-500 font-serif">{prod.name_ur}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{prod.fabric}</td>
                    <td className="py-3 px-4 font-mono font-medium">{formatPKR(prod.base_price)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E31B23]">
                      {prod.sale_price ? formatPKR(prod.sale_price) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold ${totalStock <= 5 ? 'text-amber-400' : 'text-white'}`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/products/${prod.id}/edit`}
                        className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px]"
                      >
                        Edit
                      </Link>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 rounded text-[11px]"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
