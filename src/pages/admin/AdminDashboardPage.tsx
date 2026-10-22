import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { catalogService } from '../../services/catalogService';
import { Order, Product } from '../../types/database';
import { formatPKR, formatDate } from '../../lib/format';
import { ORDER_STATUS_LABELS } from '../../lib/constants';
import { Button } from '../../components/ui/Button';

export const AdminDashboardPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([orderService.getAllOrders(), catalogService.getProducts()]).then(
      ([ords, prods]) => {
        setOrders(ords);
        setProducts(prods);
        setIsLoading(false);
      }
    );
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const awaitingVerification = orders.filter((o) => o.payment_status === 'awaiting_verification');

  // Low stock variants calculation
  const lowStockItems: Array<{ productName: string; size: string; color: string; stock: number }> = [];
  products.forEach((p) => {
    p.variants?.forEach((v) => {
      if (v.stock_qty <= 5) {
        lowStockItems.push({
          productName: p.name_en,
          size: v.size,
          color: v.color,
          stock: v.stock_qty,
        });
      }
    });
  });

  const monthRevenue = orders.reduce((sum, o) => {
    if (o.status !== 'cancelled' && o.status !== 'returned') {
      return sum + o.total;
    }
    return sum;
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Store Command Center</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Live operational metrics for ARTS APPAREL Sadiqabad
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/orders">
              <Button variant="secondary" size="sm">Manage Orders</Button>
            </Link>
            <Link to="/admin/products/new">
              <Button variant="primary" size="sm">+ Add Garment</Button>
            </Link>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Orders Today / Total */}
          <div className="p-5 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-1">
            <span className="text-xs text-neutral-400 uppercase font-semibold">Total Orders</span>
            <div className="text-3xl font-serif font-black text-white">{orders.length}</div>
            <span className="text-[11px] text-neutral-500">All customer shipments</span>
          </div>

          {/* Pending Fulfillment */}
          <div className="p-5 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-1">
            <span className="text-xs text-amber-400 uppercase font-semibold">Pending Orders</span>
            <div className="text-3xl font-serif font-black text-amber-400">{pendingOrders.length}</div>
            <span className="text-[11px] text-neutral-500">Requires confirmation</span>
          </div>

          {/* Awaiting Payment Proof */}
          <div className="p-5 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-1">
            <span className="text-xs text-[#E31B23] uppercase font-semibold">Awaiting Proofs</span>
            <div className="text-3xl font-serif font-black text-[#E31B23]">{awaitingVerification.length}</div>
            <span className="text-[11px] text-neutral-500">Screenshots to verify</span>
          </div>

          {/* Revenue (Owner Only) or Low Stock count (Staff) */}
          {isOwner ? (
            <div className="p-5 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-1">
              <span className="text-xs text-emerald-400 uppercase font-semibold">Sales Revenue</span>
              <div className="text-2xl font-serif font-black text-emerald-400">
                {formatPKR(monthRevenue)}
              </div>
              <span className="text-[11px] text-neutral-500">Total delivered & active</span>
            </div>
          ) : (
            <div className="p-5 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-1">
              <span className="text-xs text-red-400 uppercase font-semibold">Low Stock Alerts</span>
              <div className="text-3xl font-serif font-black text-red-400">{lowStockItems.length}</div>
              <span className="text-[11px] text-neutral-500">Variants ≤ 5 items</span>
            </div>
          )}
        </div>

        {/* Two Columns: Recent Orders + Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders (2 cols) */}
          <div className="lg:col-span-2 bg-[#111111] border border-neutral-800 rounded-[8px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold">Recent Orders</h3>
              <Link to="/admin/orders" className="text-xs text-[#E31B23] hover:underline font-bold">
                View All →
              </Link>
            </div>

            <div className="divide-y divide-neutral-800 overflow-x-auto">
              {orders.slice(0, 6).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs first:pt-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white font-mono">{ord.order_number}</strong>
                      <span className="text-neutral-400">• {ord.customer_name}</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      {ord.shipping_city} • {formatDate(ord.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        ORDER_STATUS_LABELS[ord.status]?.color || 'border-neutral-700'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[ord.status]?.en || ord.status}
                    </span>
                    <span className="font-bold text-white font-mono w-20 text-right">
                      {formatPKR(ord.total)}
                    </span>
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts (1 col) */}
          <div className="bg-[#111111] border border-neutral-800 rounded-[8px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-amber-400">Stock Alerts</h3>
              <span className="text-xs text-neutral-500">≤ 5 units</span>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-neutral-400 py-6 text-center">All inventory at healthy levels.</p>
            ) : (
              <div className="divide-y divide-neutral-800 max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="pt-2.5 flex items-center justify-between text-xs first:pt-0">
                    <div>
                      <p className="font-medium text-white line-clamp-1">{item.productName}</p>
                      <span className="text-neutral-400 text-[11px]">{item.size} • {item.color}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800">
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
