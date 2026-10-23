import React, { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageProvider';
import { Button } from '../components/ui/Button';
import { TieLine } from '../components/ui/TieLine';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const proofWarning = (location.state as { proofWarning?: string } | null)?.proofWarning;
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-white space-y-8">
      {/* Animated Checkmark Circle with Tie Line */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <TieLine height={32} />
        <div className="w-20 h-20 rounded-full bg-black border-2 border-[#1F8A4C] flex items-center justify-center text-[#1F8A4C] shadow-2xl animate-in zoom-in duration-300">
          <svg className="w-10 h-10 text-[#1F8A4C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-white">
          {t('order_success.title')}
        </h1>
        <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
          {t('order_success.subtitle')}
        </p>
      </div>

      {/* Order Number Banner */}
      <div className="p-6 rounded-[8px] bg-[#111111] border border-neutral-800 max-w-md mx-auto space-y-3">
        <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block">
          {t('order_success.order_number')}
        </span>
        <div className="flex items-center justify-center gap-3">
          <span className="font-serif font-black text-2xl sm:text-3xl tracking-wider text-[#E31B23]">
            {orderNumber || 'ARTS-000101'}
          </span>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded transition-colors"
          >
            {copied ? 'Copied! ✓' : 'Copy'}
          </button>
        </div>
        <p className="text-[11px] text-neutral-400">
          Save this order number to track your courier shipment anytime.
        </p>
      </div>

      {/* Post-order Proof Follow-up Notice */}
      {proofWarning && (
        <div className="p-4 rounded-[8px] bg-amber-950/80 border border-amber-700 text-amber-200 text-xs max-w-md mx-auto text-left space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-amber-100">
            <span>⚠️</span>
            <span>Payment Receipt Notice</span>
          </p>
          <p>{proofWarning}</p>
          <Link
            to={`/track-order?order=${orderNumber || ''}`}
            className="inline-block text-[#E31B23] hover:underline font-semibold"
          >
            Upload receipt on Track Order &rarr;
          </Link>
        </div>
      )}

      {/* Guest Account Prompt */}
      <div className="p-6 rounded-[8px] bg-gradient-to-r from-neutral-900 to-[#141414] border border-neutral-800 text-left max-w-md mx-auto space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h4 className="font-serif font-bold text-sm text-white">Faster Checkout Next Time</h4>
        </div>
        <p className="text-xs text-neutral-300">
          {t('order_success.create_account_card')}
        </p>
        <Link to="/signup" className="inline-block">
          <Button variant="secondary" size="sm">
            Create Account
          </Button>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link to={`/track-order?order=${orderNumber || ''}`}>
          <Button variant="primary" size="md" className="uppercase font-bold tracking-wider">
            {t('order_success.track_order')}
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="outline" size="md">
            {t('order_success.continue_shopping')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
