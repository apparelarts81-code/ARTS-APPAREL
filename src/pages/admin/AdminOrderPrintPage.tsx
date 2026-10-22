import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { Order } from '../../types/database';
import { formatPKR, formatDate } from '../../lib/format';
import { STORE_CONSTANTS } from '../../lib/constants';

export const AdminOrderPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    orderService.getOrderById(id).then(setOrder);
  }, [id]);

  if (!order) {
    return <div className="p-8 text-black">Loading printable invoice...</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 sm:p-12 font-sans max-w-4xl mx-auto">
      {/* Print Trigger Button (Hidden in Print Mode) */}
      <div className="print:hidden flex justify-between items-center mb-8 pb-4 border-b">
        <span className="text-xs text-neutral-500">
          Print preview for Order: <strong>{order.order_number}</strong>
        </span>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-black text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
        >
          🖨️ Print Invoice / Packing Slip
        </button>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between items-start pb-8 border-b-2 border-black">
        <div>
          <h1 className="font-serif text-3xl font-black tracking-wider">
            ARTS <span className="font-sans font-light tracking-[0.2em] text-sm">APPAREL</span>
          </h1>
          <p className="text-xs text-neutral-600 mt-1">{STORE_CONSTANTS.category}</p>
          <p className="text-xs text-neutral-600">{STORE_CONSTANTS.address}</p>
          <p className="text-xs text-neutral-600">Tel: {STORE_CONSTANTS.phone_number}</p>
        </div>

        <div className="text-right space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest bg-black text-white px-2.5 py-1 inline-block">
            INVOICE & PACKING SLIP
          </span>
          <p className="font-mono text-lg font-black mt-2">{order.order_number}</p>
          <p className="text-xs text-neutral-600">Date: {formatDate(order.created_at)}</p>
          <p className="text-xs text-neutral-600 uppercase font-semibold">
            Method: {order.payment_method} ({order.payment_status})
          </p>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-2 gap-8 py-6 text-xs border-b">
        <div>
          <h4 className="font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Deliver To / Consignee:
          </h4>
          <p className="text-sm font-bold">{order.customer_name}</p>
          <p className="text-neutral-700 mt-1 leading-relaxed">{order.shipping_address}</p>
          <p className="text-neutral-700">{order.shipping_city}, Pakistan</p>
          <p className="text-neutral-700 mt-1">Mobile: <strong>{order.customer_phone}</strong></p>
        </div>

        <div>
          <h4 className="font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Logistics & Notes:
          </h4>
          <p><strong>Courier:</strong> {order.courier_name || 'Standard Nationwide Surface'}</p>
          <p><strong>Tracking Number:</strong> {order.tracking_number || 'To be assigned'}</p>
          {order.notes && (
            <p className="mt-2 p-2 bg-neutral-100 rounded text-neutral-700">
              <strong>Order Notes:</strong> {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Table of Items */}
      <div className="py-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-black font-bold uppercase">
              <th className="py-2.5">Item Description</th>
              <th className="py-2.5 text-center">Size</th>
              <th className="py-2.5 text-center">Color</th>
              <th className="py-2.5 text-center">Qty</th>
              <th className="py-2.5 text-right">Unit Price</th>
              <th className="py-2.5 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {order.items?.map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="py-3 font-semibold">{it.product_name}</td>
                <td className="py-3 text-center">{it.size || 'Standard'}</td>
                <td className="py-3 text-center">{it.color || 'Standard'}</td>
                <td className="py-3 text-center font-bold">{it.quantity}</td>
                <td className="py-3 text-right font-mono">{formatPKR(it.unit_price)}</td>
                <td className="py-3 text-right font-mono font-bold">{formatPKR(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex justify-end pt-4 border-t-2 border-black">
        <div className="w-64 space-y-1.5 text-xs text-neutral-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-black">
              <span>Discount ({order.coupon_code}):</span>
              <span>-{formatPKR(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery Fee:</span>
            <span>{formatPKR(order.delivery_charge)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-black border-t pt-2">
            <span>Total Payable:</span>
            <span>{formatPKR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-16 pt-6 border-t border-neutral-300 text-center text-[10px] text-neutral-500 space-y-1">
        <p className="font-bold text-neutral-700">Thank you for ordering with ARTS APPAREL!</p>
        <p>For exchanges or support, contact WhatsApp: {STORE_CONSTANTS.whatsapp_number} or visit artsapparelsdk.com</p>
      </div>
    </div>
  );
};
