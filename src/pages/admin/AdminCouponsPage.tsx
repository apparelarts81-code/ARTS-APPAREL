import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Coupon } from '../../types/database';
import { couponService } from '../../services/couponService';
import { formatPKR } from '../../lib/format';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('10');
  const [minOrder, setMinOrder] = useState('3000');
  const [maxDiscount, setMaxDiscount] = useState('1500');

  useEffect(() => {
    loadCoupons();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const list = await couponService.getCoupons();
      setCoupons(list);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load coupons from database.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setFeedback(null);
    setIsLoading(true);

    try {
      await couponService.addCoupon({
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value) || 0,
        min_order_amount: parseFloat(minOrder) || 0,
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        usage_limit: 100,
        is_active: true,
      });

      await loadCoupons();
      setShowAddForm(false);
      setCode('');
      setFeedback({ type: 'success', message: `Coupon "${code.toUpperCase()}" created successfully!` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create coupon in database.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    setFeedback(null);
    try {
      await couponService.toggleCoupon(id);
      await loadCoupons();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to toggle coupon status.' });
    }
  };

  return (
    <AdminLayout ownerOnly={true}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Coupon Code Engine</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Create and manage promotional discount vouchers (Owner Only)
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Close Form' : '+ Create New Coupon'}
          </Button>
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


        {/* Add Coupon Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
            <h3 className="font-serif text-base font-bold text-white">Create New Coupon Voucher</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Coupon Code (Upper Case)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="EIDSPECIAL"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">Discount Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="h-12 px-3 bg-black border border-neutral-700 rounded text-white text-xs focus:outline-none focus:border-[#E31B23]"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed PKR (Rs.)</option>
                </select>
              </div>
              <Input
                label={type === 'percent' ? 'Discount %' : 'Discount PKR'}
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Minimum Order Amount (PKR)"
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
              />
              <Input
                label="Maximum Discount Cap (PKR, Optional)"
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Coupon
              </Button>
            </div>
          </form>
        )}

        {/* Coupons Table */}
        <div className="bg-[#111111] rounded-[8px] border border-neutral-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-black text-neutral-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Discount Value</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Used Count</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-200">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-mono font-bold text-white text-sm">{c.code}</td>
                  <td className="py-3 px-4 uppercase">{c.type}</td>
                  <td className="py-3 px-4 font-bold text-[#E31B23]">
                    {c.type === 'percent' ? `${c.value}%` : formatPKR(c.value)}
                  </td>
                  <td className="py-3 px-4">{formatPKR(c.min_order_amount)}</td>
                  <td className="py-3 px-4">{c.used_count} times</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggle(c.id)}
                      className="text-xs text-neutral-400 hover:text-white underline"
                    >
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
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
