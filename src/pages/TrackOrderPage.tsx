import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { storageService } from '../services/storageService';
import { Order, OrderStatus } from '../types/database';
import { useLanguage } from '../i18n/LanguageProvider';
import { formatPKR, formatDate } from '../lib/format';
import { ORDER_STATUS_LABELS } from '../lib/constants';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const TrackOrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Payment proof upload states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofTid, setProofTid] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadedMsg, setProofUploadedMsg] = useState(false);

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const res = await orderService.trackOrder(orderNumber, phone);
      setOrder(res);
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('order') && searchParams.get('phone')) {
      handleTrack();
    }
  }, []);

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;
    setIsCancelling(true);
    const success = await orderService.cancelOrder(order.order_number, phone, cancelReason);
    if (success) {
      setOrder({ ...order, status: 'cancelled', cancel_reason: cancelReason });
      setShowCancelModal(false);
    }
    setIsCancelling(false);
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !proofFile) return;
    setIsUploadingProof(true);
    try {
      const uploadRes = await storageService.uploadPaymentProof(order.id, proofFile);
      await orderService.addPaymentProof(order.order_number, phone, uploadRes.path, proofTid);
      setProofUploadedMsg(true);
      const updated = await orderService.trackOrder(order.order_number, phone);

      if (updated) setOrder(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const statusSteps: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIdx = order ? statusSteps.indexOf(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-white space-y-10">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight">
          {t('track.title')}
        </h1>
        <p className="text-xs text-neutral-400">
          {t('track.subtitle')}
        </p>
      </div>

      {/* Tracking Form */}
      <form
        onSubmit={handleTrack}
        className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
      >
        <Input
          label={t('track.order_number')}
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="ARTS-000101"
          required
        />
        <Input
          label={t('track.phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0305 8165623"
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="uppercase font-bold tracking-wider h-12"
          isLoading={isLoading}
        >
          {t('track.submit')}
        </Button>
      </form>

      {/* Result Container */}
      {searched && !isLoading && (
        <>
          {order ? (
            <div className="bg-[#111111] border border-neutral-800 rounded-[8px] p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
              {/* Header Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                <div>
                  <span className="text-xs text-neutral-400 block mb-1">
                    Order Number: <strong className="text-white">{order.order_number}</strong>
                  </span>
                  <h3 className="font-serif text-2xl font-bold">
                    Order for {order.customer_name}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Placed on {formatDate(order.created_at)} • Destination: {order.shipping_city}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-block px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border ${
                      ORDER_STATUS_LABELS[order.status]?.color || 'border-neutral-700'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status]?.en || order.status}
                  </span>
                </div>
              </div>

              {/* Status Timeline Rail */}
              {order.status !== 'cancelled' && order.status !== 'returned' && (
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                    {t('track.timeline')}
                  </h4>
                  <div className="relative flex items-center justify-between">
                    {/* Connecting line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-800 -translate-y-1/2 z-0" />
                    <div
                      className="absolute top-1/2 left-0 h-0.5 bg-[#E31B23] -translate-y-1/2 z-0 transition-all duration-500"
                      style={{
                        width: `${Math.max(0, (currentStepIdx / (statusSteps.length - 1)) * 100)}%`,
                      }}
                    />

                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              isCurrent
                                ? 'bg-black border-[#E31B23] text-[#E31B23] scale-110 shadow-lg shadow-red-900/40 animate-pulse'
                                : isCompleted
                                ? 'bg-[#E31B23] border-[#E31B23] text-white'
                                : 'bg-[#161616] border-neutral-700 text-neutral-500'
                            }`}
                          >
                            {isCompleted && !isCurrent ? (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <span
                            className={`text-[10px] mt-2 font-semibold uppercase tracking-wider hidden sm:block ${
                              isCurrent ? 'text-white' : isCompleted ? 'text-neutral-300' : 'text-neutral-600'
                            }`}
                          >
                            {ORDER_STATUS_LABELS[step]?.en || step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier info if shipped */}
              {order.courier_name && (
                <div className="p-4 bg-black rounded border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-400 block">{t('track.courier')}</span>
                    <strong className="text-white text-sm">{order.courier_name}</strong>
                  </div>
                  {order.tracking_number && (
                    <div className="text-right">
                      <span className="text-neutral-400 block">{t('track.tracking_number')}</span>
                      <strong className="text-[#E31B23] font-mono text-sm">{order.tracking_number}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Items summary */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  Garments in Package
                </h4>
                <div className="divide-y divide-neutral-800/80 border-y border-neutral-800/80">
                  {order.items?.map((it) => (
                    <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{it.product_name}</span>
                        <span className="text-neutral-400">
                          Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• Color: ${it.color}` : ''}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white">
                        {formatPKR(it.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white pt-2">
                  <span>Order Total:</span>
                  <span className="text-[#E31B23] text-base">{formatPKR(order.total)}</span>
                </div>
              </div>

              {/* Payment Proof Section if manual payment method */}
              {order.payment_method !== 'cod' && (
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-white block font-bold">
                        Payment: {order.payment_method.toUpperCase()} ({order.payment_status.replace('_', ' ').toUpperCase()})
                      </strong>
                      <span className="text-neutral-400 text-[11px]">
                        {order.payment_proof
                          ? 'Screenshot received. Under verification by our finance staff.'
                          : 'Please submit your transfer screenshot to confirm this order.'}
                      </span>
                    </div>
                  </div>

                  {order.payment_proof?.screenshot_path && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={order.payment_proof.screenshot_path}
                        alt="Transfer Slip"
                        className="w-16 h-20 object-cover rounded border border-neutral-700"
                      />
                      <div className="text-[11px] text-neutral-300">
                        <span className="block font-medium">Uploaded Screenshot Attached</span>
                        {order.payment_proof.transaction_id && (
                          <span className="font-mono text-neutral-400">TID: {order.payment_proof.transaction_id}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {(!order.payment_proof || order.payment_status === 'failed') && (
                    <form onSubmit={handleUploadProof} className="pt-2 space-y-2 border-t border-neutral-800">
                      {proofUploadedMsg && (
                        <div className="p-2 bg-emerald-950 border border-emerald-800 rounded text-emerald-300 text-xs">
                          Screenshot uploaded successfully! Status changed to awaiting verification.
                        </div>
                      )}
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">
                          Select Transfer Screenshot (JazzCash / Easypaisa / Bank Slip)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          className="text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#E31B23] file:text-white hover:file:bg-[#A8121A] cursor-pointer"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">
                          Transaction ID / Reference (Optional)
                        </label>
                        <input
                          type="text"
                          value={proofTid}
                          onChange={(e) => setProofTid(e.target.value)}
                          placeholder="e.g. 0184729184"
                          className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isUploadingProof}
                        disabled={!proofFile}
                      >
                        Submit Payment Screenshot
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Cancel Button if eligible */}
              {(order.status === 'pending' || order.status === 'confirmed') && (
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    Need to modify or cancel this order?
                  </span>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111111] border border-neutral-800 rounded-[8px] p-8 text-center space-y-3">
              <span className="text-3xl text-neutral-500">❓</span>
              <h3 className="font-serif text-xl font-bold">No order found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                We couldn't locate an order with these exact details. Please verify your ARTS order number and mobile phone.
              </p>
            </div>
          )}
        </>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161616] p-6 rounded-[8px] border border-neutral-800 max-w-md w-full space-y-4 text-xs">
            <h3 className="font-serif text-lg font-bold text-white">Cancel Order {order?.order_number}</h3>
            <p className="text-neutral-400">
              Please let our master tailoring team know why you need to cancel this order:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Ordered incorrect size, changed mind, duplicate order..."
              className="w-full h-24 bg-black border border-neutral-700 rounded p-3 text-white focus:outline-none focus:border-[#E31B23]"
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelOrder}
                isLoading={isCancelling}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
