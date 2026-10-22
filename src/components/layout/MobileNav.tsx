import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalogService';
import { Category } from '../../types/database';
import { BrandLogo } from './BrandLogo';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isStaffOrOwner } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#111111] border-r border-neutral-800 shadow-2xl flex flex-col z-10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <BrandLogo showTagline={false} />
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 text-sm rounded focus:outline-none"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          <div className="flex flex-col space-y-3 font-medium">
            <Link to="/" onClick={onClose} className="text-white hover:text-[#E31B23] transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/shop" onClick={onClose} className="text-white hover:text-[#E31B23] transition-colors">
              {t('nav.shop')}
            </Link>
            <Link to="/shop?filter=new" onClick={onClose} className="text-white hover:text-[#E31B23] transition-colors">
              {t('nav.new_arrivals')}
            </Link>
            <Link to="/shop?filter=sale" onClick={onClose} className="text-[#E31B23] font-bold">
              {t('nav.sale')}
            </Link>
            <Link to="/track-order" onClick={onClose} className="text-white hover:text-[#E31B23] transition-colors">
              {t('nav.track_order')}
            </Link>
            {isStaffOrOwner && (
              <Link to="/admin" onClick={onClose} className="text-amber-400 font-bold uppercase tracking-wider">
                {t('nav.admin')}
              </Link>
            )}
          </div>

          <hr className="border-neutral-800" />

          {/* Categories List */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
              {t('nav.categories')}
            </h4>
            <div className="flex flex-col space-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="text-neutral-300 hover:text-white py-1 flex items-center justify-between"
                >
                  <span>{language === 'ur' ? cat.name_ur : cat.name_en}</span>
                  <span className="text-neutral-600 text-xs">→</span>
                </Link>
              ))}
            </div>
          </div>

          <hr className="border-neutral-800" />

          {/* Account / Support */}
          <div className="flex flex-col space-y-2.5 text-xs text-neutral-300">
            <Link to={user ? '/account' : '/login'} onClick={onClose} className="hover:text-white">
              {user ? `Account (${user.full_name})` : t('nav.login')}
            </Link>
            <Link to="/about" onClick={onClose} className="hover:text-white">
              {t('nav.about')}
            </Link>
            <Link to="/contact" onClick={onClose} className="hover:text-white">
              {t('nav.contact')}
            </Link>
          </div>
        </div>

        {/* Footer Language switch */}
        <div className="p-6 bg-[#161616] border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs text-neutral-400">Language:</span>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-xs font-bold rounded bg-neutral-800 text-white border border-neutral-700"
          >
            {language === 'en' ? 'اردو میں دیکھیں' : 'Switch to English'}
          </button>
        </div>
      </div>
    </div>
  );
};
