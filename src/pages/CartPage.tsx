import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../i18n/LanguageProvider';
import { formatPKR } from '../lib/format';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { Button } from '../components/ui/Button';
import { SEED_CITIES } from '../lib/constants';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    deliveryCharge,
    total,
    coupon,
    selectedCity,
    setSelectedCity,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { t } = useLanguage();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [feedback, setFeedback] = useState<{ valid: boolean; message: string } | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    setFeedback(res);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-white space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-3xl">
          🛍️
        </div>
        <h1 className="font-serif text-3xl font-bold">{t('cart.empty')}</h1>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          Explore our collection of bespoke Pakistani Shalwar Kameez, Waistcoats, Sherwanis, and Suits.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            {t('cart.empty_cta')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-white">
      <div className="flex items-baseline justify-between border-b border-neutral-800 pb-4">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
          {t('cart.title')}
        </h1>
        <span className="text-xs text-neutral-400 font-mono">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Items Table */}
        <div className="lg:col-span-2 divide-y divide-neutral-800 border-y border-neutral-800">
          {items.map((item) => {
            const price =
              item.variant.price_override ?? item.product.sale_price ?? item.product.base_price;
            const img = item.product.images?.[0]?.url;

            return (
              <div key={item.variant_id} className="py-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                <div className="flex gap-4 items-center">
                  <img
                    src={img}
                    alt={item.product.name_en}
                    className="w-20 h-24 object-cover rounded bg-neutral-900 shrink-0 border border-neutral-800"
                  />
                  <div>
                    <Link
                      to={`/product/${item.product.slug}`}
                      className="font-serif text-base font-bold text-white hover:text-[#E31B23] transition-colors"
                    >
                      {item.product.name_en}
                    </Link>
                    <p className="text-xs text-neutral-400 mt-1">
                      Size: <strong className="text-white">{item.variant.size}</strong>
                      {item.variant.color && (
                        <span> • Color: <strong className="text-white">{item.variant.color}</strong></span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Price: {formatPKR(price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <QuantityStepper
                    value={item.quantity}
                    max={item.variant.stock_qty}
                    onChange={(q) => updateQuantity(item.variant_id, q)}
                  />
                  <span className="font-serif font-bold text-base text-white w-24 text-right">
                    {formatPKR(price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeItem(item.variant_id)}
                    className="text-neutral-500 hover:text-red-400 text-sm p-1"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Box */}
        <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-6">
          <h3 className="font-serif text-lg font-bold">Order Summary</h3>

          {/* City Delivery Estimator */}
          <div className="space-y-1.5 text-xs">
            <label className="text-neutral-300 font-medium block">
              Delivery City (Pakistan)
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-black border border-neutral-700 px-3 py-2 rounded text-white focus:outline-none focus:border-[#E31B23]"
            >
              {SEED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Other">Other City</option>
            </select>
          </div>

          {/* Promo code */}
          <div>
            {coupon ? (
              <div className="flex items-center justify-between bg-neutral-900 px-3 py-2 rounded border border-emerald-900/60 text-xs text-emerald-400">
                <span>Code <strong>{coupon.code}</strong> applied</span>
                <button onClick={removeCoupon} className="text-neutral-400 hover:text-white underline text-[11px]">
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Promo Code (e.g. WELCOME10)"
                  className="flex-1 bg-black border border-neutral-700 px-3 py-2 text-xs rounded text-white focus:outline-none focus:border-[#E31B23] uppercase"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Apply
                </Button>
              </form>
            )}
            {feedback && !coupon && (
              <p className={`text-xs mt-1 ${feedback.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback.message}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-xs text-neutral-300 border-t border-neutral-800 pt-4">
            <div className="flex justify-between">
              <span>{t('cart.subtotal')}</span>
              <span className="text-white font-medium">{formatPKR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount</span>
                <span>-{formatPKR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Delivery</span>
              <span className={deliveryCharge === 0 ? 'text-emerald-400 font-bold' : 'text-white'}>
                {deliveryCharge === 0 ? 'FREE' : formatPKR(deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
              <span>{t('cart.total')}</span>
              <span className="text-[#E31B23]">{formatPKR(total)}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full uppercase font-bold tracking-wider"
            onClick={() => navigate('/checkout')}
          >
            {t('cart.checkout')}
          </Button>
        </div>
      </div>
    </div>
  );
};
