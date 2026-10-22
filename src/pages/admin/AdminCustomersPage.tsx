import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/database';
import { formatPKR } from '../../lib/format';

interface CustomerSummary {
  name: string;
  phone: string;
  email?: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
}

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);

  useEffect(() => {
    orderService.getAllOrders().then((allOrders) => {
      const map: Record<string, CustomerSummary> = {};
      allOrders.forEach((o) => {
        const key = o.customer_phone;
        if (!map[key]) {
          map[key] = {
            name: o.customer_name,
            phone: o.customer_phone,
            email: o.customer_email || undefined,
            city: o.shipping_city,
            ordersCount: 0,
            totalSpent: 0,
          };
        }
        map[key].ordersCount += 1;
        if (o.status !== 'cancelled') {
          map[key].totalSpent += o.total;
        }
      });
      setCustomers(Object.values(map));
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Customer Directory</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Registered and guest buyers across Pakistan grouped by phone
          </p>
        </div>

        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 font-mono text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {customers.map((c, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-4 font-mono">{c.phone}</td>
                  <td className="py-3 px-4 text-neutral-400">{c.email || '—'}</td>
                  <td className="py-3 px-4">{c.city}</td>
                  <td className="py-3 px-4 text-center font-bold">{c.ordersCount}</td>
                  <td className="py-3 px-4 font-mono font-bold text-right text-[#E31B23]">
                    {formatPKR(c.totalSpent)}
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
