import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ReturnRequest } from '../../types/database';
import { returnService } from '../../services/returnService';
import { formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setIsLoading(true);
    const data = await returnService.getReturns();
    setReturns(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'completed') => {
    await returnService.updateReturnStatus(id, newStatus);
    await loadReturns();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Returns & Exchanges</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review 7-day customer exchange and refund claims (Staff & Owner)
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400">Loading claims...</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400 bg-[#111111] rounded border border-neutral-800">
            No return or exchange claims filed.
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map((ret) => (
              <div key={ret.id} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white font-mono text-sm block">Return #{ret.id}</span>
                    <span className="text-[11px] text-neutral-400">Order Ref: {ret.order_id} • Filed: {formatDate(ret.created_at)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${
                    ret.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : ret.status === 'rejected'
                      ? 'bg-red-950 text-red-400 border-red-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {ret.status}
                  </span>
                </div>
                <p className="text-neutral-300 bg-black/40 p-3 rounded border border-neutral-800/80">
                  <strong className="text-white block mb-1">Customer Reason:</strong> {ret.reason}
                </p>

                {ret.status === 'requested' && (
                  <div className="flex gap-2 pt-2 border-t border-neutral-800">
                    <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(ret.id, 'approved')}>
                      Approve Exchange
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleUpdateStatus(ret.id, 'completed')}>
                      Mark Completed
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(ret.id, 'rejected')}>
                      Reject Claim
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
