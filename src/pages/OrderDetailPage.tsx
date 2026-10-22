import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { returnService } from '../services/returnService';
import { Order } from '../types/database';
import { formatPKR, formatDate } from '../lib/format';
import { ORDER_STATUS_LABELS } from '../lib/constants';
import { Button } from '../components/ui/Button';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [returnRequested, setReturnRequested] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;
    orderService.getAllOrders().then((all) => {
      const found = all.find((o) => o.order_number === orderNumber);
      if (found) setOrder(found);
    });
  }, [orderNumber]);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-white">
        <h2 className="font-serif text-2xl font-bold">Order not found</h2>
        <Link to="/account" className="text-[#E31B23] underline text-xs mt-2 block">
          Return to My Account
        </Link>
      </div>
    );
  }

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !returnReason.trim()) return;
    await returnService.requestReturn(order.id, returnReason, order.user_id || undefined);
    setReturnRequested(true);
    setShowReturnModal(false);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setIsCancelling(true);
    const success = await orderService.cancelOrder(order.order_number, order.customer_phone, cancelReason);
    if (success) {
      setOrder({ ...order, status: 'cancelled', cancel_reason: cancelReason });
      setShowCancelModal(false);
    }
    setIsCancelling(false);
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
        <div>
          <Link to="/account" className="text-xs text-neutral-400 hover:text-white mb-2 block">
            ← Back to Orders
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            Order {order.order_number}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border ${
              ORDER_STATUS_LABELS[order.status]?.color || 'border-neutral-700'
            }`}
          >
            {ORDER_STATUS_LABELS[order.status]?.en || order.status}
          </span>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelModal(true)}
              className="border-red-900/60 text-red-400 hover:bg-red-950/40"
            >
              Cancel Order
            </Button>
          )}
          {order.status === 'delivered' && !returnRequested && (
            <Button variant="outline" size="sm" onClick={() => setShowReturnModal(true)}>
              Request 7-Day Return
            </Button>
          )}
        </div>
      </div>

      {order.status === 'cancelled' && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded text-red-300 text-xs">
          This order was cancelled. {order.cancel_reason ? `Reason: ${order.cancel_reason}` : ''}
        </div>
      )}

      {returnRequested && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-300 text-xs">
          Return request submitted for order {order.order_number}. Our support staff will contact you via WhatsApp for parcel collection.
        </div>
      )}

      {/* Courier & Tracking Banner if dispatched */}
      {(order.courier_name || order.tracking_number) && (
        <div className="p-4 bg-[#161616] border border-neutral-700 rounded-[8px] flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-400 block text-[11px] uppercase tracking-wider">Courier Dispatch Details</span>
            <strong className="text-white text-sm">{order.courier_name || 'Courier Express'}</strong>
          </div>
          <div className="text-right">
            <span className="text-neutral-400 block text-[11px]">Tracking Reference:</span>
            <span className="font-mono font-bold text-white text-sm">{order.tracking_number}</span>
          </div>
        </div>
      )}

      {/* Shipping & Payment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded bg-[#111111] border border-neutral-800 space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider">Shipping Address</h4>
          <p className="font-medium text-white">{order.customer_name}</p>
          <p className="text-neutral-400">{order.shipping_address}</p>
          <p className="text-neutral-400">{order.shipping_city}, Pakistan</p>
          <p className="text-neutral-400">Phone: {order.customer_phone}</p>
        </div>
        <div className="p-5 rounded bg-[#111111] border border-neutral-800 space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider">Payment Information</h4>
          <p className="text-neutral-300">Method: <strong className="text-white uppercase">{order.payment_method}</strong></p>
          <p className="text-neutral-300">Payment Status: <strong className="text-white uppercase">{order.payment_status}</strong></p>
          {order.payment_proof?.transaction_id && (
            <p className="text-neutral-400">TID: {order.payment_proof.transaction_id}</p>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="bg-[#111111] rounded-[8px] border border-neutral-800 p-6 space-y-4">
        <h4 className="font-serif text-base font-bold">Ordered Garments</h4>
        <div className="divide-y divide-neutral-800">
          {order.items?.map((it) => (
            <div key={it.id} className="py-4 flex items-center justify-between text-xs first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {it.image_url && (
                  <img src={it.image_url} alt="" className="w-14 h-16 object-cover rounded bg-neutral-900 border border-neutral-800" />
                )}
                <div>
                  <p className="font-bold text-white text-sm">{it.product_name}</p>
                  <p className="text-neutral-400 mt-0.5">
                    Quantity: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                  </p>
                  <p className="text-neutral-400">Unit Price: {formatPKR(it.unit_price)}</p>
                </div>
              </div>
              <span className="font-bold text-white font-mono text-sm">{formatPKR(it.line_total)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-800 pt-4 space-y-1.5 text-xs text-neutral-300 max-w-xs ml-auto">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="text-white">{formatPKR(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Discount ({order.coupon_code}):</span>
              <span>-{formatPKR(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery:</span>
            <span className="text-white">{formatPKR(order.delivery_charge)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-neutral-800">
            <span>Grand Total:</span>
            <span className="text-[#E31B23] text-base">{formatPKR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCancelSubmit} className="bg-[#161616] p-6 rounded-[8px] border border-neutral-800 max-w-md w-full space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-white">Cancel Order {order.order_number}</h3>
            <p className="text-neutral-400">
              Orders can only be cancelled before they are dispatched for shipping. Please tell us why you are cancelling:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Ordered incorrect size, changed mind..."
              className="w-full h-24 bg-black border border-neutral-700 rounded p-3 text-white focus:outline-none focus:border-[#E31B23]"
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCancelModal(false)}>
                Go Back
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isCancelling} className="bg-red-600 hover:bg-red-700">
                Confirm Cancellation
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleReturnSubmit} className="bg-[#161616] p-6 rounded-[8px] border border-neutral-800 max-w-md w-full space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-white">Request 7-Day Return / Exchange</h3>
            <p className="text-neutral-400">
              Please specify reason for return or size exchange request:
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Size too loose, exchange for smaller size, defect..."
              className="w-full h-24 bg-black border border-neutral-700 rounded p-3 text-white focus:outline-none focus:border-[#E31B23]"
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowReturnModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Submit Request
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
