import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageProvider';
import { bannerService } from '../services/bannerService';
import { catalogService } from '../services/catalogService';
import { Banner, Category, Product } from '../types/database';
import { ProductCard } from '../components/store/ProductCard';
import { TieLine } from '../components/ui/TieLine';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    bannerService.getBanners().then((bans) => {
      if (bans.length > 0) setBanners(bans);
    });
    catalogService.getCategories().then(setCategories);
    catalogService.getProducts().then(setProducts);
  }, []);

  // Auto rotate banners every 6s
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const activeBanners = banners.length > 0 ? banners : [{
    id: 'b-fallback',
    title_en: 'Signature Bespoke Tailoring',
    title_ur: 'شاہکار درزیانہ مہارت اور روایتی وقار',
    subtitle_en: 'Engineered for Pakistani weddings, formal galas, and festive moments.',
    subtitle_ur: 'شادی بیاہ، رسمی تقریبات اور پروقار محافل کے لیے مخصوص ملبوسات۔',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop',
    link_url: '/shop',
    button_text_en: 'Discover Collection',
    button_text_ur: 'مجموعہ ملاحظہ فرمائیں',
    sort_order: 1,
    is_active: true,
  }];

  const banner = activeBanners[currentSlide] || activeBanners[0];
  const newArrivals = products.filter((p) => p.is_new_arrival).slice(0, 4);
  const bestSellers = products.slice(0, 4);
  const saleProducts = products.filter((p) => p.sale_price !== null).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 bg-black text-white pb-16">
      {/* 1. HERO SLIDER */}
      <section className="relative w-full h-[82vh] min-h-[550px] max-h-[850px] overflow-hidden bg-black flex items-center">
        {/* Background slide image with cinematic dark overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={banner.image_url}
            alt={banner.title_en}
            className="w-full h-full object-cover object-top opacity-45 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-start justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#E31B23] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E31B23]">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black text-white max-w-3xl leading-[1.08] tracking-tight mb-5">
            {language === 'ur' ? banner.title_ur : banner.title_en}
          </h1>

          <p className="text-sm sm:text-lg text-neutral-300 max-w-xl font-light leading-relaxed mb-8">
            {language === 'ur' ? banner.subtitle_ur : banner.subtitle_en}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link to={banner.link_url || '/shop'}>
              <Button variant="primary" size="lg" className="uppercase font-bold tracking-wider">
                {language === 'ur' ? (banner.button_text_ur || 'شاپ کریں') : (banner.button_text_en || 'Explore Collection')}
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" size="lg" className="uppercase tracking-wider">
                {t('hero.secondary_cta')}
              </Button>
            </Link>
          </div>

          {/* Slide Indicator dots */}
          <div className="flex items-center gap-2 mt-12">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === i ? 'w-8 bg-[#E31B23]' : 'w-2 bg-neutral-600 hover:bg-neutral-400'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TILES (Curated Collections) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-800">
          <div>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23] block mb-1">
              ARTS Wardrobe
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
              {t('home.featured_categories')}
            </h2>
          </div>
          <Link to="/shop" className="text-xs uppercase font-bold tracking-wider text-neutral-400 hover:text-white transition-colors">
            {t('common.view_all')} →
          </Link>
        </div>

        {/* Category Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative block aspect-[3/4] rounded-[4px] overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-[#E31B23] transition-colors"
            >
              <img
                src={cat.image_url}
                alt={cat.name_en}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-75 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-x-2 bottom-3 text-center">
                <span className="font-serif text-sm font-bold text-white block group-hover:text-[#E31B23] transition-colors">
                  {language === 'ur' ? cat.name_ur : cat.name_en}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-800">
          <div>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23] block mb-1">
              Fresh Off The Loom
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
              {t('home.new_arrivals_title')}
            </h2>
          </div>
          <Link to="/shop?filter=new" className="text-xs uppercase font-bold tracking-wider text-neutral-400 hover:text-white transition-colors">
            {t('common.view_all')} →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. BRAND STATEMENT STRIP with TIE LINE DIVIDER */}
      <section className="bg-[#0D0D0D] border-y border-neutral-800 py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <TieLine height={44} />
          <p className="font-serif text-2xl sm:text-4xl font-bold leading-snug tracking-tight text-white">
            "{t('home.brand_statement')}"
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-[#E31B23] font-semibold">
            Bespoke Tailoring Studio — Club Road, Sadiqabad
          </p>
        </div>
      </section>

      {/* 5. BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-800">
          <div>
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23] block mb-1">
              Most Revered
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
              {t('home.best_sellers_title')}
            </h2>
          </div>
          <Link to="/shop" className="text-xs uppercase font-bold tracking-wider text-neutral-400 hover:text-white transition-colors">
            {t('common.view_all')} →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. OCCASIONS STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23] block mb-2">
            Tailored For Life
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold">
            {t('home.occasions_title')}
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: t('home.wedding'), sub: 'Sherwanis & Velvet Waistcoats', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600', link: '/category/sherwani' },
            { title: t('home.formal'), sub: 'Italian-Cut Suits & Crisp Shirts', img: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=600', link: '/category/suits' },
            { title: t('home.festive'), sub: 'Wash & Wear Shalwar Kameez', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600', link: '/category/shalwar-kameez' },
            { title: t('home.casual'), sub: 'Performance Track Suits & Caps', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600', link: '/category/track-suits' },
          ].map((item, i) => (
            <Link
              key={i}
              to={item.link}
              className="group relative aspect-[4/5] rounded-[4px] overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-[#E31B23] transition-colors"
            >
              <img
                src={item.img}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-65 group-hover:opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-x-4 bottom-4">
                <h3 className="font-serif text-lg font-bold text-white group-hover:text-[#E31B23] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-neutral-300 mt-0.5">{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. SALE HIGHLIGHTS */}
      {saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-800">
            <div>
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E31B23] block mb-1">
                Special Pricing
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[#E31B23]">
                {t('home.sale_title')}
              </h2>
            </div>
            <Link to="/shop?filter=sale" className="text-xs uppercase font-bold tracking-wider text-neutral-400 hover:text-white transition-colors">
              {t('common.view_all')} →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 8. TRUST ROW (Delivery, COD, 7-Day Returns, WhatsApp) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8 rounded-[8px] bg-[#111111] border border-neutral-800 text-left">
          <div className="flex items-start gap-4">
            <span className="text-2xl text-[#E31B23]">🚚</span>
            <div>
              <h4 className="font-bold text-sm text-white">{t('home.trust_delivery')}</h4>
              <p className="text-xs text-neutral-400 mt-1">{t('home.trust_delivery_sub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl text-[#E31B23]">💵</span>
            <div>
              <h4 className="font-bold text-sm text-white">{t('home.trust_cod')}</h4>
              <p className="text-xs text-neutral-400 mt-1">{t('home.trust_cod_sub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl text-[#E31B23]">🔄</span>
            <div>
              <h4 className="font-bold text-sm text-white">{t('home.trust_returns')}</h4>
              <p className="text-xs text-neutral-400 mt-1">{t('home.trust_returns_sub')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="text-2xl text-[#E31B23]">💬</span>
            <div>
              <h4 className="font-bold text-sm text-white">{t('home.trust_whatsapp')}</h4>
              <p className="text-xs text-neutral-400 mt-1">{t('home.trust_whatsapp_sub')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
