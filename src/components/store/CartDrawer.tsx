import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../i18n/LanguageProvider';
import { formatPKR } from '../../lib/format';
import { QuantityStepper } from '../ui/QuantityStepper';
import { Button } from '../ui/Button';
import { useSettings } from '../../context/SettingsContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    deliveryCharge,
    total,
    coupon,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useCart();

  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ valid: boolean; message: string } | null>(null);

  if (!isDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode);
    setCouponFeedback(result);
  };

  const freeDeliveryThreshold = settings.free_delivery_threshold || 10000;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const freeProgress = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-[#111111] border-l border-neutral-800 shadow-2xl flex flex-col z-10 text-white">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold">{t('cart.title')}</h2>
            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
              {itemCount}
            </span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-neutral-400 hover:text-white p-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-[#E31B23]"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Free delivery threshold progress bar */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-[#161616] border-b border-neutral-800 text-xs">
            {remainingForFree > 0 ? (
              <p className="text-neutral-300 mb-1.5">
                Add <span className="text-[#E31B23] font-bold">{formatPKR(remainingForFree)}</span> more for <span className="font-bold text-white">FREE Nationwide Delivery</span>!
              </p>
            ) : (
              <p className="text-emerald-400 font-medium mb-1.5 flex items-center gap-1.5">
                <span>✓</span> You qualify for FREE Nationwide Delivery!
              </p>
            )}
            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#E31B23] h-full transition-all duration-300"
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-neutral-800/60">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl text-neutral-500">
                🛍️
              </div>
              <div>
                <p className="font-serif text-lg font-semibold text-white">{t('cart.empty')}</p>
                <p className="text-xs text-neutral-400 mt-1">Explore our sharp tailored menswear collections</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/shop');
                }}
              >
                {t('cart.empty_cta')}
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const effectivePrice =
                item.variant.price_override ?? item.product.sale_price ?? item.product.base_price;
              const imageUrl =
                item.product.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=300';

              return (
                <div key={item.variant_id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                  <img
                    src={imageUrl}
                    alt={item.product.name_en}
                    className="w-20 h-24 object-cover rounded bg-neutral-900 shrink-0 border border-neutral-800"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.product.slug}`}
                          onClick={() => setIsDrawerOpen(false)}
                          className="font-medium text-sm text-white hover:text-[#E31B23] line-clamp-1 transition-colors"
                        >
                          {item.product.name_en}
                        </Link>
                        <button
                          onClick={() => removeItem(item.variant_id)}
                          className="text-neutral-500 hover:text-red-400 text-xs p-1"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Size: <span className="text-white font-medium">{item.variant.size}</span>
                        {item.variant.color && (
                          <span> • Color: <span className="text-white font-medium">{item.variant.color}</span></span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.variant.stock_qty}
                        onChange={(qty) => updateQuantity(item.variant_id, qty)}
                      />
                      <span className="font-semibold text-sm text-white">
                        {formatPKR(effectivePrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-6 bg-[#161616] border-t border-neutral-800 space-y-4">
            {/* Promo Code Input */}
            <div>
              {coupon ? (
                <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 rounded border border-emerald-900/60 text-xs text-emerald-400">
                  <span>Coupon <strong>{coupon.code}</strong> applied (-{formatPKR(discountAmount)})</span>
                  <button onClick={removeCoupon} className="text-neutral-400 hover:text-white text-xs underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('cart.coupon_placeholder')}
                    className="flex-1 bg-black border border-neutral-700 px-3 py-2 text-xs rounded text-white focus:outline-none focus:border-[#E31B23] uppercase"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {t('cart.apply_coupon')}
                  </Button>
                </form>
              )}
              {couponFeedback && !coupon && (
                <p className={`text-xs mt-1 ${couponFeedback.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Calculations breakdown */}
            <div className="space-y-1.5 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span>{t('cart.subtotal')}</span>
                <span className="text-white font-medium">{formatPKR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>{t('cart.discount')}</span>
                  <span>-{formatPKR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('cart.delivery')}</span>
                <span className={deliveryCharge === 0 ? 'text-emerald-400 font-semibold' : 'text-white'}>
                  {deliveryCharge === 0 ? t('cart.delivery_free') : formatPKR(deliveryCharge)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
                <span>{t('cart.total')}</span>
                <span className="text-base text-[#E31B23]">{formatPKR(total)}</span>
              </div>
            </div>

            {/* Checkout action */}
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold uppercase tracking-wider"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/checkout');
                }}
              >
                {t('cart.checkout')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/cart');
                }}
              >
                View Full Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
