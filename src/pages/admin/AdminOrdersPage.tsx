import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/database';
import { formatPKR, formatDate } from '../../lib/format';
import { ORDER_STATUS_LABELS } from '../../lib/constants';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    orderService.getAllOrders().then(setOrders);
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.shipping_city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Orders Management</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Process customer shipments, verify payments, and update courier tracking
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {filtered.length} Orders matching filter
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, phone, customer, city..."
            className="flex-1 bg-[#111111] border border-neutral-700 px-3.5 py-2 text-xs rounded text-white focus:outline-none focus:border-[#E31B23]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] text-white text-xs border border-neutral-700 rounded px-3 py-2 focus:outline-none focus:border-[#E31B23]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 font-mono">Total</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {ord.order_number}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white">{ord.customer_name}</p>
                    <span className="text-[11px] text-neutral-500">{ord.customer_phone}</span>
                  </td>
                  <td className="py-3 px-4">{ord.shipping_city}</td>
                  <td className="py-3 px-4">
                    <span className="uppercase text-[11px] block font-medium">{ord.payment_method}</span>
                    <span className={`text-[10px] ${ord.payment_status === 'paid' ? 'text-emerald-400' : ord.payment_status === 'awaiting_verification' ? 'text-[#E31B23]' : 'text-neutral-500'}`}>
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        ORDER_STATUS_LABELS[ord.status]?.color || 'border-neutral-700'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[ord.status]?.en || ord.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-400">{formatDate(ord.created_at)}</td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    {formatPKR(ord.total)}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px]"
                    >
                      Manage
                    </Link>
                    <Link
                      to={`/admin/orders/${ord.id}/print`}
                      target="_blank"
                      className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded text-[11px]"
                      title="Print Invoice / Packing Slip"
                    >
                      🖨️
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
