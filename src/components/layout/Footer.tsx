import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useSettings } from '../../context/SettingsContext';
import { STORE_CONSTANTS } from '../../lib/constants';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { settings } = useSettings();

  const storeAddress = settings.address || STORE_CONSTANTS.address;
  const storePhone = settings.phone_number || STORE_CONSTANTS.phone_number;
  const storeEmail = settings.email || STORE_CONSTANTS.email;
  const fbUrl = settings.facebook_url || STORE_CONSTANTS.facebook_url;
  const ttUrl = settings.tiktok_url || STORE_CONSTANTS.tiktok_url;
  const waNumber = settings.whatsapp_number || STORE_CONSTANTS.whatsapp_number;

  return (
    <footer className="bg-black text-neutral-400 border-t border-neutral-800 text-xs mt-auto">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info & Address */}
          <div className="space-y-4">
            <BrandLogo showTagline={true} />
            <p className="text-neutral-400 leading-relaxed text-xs">
              Bespoke Pakistani menswear tailoring crafted with architectural precision. Dressed for the day that matters.
            </p>
            <div className="space-y-1.5 text-xs text-neutral-300">
              <p className="flex items-start gap-2">
                <span className="text-[#E31B23]">📍</span>
                <span>{storeAddress}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#E31B23]">📞</span>
                <span>{storePhone}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#E31B23]">✉️</span>
                <span>{storeEmail}</span>
              </p>
            </div>
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {fbUrl && (
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:border-[#E31B23] transition-colors"
                  aria-label="Facebook"
                >
                  FB
                </a>
              )}
              {ttUrl && (
                <a
                  href={ttUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:border-[#E31B23] transition-colors"
                  aria-label="TikTok"
                >
                  TT
                </a>
              )}
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white hover:border-[#E31B23] transition-colors"
                aria-label="WhatsApp"
              >
                WA
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              {t('nav.shop')}
            </h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="hover:text-white transition-colors">{t('nav.shop')}</Link></li>
              <li><Link to="/category/shalwar-kameez" className="hover:text-white transition-colors">Shalwar Kameez</Link></li>
              <li><Link to="/category/waistcoat" className="hover:text-white transition-colors">Bespoke Waistcoats</Link></li>
              <li><Link to="/category/sherwani" className="hover:text-white transition-colors">Groom Sherwanis</Link></li>
              <li><Link to="/category/suits" className="hover:text-white transition-colors">Italian-Cut Suits</Link></li>
              <li><Link to="/category/ties" className="hover:text-white transition-colors">Silk Ties & Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2">
              <li><Link to="/track-order" className="hover:text-white transition-colors">{t('nav.track_order')}</Link></li>
              <li><Link to="/policy/shipping-returns" className="hover:text-white transition-colors">Nationwide Shipping & Returns</Link></li>
              <li><Link to="/policy/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/policy/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* Payment Methods & Trust */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              Secure Payments
            </h4>
            <p className="text-xs text-neutral-400">
              We accept official payment methods across Pakistan with instant order processing.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-2.5 rounded bg-[#161616] border border-neutral-800 text-center font-bold text-neutral-300 text-[11px]">
                💵 Cash on Delivery
              </div>
              <div className="p-2.5 rounded bg-[#161616] border border-neutral-800 text-center font-bold text-neutral-300 text-[11px]">
                ⚡ JazzCash
              </div>
              <div className="p-2.5 rounded bg-[#161616] border border-neutral-800 text-center font-bold text-neutral-300 text-[11px]">
                🟢 Easypaisa
              </div>
              <div className="p-2.5 rounded bg-[#161616] border border-neutral-800 text-center font-bold text-neutral-300 text-[11px]">
                🏦 Bank Transfer
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Copyright Row */}
      <div className="border-t border-neutral-800/80 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} {STORE_CONSTANTS.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted for gentlemen across Pakistan</span>
            <span className="w-1.5 h-1.5 bg-[#E31B23] rounded-full inline-block" />
            <span>Sadiqabad</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
