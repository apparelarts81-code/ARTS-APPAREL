import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/database';
import { formatPKR } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    orderService.getAllOrders().then(setOrders);
  }, []);

  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status !== 'cancelled' && o.status !== 'returned') {
      return sum + o.total;
    }
    return sum;
  }, 0);

  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Payment method split
  const methodCounts: Record<string, number> = {};
  orders.forEach((o) => {
    methodCounts[o.payment_method] = (methodCounts[o.payment_method] || 0) + 1;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'City', 'Payment Method', 'Payment Status', 'Status', 'Total'];
    const rows = orders.map((o) => [
      o.order_number,
      o.created_at,
      `"${o.customer_name}"`,
      `"${o.customer_phone}"`,
      `"${o.shipping_city}"`,
      o.payment_method,
      o.payment_status,
      o.status,
      o.total,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arts_apparel_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Revenue & Analytics Report</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Storewide financial performance, top markets, and CSV export (Owner Only)
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleExportCSV}>
            📥 Export CSV Spreadsheet
          </Button>
        </div>

        {/* Executive Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
            <span className="text-xs uppercase font-semibold text-neutral-400">Total Revenue</span>
            <div className="font-serif font-black text-3xl text-emerald-400">
              {formatPKR(totalRevenue)}
            </div>
            <p className="text-[11px] text-neutral-500">Excludes cancelled & returned</p>
          </div>

          <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
            <span className="text-xs uppercase font-semibold text-neutral-400">Total Dispatches</span>
            <div className="font-serif font-black text-3xl text-white">
              {orders.length} orders
            </div>
            <p className="text-[11px] text-neutral-500">All customer packages</p>
          </div>

          <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-2">
            <span className="text-xs uppercase font-semibold text-neutral-400">Average Order Value (AOV)</span>
            <div className="font-serif font-black text-3xl text-[#E31B23]">
              {formatPKR(avgOrderValue)}
            </div>
            <p className="text-[11px] text-neutral-500">Per customer checkout</p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Payment Method Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(methodCounts).map(([method, count]) => (
              <div key={method} className="p-4 rounded bg-black border border-neutral-800 text-center space-y-1">
                <span className="uppercase text-neutral-400 font-bold block">{method}</span>
                <span className="font-serif text-2xl font-black text-white">{count}</span>
                <span className="text-[10px] text-neutral-500 block">
                  {Math.round((count / orders.length) * 100)}% of orders
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
