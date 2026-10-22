import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../types/database';
import { formatPKR } from '../../lib/format';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useLanguage } from '../../i18n/LanguageProvider';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { language } = useLanguage();

  const [isHovered, setIsHovered] = useState(false);
  const [isTargetLocked, setIsTargetLocked] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600' }];

  const primaryImage = images[0].url;
  const secondaryImage = images[1] ? images[1].url : primaryImage;

  const hasSale = product.sale_price !== null && product.sale_price < product.base_price;
  const discountPercent = hasSale
    ? Math.round(((product.base_price - product.sale_price!) / product.base_price) * 100)
    : 0;

  const inWishlist = isWishlisted(product.id);

  // Available variant colors
  const colors = Array.from(new Set(product.variants?.map((v) => v.color_hex || '#333333') || []));

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger target lock animation
    setIsTargetLocked(true);
    setTimeout(() => {
      setIsTargetLocked(false);
      const variant = product.variants?.[0];
      if (variant) {
        addItem(product, variant, 1);
      }
    }, 350);
  };

  return (
    <div
      className="group relative flex flex-col bg-black text-white rounded-[4px] overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 4:5 Image Container */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block w-full aspect-[4/5] bg-neutral-900 overflow-hidden"
      >
        {/* Primary Image */}
        <img
          src={primaryImage}
          alt={product.name_en}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
            isHovered && secondaryImage !== primaryImage ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Secondary Image crossfade on hover */}
        {secondaryImage !== primaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name_en} alternate angle`}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0'
            }`}
          />
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {hasSale && (
            <span className="bg-[#E31B23] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] shadow">
              -{discountPercent}% OFF
            </span>
          )}
          {product.is_new_arrival && (
            <span className="bg-black/90 text-white border border-neutral-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px]">
              NEW
            </span>
          )}
        </div>

        {/* Wishlist Heart Top Right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-neutral-700/60 flex items-center justify-center text-white hover:text-[#E31B23] hover:border-[#E31B23] transition-all"
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`w-4 h-4 transition-transform active:scale-125 ${inWishlist ? 'text-[#E31B23] fill-current' : 'fill-none'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Target Lock Signature Animation */}
        {isTargetLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="w-20 h-20 rounded-full border-2 border-[#E31B23] animate-target-lock flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#E31B23] rounded-full" />
            </div>
          </div>
        )}

        {/* Quick Add Bar on Desktop Hover */}
        <div className="hidden sm:block absolute inset-x-3 bottom-3 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full py-2.5 px-3 bg-black/90 hover:bg-[#E31B23] text-white border border-neutral-700 hover:border-[#E31B23] text-xs font-bold uppercase tracking-wider rounded-[4px] backdrop-blur-sm transition-colors shadow-xl"
          >
            + Quick Add
          </button>
        </div>
      </Link>

      {/* Product Details Below Image */}
      <div className="pt-3 pb-2 flex flex-col gap-1">
        {/* Colors Swatches preview */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-neutral-700"
                style={{ backgroundColor: c }}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-[10px] text-neutral-400">+{colors.length - 4}</span>
            )}
          </div>
        )}

        {/* Product Title */}
        <Link
          to={`/product/${product.slug}`}
          className="font-medium text-sm text-neutral-100 hover:text-[#E31B23] line-clamp-1 transition-colors"
        >
          {language === 'ur' ? product.name_ur : product.name_en}
        </Link>

        {/* Fabric hint */}
        {product.fabric && (
          <span className="text-[11px] text-neutral-400 font-normal line-clamp-1">
            {product.fabric}
          </span>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-0.5">
          {hasSale ? (
            <>
              <span className="font-bold text-sm text-[#E31B23]">
                {formatPKR(product.sale_price!)}
              </span>
              <span className="text-xs text-neutral-500 line-through">
                {formatPKR(product.base_price)}
              </span>
            </>
          ) : (
            <span className="font-bold text-sm text-white">
              {formatPKR(product.base_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
