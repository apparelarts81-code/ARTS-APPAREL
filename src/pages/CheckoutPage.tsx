import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../i18n/LanguageProvider';
import { orderService } from '../services/orderService';
import { PaymentMethod } from '../types/database';
import { formatPKR, isValidPakistaniPhone } from '../lib/format';
import { SEED_CITIES } from '../lib/constants';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, discountAmount, deliveryCharge, total, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState('Sadiqabad');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // Manual payment proof fields
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-white space-y-4">
        <h2 className="font-serif text-2xl font-bold">Your cart is empty</h2>
        <p className="text-xs text-neutral-400">Add garments to your cart before proceeding to checkout.</p>
        <Link to="/shop">
          <Button variant="primary" size="sm">Explore Collection</Button>
        </Link>
      </div>
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter your full name');
      return;
    }

    if (!isValidPakistaniPhone(phone)) {
      setFormError('Please enter a valid Pakistani mobile number (e.g. 0305 8165623)');
      return;
    }

    if (!address.trim()) {
      setFormError('Please enter your complete delivery address');
      return;
    }

    // Screenshot requirement for non-COD methods
    if (paymentMethod !== 'cod' && !proofPreview) {
      setFormError('Please upload a screenshot of your payment transfer before placing the order.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderResult = await orderService.placeOrder({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        city,
        address: address.trim(),
        notes: notes.trim() || undefined,
        paymentMethod,
        couponCode: coupon?.code,
        items: items.map((it) => ({
          product_id: it.product_id,
          variant_id: it.variant_id,
          product_name: it.product.name_en,
          size: it.variant.size,
          color: it.variant.color,
          unit_price: it.variant.price_override ?? it.product.sale_price ?? it.product.base_price,
          quantity: it.quantity,
          line_total: (it.variant.price_override ?? it.product.sale_price ?? it.product.base_price) * it.quantity,
          image_url: it.product.images?.[0]?.url,
        })),
        subtotal,
        discountAmount,
        deliveryCharge,
        total,
        userId: user?.id || null,
        paymentProofFile: proofFile,
        paymentProofUrl: proofPreview || undefined,
        transactionId: transactionId.trim() || undefined,
      });

      clearCart();
      navigate(`/order-success/${orderResult.order_number}`, {
        state: { proofWarning: orderResult.proofUploadWarning },
      });
    } catch (err: any) {
      setFormError(err?.message || 'Failed to place order. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
          {t('checkout.title')}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          {t('checkout.guest_notice')}
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Form Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Customer & Delivery Address Details */}
          <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-4">
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E31B23] text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Delivery Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('checkout.full_name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Ali"
                required
              />
              <Input
                label={t('checkout.mobile')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0305 8165623"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('checkout.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ali@example.com (optional)"
              />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-xs font-medium uppercase tracking-wider text-neutral-300">
                  {t('checkout.city')}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 px-4 rounded-[6px] bg-[#161616] text-white border border-neutral-800 text-sm focus:outline-none focus:border-[#E31B23]"
                >
                  {SEED_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other City">Other City</option>
                </select>
              </div>
            </div>

            <Input
              label={t('checkout.address')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House / Office #, Street, Sector, Landmark"
              required
            />

            <Input
              label={t('checkout.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special tailoring request or delivery time preferences..."
            />
          </div>

          {/* 2. Payment Method Picker */}
          <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-5">
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E31B23] text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Payment Method</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cash on Delivery */}
              <label
                className={`p-4 rounded-[6px] border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'cod'
                    ? 'border-[#E31B23] bg-[#E31B23]/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#E31B23]"
                />
                <div>
                  <span className="font-bold text-sm block">💵 Cash on Delivery (COD)</span>
                  <span className="text-xs text-neutral-400">Pay cash in hand when your parcel arrives</span>
                </div>
              </label>

              {/* JazzCash */}
              <label
                className={`p-4 rounded-[6px] border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'jazzcash'
                    ? 'border-[#E31B23] bg-[#E31B23]/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="jazzcash"
                  checked={paymentMethod === 'jazzcash'}
                  onChange={() => setPaymentMethod('jazzcash')}
                  className="mt-1 accent-[#E31B23]"
                />
                <div>
                  <span className="font-bold text-sm block">⚡ JazzCash (Manual Transfer)</span>
                  <span className="text-xs text-neutral-400">Direct account transfer + screenshot</span>
                </div>
              </label>

              {/* Easypaisa */}
              <label
                className={`p-4 rounded-[6px] border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'easypaisa'
                    ? 'border-[#E31B23] bg-[#E31B23]/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="easypaisa"
                  checked={paymentMethod === 'easypaisa'}
                  onChange={() => setPaymentMethod('easypaisa')}
                  className="mt-1 accent-[#E31B23]"
                />
                <div>
                  <span className="font-bold text-sm block">🟢 Easypaisa (Manual Transfer)</span>
                  <span className="text-xs text-neutral-400">Send money from Easypaisa app</span>
                </div>
              </label>

              {/* Bank Transfer */}
              <label
                className={`p-4 rounded-[6px] border cursor-pointer transition-all flex items-start gap-3 ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-[#E31B23] bg-[#E31B23]/10'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={() => setPaymentMethod('bank_transfer')}
                  className="mt-1 accent-[#E31B23]"
                />
                <div>
                  <span className="font-bold text-sm block">🏦 Bank Account Transfer</span>
                  <span className="text-xs text-neutral-400">Meezan Bank online IBAN transfer</span>
                </div>
              </label>
            </div>

            {/* Account Details Box for Manual Payments */}
            {paymentMethod !== 'cod' && (
              <div className="p-4 bg-black rounded-[6px] border border-neutral-800 space-y-4 animate-in fade-in duration-200 text-xs">
                <div className="border-b border-neutral-800 pb-3">
                  <h4 className="font-bold text-sm text-[#E31B23] mb-1">
                    Store Payment Details
                  </h4>
                  <p className="text-neutral-400">
                    Transfer exactly <strong className="text-white">{formatPKR(total)}</strong> to the account below, then upload the receipt screenshot.
                  </p>
                </div>

                {paymentMethod === 'jazzcash' && (
                  <div className="space-y-2">
                    <p><strong>Account Title:</strong> {settings.jazzcash_account.title}</p>
                    <div className="flex items-center gap-3">
                      <p><strong>Account Number:</strong> {settings.jazzcash_account.number}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.jazzcash_account.number, 'jazzcash')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-white"
                      >
                        {copiedField === 'jazzcash' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'easypaisa' && (
                  <div className="space-y-2">
                    <p><strong>Account Title:</strong> {settings.easypaisa_account.title}</p>
                    <div className="flex items-center gap-3">
                      <p><strong>Account Number:</strong> {settings.easypaisa_account.number}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.easypaisa_account.number, 'easypaisa')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-white"
                      >
                        {copiedField === 'easypaisa' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-2">
                    <p><strong>Bank Name:</strong> {settings.bank_account.bank_name}</p>
                    <p><strong>Account Title:</strong> {settings.bank_account.account_title}</p>
                    <div className="flex items-center gap-3">
                      <p><strong>Account Number:</strong> {settings.bank_account.account_number}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bank_account.account_number, 'bank_acc')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-white"
                      >
                        {copiedField === 'bank_acc' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p><strong>IBAN:</strong> {settings.bank_account.iban}</p>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bank_account.iban, 'bank_iban')}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-white"
                      >
                        {copiedField === 'bank_iban' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Screenshot Upload Input */}
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <label className="font-bold text-white block">
                    Upload Payment Screenshot <span className="text-[#E31B23]">*</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofChange}
                    className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#E31B23] file:text-white hover:file:bg-[#A8121A] cursor-pointer"
                  />
                  {proofPreview && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={proofPreview}
                        alt="Transfer Screenshot"
                        className="w-16 h-16 object-cover rounded border border-neutral-700"
                      />
                      <span className="text-xs text-emerald-400">Receipt attached ✓</span>
                    </div>
                  )}

                  <Input
                    label="Transaction ID (Optional)"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. TID-109384729"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sticky Order Summary (1/3) */}
        <div className="bg-[#111111] p-6 rounded-[8px] border border-neutral-800 space-y-6 sticky top-28">
          <h3 className="font-serif text-lg font-bold">{t('checkout.order_summary')}</h3>

          {/* Items mini list */}
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.variant_id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-neutral-800 text-neutral-300 font-bold rounded flex items-center justify-center text-[10px]">
                    {it.quantity}x
                  </span>
                  <div>
                    <p className="font-medium text-white line-clamp-1">{it.product.name_en}</p>
                    <span className="text-neutral-400 text-[11px]">{it.variant.size} • {it.variant.color}</span>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  {formatPKR((it.variant.price_override ?? it.product.sale_price ?? it.product.base_price) * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-xs text-neutral-300 border-t border-neutral-800 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white font-medium">{formatPKR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({coupon?.code})</span>
                <span>-{formatPKR(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery ({city})</span>
              <span className={deliveryCharge === 0 ? 'text-emerald-400 font-bold' : 'text-white'}>
                {deliveryCharge === 0 ? 'FREE' : formatPKR(deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Payable</span>
              <span className="text-xl text-[#E31B23] font-serif">{formatPKR(total)}</span>
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded bg-red-950/60 border border-red-800 text-red-200 text-xs">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full uppercase font-bold tracking-wider"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {t('checkout.place_order')}
          </Button>


          <p className="text-[11px] text-neutral-400 text-center">
            By placing your order, you agree to ARTS APPAREL 7-day inspection and return policy.
          </p>
        </div>
      </form>
    </div>
  );
};
