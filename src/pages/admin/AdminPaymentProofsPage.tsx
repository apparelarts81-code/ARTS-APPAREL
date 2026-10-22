import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/database';
import { formatPKR, formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminPaymentProofsPage: React.FC = () => {
  const [ordersWithProofs, setOrdersWithProofs] = useState<Order[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    orderService.getAllOrders().then((all) => {
      setOrdersWithProofs(all.filter((o) => o.payment_proof !== null && o.payment_proof !== undefined));
    });
  }, []);

  const handleApprove = async (orderId: string, proofId: string) => {
    await orderService.updatePaymentProofStatus(proofId, orderId, 'approved', 'Verified by staff');
    const all = await orderService.getAllOrders();
    setOrdersWithProofs(all.filter((o) => o.payment_proof !== null && o.payment_proof !== undefined));
  };

  const handleReject = async (orderId: string, proofId: string) => {
    await orderService.updatePaymentProofStatus(proofId, orderId, 'rejected', 'Invalid transfer slip');
    const all = await orderService.getAllOrders();
    setOrdersWithProofs(all.filter((o) => o.payment_proof !== null && o.payment_proof !== undefined));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pb-4 border-b border-neutral-800">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Payment Proof Verification Queue</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review screenshots for JazzCash, Easypaisa, and Bank Transfers
          </p>
        </div>

        {ordersWithProofs.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No payment screenshots pending verification.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ordersWithProofs.map((ord) => {
              const proof = ord.payment_proof!;
              return (
                <div key={ord.id} className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-white font-mono text-sm block">{ord.order_number}</strong>
                      <span className="text-neutral-400">{ord.customer_name} • {ord.customer_phone}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      proof.status === 'approved'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : proof.status === 'rejected'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {proof.status}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPreviewImage(proof.screenshot_path)}
                      className="shrink-0 group cursor-pointer focus:outline-none"
                      title="Click to expand transfer receipt"
                    >
                      <img
                        src={proof.screenshot_path}
                        alt="Slip"
                        className="w-28 h-36 object-cover rounded border border-neutral-700 group-hover:border-[#E31B23] transition-all"
                      />
                      <span className="text-[10px] text-neutral-400 group-hover:text-white block mt-1 text-center">
                        🔍 View Large
                      </span>
                    </button>
                    <div className="space-y-1.5 flex-1">
                      <p><strong>Payment Method:</strong> <span className="uppercase text-white">{ord.payment_method}</span></p>
                      <p><strong>Order Total:</strong> <span className="text-[#E31B23] font-bold">{formatPKR(ord.total)}</span></p>
                      {proof.transaction_id && (
                        <p><strong>TID:</strong> <span className="font-mono text-white">{proof.transaction_id}</span></p>
                      )}
                      <p className="text-neutral-400">Uploaded: {formatDate(proof.created_at)}</p>
                      {proof.review_note && (
                        <p className="text-neutral-300">Note: {proof.review_note}</p>
                      )}
                    </div>
                  </div>

                  {proof.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-neutral-800">
                      <Button variant="primary" size="sm" onClick={() => handleApprove(ord.id, proof.id)}>
                        Approve & Mark Paid
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleReject(ord.id, proof.id)}>
                        Reject Proof
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white text-sm font-bold bg-neutral-800 px-3 py-1 rounded hover:bg-neutral-700"
              >
                Close ✕
              </button>
              <img
                src={previewImage}
                alt="Payment proof high resolution"
                className="max-w-full max-h-[80vh] object-contain rounded border border-neutral-700"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
