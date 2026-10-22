import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types/database';
import { formatPKR, formatDate, formatDateTime } from '../../lib/format';
import { ORDER_STATUS_LABELS, ALLOWED_STATUS_TRANSITIONS } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('pending');
  const [statusNote, setStatusNote] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    orderService.getOrderById(id).then((ord) => {
      if (ord) {
        setOrder(ord);
        setSelectedStatus(ord.status);
        setCourierName(ord.courier_name || '');
        setTrackingNumber(ord.tracking_number || '');
      }
    });
  }, [id]);

  if (!order) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-white">
          <h2 className="font-serif text-2xl font-bold">Order not found</h2>
          <Link to="/admin/orders" className="text-[#E31B23] underline text-xs mt-2 block">
            Return to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const allowedNextStatuses = [order.status, ...(ALLOWED_STATUS_TRANSITIONS[order.status] || [])];

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMsg(null);

    await orderService.updateOrderStatus(
      order.id,
      selectedStatus,
      statusNote.trim() || undefined,
      courierName.trim() || undefined,
      trackingNumber.trim() || undefined
    );

    // Refresh state
    const refreshed = await orderService.getOrderById(order.id);
    if (refreshed) setOrder(refreshed);

    setIsUpdating(false);
    setSuccessMsg('Order updated successfully!');
    setStatusNote('');
  };

  const handleApprovePayment = async () => {
    if (!order.payment_proof) return;
    await orderService.updatePaymentProofStatus(order.payment_proof.id, order.id, 'approved', 'Verified by staff');
    const refreshed = await orderService.getOrderById(order.id);
    if (refreshed) setOrder(refreshed);
  };

  const handleRejectPayment = async () => {
    if (!order.payment_proof) return;
    await orderService.updatePaymentProofStatus(order.payment_proof.id, order.id, 'rejected', 'Invalid screenshot');
    const refreshed = await orderService.getOrderById(order.id);
    if (refreshed) setOrder(refreshed);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <Link to="/admin/orders" className="text-xs text-neutral-400 hover:text-white mb-1 block">
              ← Back to Orders
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                Order {order.order_number}
              </h1>
              <span
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                  ORDER_STATUS_LABELS[order.status]?.color || 'border-neutral-700'
                }`}
              >
                {ORDER_STATUS_LABELS[order.status]?.en || order.status}
              </span>
            </div>
          </div>
          <Link
            to={`/admin/orders/${order.id}/print`}
            target="_blank"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-bold flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Print Invoice & Packing Slip</span>
          </Link>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-300 text-xs">
            {successMsg}
          </div>
        )}

        {/* 1. Fulfillment Actions Panel */}
        <form onSubmit={handleUpdate} className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Status & Courier Updates</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-neutral-400 uppercase font-semibold block mb-1">
                Fulfillment Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="w-full h-11 px-3 bg-black border border-neutral-700 rounded text-white text-xs focus:outline-none focus:border-[#E31B23]"
              >
                {allowedNextStatuses.map((st) => (
                  <option key={st} value={st}>
                    {ORDER_STATUS_LABELS[st]?.en || st}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Courier Partner"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. Trax, Leopard, TCS"
            />

            <Input
              label="Waybill / Tracking #"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRX-9381048"
            />
          </div>

          <Input
            label="Internal / Customer Update Note"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="e.g. Packed in signature garment sleeve, handed over to courier"
          />

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
              Save Order Changes
            </Button>
          </div>
        </form>

        {/* 2. Payment Proof Verification Box */}
        {order.payment_proof && (
          <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-white">Customer Payment Verification</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_proof.status === 'approved' ? 'bg-emerald-950 text-emerald-400' : order.payment_proof.status === 'rejected' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'}`}>
                Proof: {order.payment_proof.status}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <a href={order.payment_proof.screenshot_path} target="_blank" rel="noreferrer">
                <img
                  src={order.payment_proof.screenshot_path}
                  alt="Transfer Screenshot"
                  className="w-36 h-44 object-cover rounded border border-neutral-700 hover:opacity-80 transition-opacity"
                />
              </a>
              <div className="space-y-2 flex-1">
                <p><strong>Payment Method:</strong> <span className="uppercase">{order.payment_method}</span></p>
                <p><strong>Amount Payable:</strong> {formatPKR(order.total)}</p>
                {order.payment_proof.transaction_id && (
                  <p><strong>Transaction ID:</strong> <span className="font-mono text-white">{order.payment_proof.transaction_id}</span></p>
                )}
                {order.payment_proof.review_note && (
                  <p className="text-neutral-400">Note: {order.payment_proof.review_note}</p>
                )}

                {order.payment_proof.status === 'pending' && (
                  <div className="flex gap-2 pt-3">
                    <Button variant="primary" size="sm" onClick={handleApprovePayment}>
                      Approve & Mark Paid
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleRejectPayment}>
                      Reject Proof
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded bg-[#111111] border border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">Customer & Address</h4>
            <p className="font-bold text-white text-sm">{order.customer_name}</p>
            <p className="text-neutral-300">Phone: {order.customer_phone}</p>
            {order.customer_email && <p className="text-neutral-400">Email: {order.customer_email}</p>}
            <p className="text-neutral-300 mt-2">{order.shipping_address}</p>
            <p className="text-neutral-300">{order.shipping_city}, Pakistan</p>
            {order.notes && <p className="text-amber-400 mt-2">Notes: "{order.notes}"</p>}
          </div>

          <div className="p-5 rounded bg-[#111111] border border-neutral-800 space-y-1.5">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2">Order Breakdown</h4>
            <div className="space-y-1 text-neutral-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-white">{formatPKR(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon ({order.coupon_code}):</span>
                  <span>-{formatPKR(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="text-white">{formatPKR(order.delivery_charge)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
                <span>Grand Total:</span>
                <span className="text-[#E31B23]">{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Ordered Garments table */}
        <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-4 text-xs">
          <h3 className="font-serif text-base font-bold text-white">Garments In This Order</h3>
          <div className="divide-y divide-neutral-800">
            {order.items?.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {it.image_url && (
                    <img src={it.image_url} alt="" className="w-12 h-14 object-cover rounded bg-neutral-900 border border-neutral-800" />
                  )}
                  <div>
                    <p className="font-bold text-white">{it.product_name}</p>
                    <span className="text-neutral-400">
                      Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                    </span>
                  </div>
                </div>
                <span className="font-mono font-bold text-white">{formatPKR(it.line_total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Status History Audit Trail */}
        {order.history && order.history.length > 0 && (
          <div className="p-6 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-3 text-xs">
            <h3 className="font-serif text-base font-bold text-white">Status History Audit Trail</h3>
            <div className="space-y-2">
              {order.history.map((h) => (
                <div key={h.id} className="p-2.5 rounded bg-black border border-neutral-800 flex items-center justify-between text-neutral-300">
                  <div>
                    <span className="font-bold uppercase text-white mr-2">[{h.status}]</span>
                    <span>{h.note || 'No note recorded'}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {formatDateTime(h.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
