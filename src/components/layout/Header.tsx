import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { useLanguage } from '../../i18n/LanguageProvider';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { catalogService } from '../../services/catalogService';
import { Category } from '../../types/database';
import { MobileNav } from './MobileNav';

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const { itemCount, setIsDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();
  const { user, isStaffOrOwner } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    catalogService.getCategories().then(setCategories);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-neutral-800 transition-colors">
      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-neutral-300 hover:text-white rounded focus:outline-none focus:ring-1 focus:ring-[#E31B23]"
            aria-label="Open mobile menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <BrandLogo showTagline={false} />
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          <Link to="/" className="text-neutral-300 hover:text-white transition-colors">
            {t('nav.home')}
          </Link>
          <Link to="/shop" className="text-neutral-300 hover:text-white transition-colors">
            {t('nav.shop')}
          </Link>

          {/* Categories Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsCategoryDropdownOpen(true)}
            onMouseLeave={() => setIsCategoryDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-neutral-300 hover:text-white transition-colors py-2 focus:outline-none">
              <span>{t('nav.categories')}</span>
              <svg className="w-3.5 h-3.5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 w-64 bg-[#161616] border border-neutral-800 rounded-[6px] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setIsCategoryDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                  >
                    <span>{language === 'ur' ? cat.name_ur : cat.name_en}</span>
                    <span className="text-neutral-500 text-[10px]">→</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/shop?filter=new" className="text-neutral-300 hover:text-white transition-colors">
            {t('nav.new_arrivals')}
          </Link>
          <Link to="/shop?filter=sale" className="text-[#E31B23] font-semibold hover:text-[#A8121A] transition-colors">
            {t('nav.sale')}
          </Link>
          <Link to="/track-order" className="text-neutral-300 hover:text-white transition-colors">
            {t('nav.track_order')}
          </Link>

          {isStaffOrOwner && (
            <Link
              to="/admin"
              className="bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 px-2.5 py-1 rounded text-xs tracking-wider uppercase font-bold"
            >
              {t('nav.admin')}
            </Link>
          )}
        </nav>

        {/* Right Action Icons & Search */}
        <div className="flex items-center gap-3">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex relative items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.search_placeholder')}
              className="w-48 lg:w-56 h-9 pl-8 pr-3 text-xs bg-[#161616] text-white border border-neutral-800 rounded-[4px] focus:outline-none focus:border-[#E31B23] focus:w-64 transition-all"
            />
            <svg
              className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Language Toggle (EN | اردو) */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-neutral-700 hover:border-white text-neutral-200 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#E31B23] font-['Noto_Naskh_Arabic',sans-serif]"
            title="Switch Language / زبان تبدیل کریں"
          >
            {language === 'en' ? 'اردو' : 'English'}
          </button>

          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            className="relative p-2 text-neutral-300 hover:text-white transition-colors"
            aria-label="Wishlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistIds.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E31B23] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </Link>

          {/* Account Link */}
          <Link
            to={user ? '/account' : '/login'}
            className="p-2 text-neutral-300 hover:text-white transition-colors"
            aria-label="Account"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          {/* Cart Icon with Live Count */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 text-neutral-300 hover:text-white transition-colors focus:outline-none"
            aria-label="Open Shopping Bag"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#E31B23] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
};
