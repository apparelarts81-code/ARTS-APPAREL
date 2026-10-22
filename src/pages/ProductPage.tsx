import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '../services/catalogService';
import { Product, ProductVariant } from '../types/database';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../i18n/LanguageProvider';
import { formatPKR } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SizeChartModal } from '../components/store/SizeChartModal';
import { SizeRecommender } from '../components/store/SizeRecommender';
import { ProductCard } from '../components/store/ProductCard';
import { reviewService } from '../services/reviewService';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Review } from '../types/database';

export const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { settings } = useSettings();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isRecommenderOpen, setIsRecommenderOpen] = useState(false);
  const [isTargetLocking, setIsTargetLocking] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'fabric' | 'reviews'>('details');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aiSummary, setAiSummary] = useState<{ summary_en: string; summary_ur: string } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    catalogService.getProductBySlug(slug).then((prod) => {
      setProduct(prod);
      if (prod && prod.variants && prod.variants.length > 0) {
        // Select first in-stock variant by default
        const inStock = prod.variants.find((v) => v.stock_qty > 0) || prod.variants[0];
        setSelectedVariant(inStock);
      }
      if (prod) {
        reviewService.getReviews(prod.id).then(setReviews);
        reviewService.generateProductSummary(prod.id).then(setAiSummary);
      }
      // Related products
      catalogService.getProducts().then((all) => {
        setRelatedProducts(all.filter((p) => p.slug !== slug).slice(0, 4));
      });
    });
  }, [slug]);

  if (!product) {
    return (
      <div className="py-32 text-center text-white">
        <h2 className="font-serif text-2xl font-bold">Loading bespoke product...</h2>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=900' }];

  const currentImage = images[selectedImageIndex] || images[0];

  const effectivePrice =
    selectedVariant?.price_override ?? product.sale_price ?? product.base_price;
  const isSale = product.sale_price !== null && product.sale_price < product.base_price;
  const inWishlist = isWishlisted(product.id);

  const isLowStock = selectedVariant && selectedVariant.stock_qty > 0 && selectedVariant.stock_qty <= settings.low_stock_threshold;
  const isOutOfStock = !selectedVariant || selectedVariant.stock_qty <= 0;

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;
    setIsTargetLocking(true);
    setTimeout(() => {
      setIsTargetLocking(false);
      addItem(product, selectedVariant, 1);
    }, 350);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newComment.trim()) return;
    await reviewService.submitReview({
      product_id: product.id,
      rating: newRating,
      title: newTitle.trim(),
      comment: newComment.trim(),
      user_id: user?.id,
    });
    setReviewSubmitted(true);
    setShowReviewForm(false);
    setNewTitle('');
    setNewComment('');
  };

  // WhatsApp prefilled message
  const whatsappMsg = `Assalam o Alaikum! I want to order "${product.name_en}" in Size: ${selectedVariant?.size || 'Standard'} and Color: ${selectedVariant?.color || 'Standard'}. Link: ${window.location.href}`;
  const whatsappUrl = `https://wa.me/${settings.whatsapp_number || '923058165623'}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-white">
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 flex items-center gap-2">
        <Link to="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-white">Shop</Link>
        <span>/</span>
        <span className="text-neutral-200 line-clamp-1">{language === 'ur' ? product.name_ur : product.name_en}</span>
      </nav>

      {/* Main Product Layout: Gallery Left, Sticky Specs Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        {/* Gallery */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px] shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded overflow-hidden border transition-all shrink-0 ${
                    selectedImageIndex === idx ? 'border-[#E31B23] ring-1 ring-[#E31B23]' : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Large Main Image */}
          <div className="relative flex-1 aspect-[4/5] bg-neutral-900 rounded-[4px] overflow-hidden border border-neutral-800">
            <img
              src={currentImage.url}
              alt={product.name_en}
              className="w-full h-full object-cover"
            />
            {/* Target Lock Animation */}
            {isTargetLocking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-24 h-24 rounded-full border-2 border-[#E31B23] animate-target-lock flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#E31B23] rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="flex flex-col space-y-6">
          {/* Title & Ratings */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest text-[#E31B23] font-bold">
                ARTS Signature Cut
              </span>
              {isSale && <Badge variant="sale">SALE</Badge>}
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              {language === 'ur' ? product.name_ur : product.name_en}
            </h1>
            {/* Review stars summary */}
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <div className="flex text-amber-400">
                {'★'.repeat(Math.round(product.rating_avg || 5))}
              </div>
              <span>{product.rating_avg} ({product.rating_count} reviews)</span>
              <span>•</span>
              <span className="text-neutral-500 font-mono text-[11px]">SKU: {selectedVariant?.sku || 'ARTS-001'}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-800">
            <span className="font-serif text-3xl font-black text-[#E31B23]">
              {formatPKR(effectivePrice)}
            </span>
            {isSale && (
              <span className="text-base text-neutral-500 line-through">
                {formatPKR(product.base_price)}
              </span>
            )}
            <span className="text-xs text-neutral-400">Includes all taxes</span>
          </div>

          {/* Color Selection */}
          {product.variants && (
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-neutral-300 block mb-2">
                Color: <span className="text-white font-normal">{selectedVariant?.color}</span>
              </label>
              <div className="flex items-center gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`w-7 h-7 rounded-full border-2 transition-all p-0.5 ${
                      selectedVariant?.id === v.id ? 'border-[#E31B23] scale-110' : 'border-neutral-700 opacity-70 hover:opacity-100'
                    }`}
                    title={v.color}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: v.color_hex || '#222' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection with Sizing Tools */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase font-bold tracking-wider text-neutral-300">
                Size
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecommenderOpen(true)}
                  className="text-xs text-[#E31B23] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>✨</span>
                  <span>{t('product.find_my_size')}</span>
                </button>
                <span className="text-neutral-600">|</span>
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  {t('product.size_chart')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const outOfStock = v.stock_qty <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={outOfStock}
                    onClick={() => setSelectedVariant(v)}
                    className={`py-2.5 text-center text-xs font-semibold rounded border transition-all ${
                      isSelected
                        ? 'border-[#E31B23] bg-[#E31B23] text-white shadow'
                        : outOfStock
                        ? 'border-neutral-800 bg-neutral-900/50 text-neutral-600 cursor-not-allowed line-through'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-neutral-500'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>

            {/* Stock status indicator */}
            <div className="mt-2.5">
              {isOutOfStock ? (
                <span className="text-xs text-neutral-500">Currently out of stock</span>
              ) : isLowStock ? (
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <span>⚠️</span> Only {selectedVariant?.stock_qty} left in stock!
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-medium">In Stock — Ready to dispatch</span>
              )}
            </div>
          </div>

          {/* Action Buttons: Add to Cart + WhatsApp */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1 font-bold uppercase tracking-wider text-sm"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                {t('product.add_to_cart')}
              </Button>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`w-13 h-13 rounded-[6px] border flex items-center justify-center transition-colors ${
                  inWishlist
                    ? 'border-[#E31B23] bg-[#E31B23]/10 text-[#E31B23]'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white'
                }`}
                aria-label="Wishlist"
              >
                <svg className={`w-5 h-5 ${inWishlist ? 'fill-current' : 'fill-none'}`} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Direct WhatsApp Ordering */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-[6px] bg-black border border-neutral-700 hover:border-[#E31B23] text-white flex items-center justify-center gap-2 text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <span>💬</span>
              <span>{t('product.order_whatsapp')}</span>
            </a>
          </div>

          {/* Garment Details & Accordion */}
          <div className="border-t border-neutral-800 pt-6 space-y-4">
            <div className="flex gap-4 border-b border-neutral-800 pb-2">
              <button
                onClick={() => setActiveTab('details')}
                className={`text-xs uppercase font-bold tracking-wider pb-1 transition-colors ${
                  activeTab === 'details' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('fabric')}
                className={`text-xs uppercase font-bold tracking-wider pb-1 transition-colors ${
                  activeTab === 'fabric' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Fabric & Care
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-xs uppercase font-bold tracking-wider pb-1 transition-colors ${
                  activeTab === 'reviews' ? 'border-b-2 border-[#E31B23] text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            {activeTab === 'details' && (
              <p className="text-xs text-neutral-300 leading-relaxed">
                {language === 'ur' ? product.description_ur : product.description_en}
              </p>
            )}

            {activeTab === 'fabric' && (
              <div className="space-y-2 text-xs text-neutral-300">
                <p><strong>Fabric:</strong> {product.fabric || 'Superfine Pakistani Cotton'}</p>
                <p><strong>Finish:</strong> Anti-wrinkle, breathable soft finish</p>
                <p><strong>Care Instructions:</strong> Dry clean recommended or gentle cold machine wash. Steam press inside out.</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-5">
                {/* AI Review Summary Box */}
                {aiSummary && (
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded text-xs space-y-1.5">
                    <span className="text-[#E31B23] font-bold uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                      <span>✨</span> AI Verified Buyer Summary
                    </span>
                    <p className={`text-neutral-300 leading-relaxed ${language === 'ur' ? 'font-urdu' : 'font-sans'}`}>
                      {language === 'ur' ? aiSummary.summary_ur : aiSummary.summary_en}
                    </p>
                  </div>
                )}

                {/* Review submission success alert */}
                {reviewSubmitted && (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded text-emerald-300 text-xs">
                    Thank you! Your verified review has been submitted for moderation.
                  </div>
                )}

                {/* Write review toggle & form */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-neutral-400">
                    {reviews.length} Verified Customer Reviews
                  </span>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-xs text-[#E31B23] hover:underline font-semibold"
                  >
                    {showReviewForm ? 'Cancel' : '+ Write a Review'}
                  </button>
                </div>

                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="p-4 bg-black rounded border border-neutral-800 space-y-3 text-xs">
                    <h4 className="font-bold text-white">Share Your Experience</h4>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Rating</label>
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="bg-[#161616] text-white p-2 rounded border border-neutral-700 w-full"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent Tailoring)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                        <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                        <option value={2}>⭐⭐ (2/5 Needs Improvement)</option>
                        <option value={1}>⭐ (1/5 Unsatisfied)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Review Headline</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Magnificent stitch quality and fabric!"
                        className="bg-[#161616] text-white p-2 rounded border border-neutral-700 w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Your Detailed Feedback</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Describe the drape, sizing accuracy, and fabric comfort..."
                        className="bg-[#161616] text-white p-2 rounded border border-neutral-700 w-full h-20"
                        required
                      />
                    </div>
                    <Button type="submit" variant="primary" size="sm" className="w-full">
                      Submit Verified Review
                    </Button>
                  </form>
                )}

                {/* Customer Reviews List */}
                {reviews.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-500">
                    Be the first gentleman to review this bespoke garment.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800 space-y-3">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="pt-3 first:pt-0">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{rev.user_name || 'Verified Customer'}</span>
                          <span className="text-amber-400">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                        </div>
                        <p className="font-medium text-xs text-neutral-200 mt-1">{rev.title}</p>
                        <p className={`text-xs text-neutral-400 mt-0.5 ${/[\u0600-\u06FF]/.test(rev.comment) ? 'font-urdu text-sm' : ''}`}>{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-neutral-800">
          <h3 className="font-serif text-2xl font-bold mb-6">{t('product.related_products')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Chart Modal */}
      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        categoryId={product.category_id}
        categoryName={product.name_en}
      />

      {/* Smart Size Recommender Modal */}
      <SizeRecommender
        isOpen={isRecommenderOpen}
        onClose={() => setIsRecommenderOpen(false)}
        categoryId={product.category_id}
        onSelectSize={(recommendedSize) => {
          const match = product.variants?.find((v) => v.size.toLowerCase() === recommendedSize.toLowerCase());
          if (match) setSelectedVariant(match);
        }}
      />

      {/* Sticky Mobile Bottom Bar per Design Brief §5.2 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-black/95 backdrop-blur-md border-t border-neutral-800 p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-neutral-400 font-medium tracking-wider">
            {selectedVariant ? `Size: ${selectedVariant.size}` : 'Price'}
          </span>
          <span className="font-serif font-black text-lg text-white">
            {formatPKR(effectivePrice)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded bg-[#161616] border border-neutral-700 flex items-center justify-center text-white hover:border-[#E31B23] transition-colors shrink-0"
            aria-label="Order on WhatsApp"
          >
            <span className="text-sm">💬</span>
          </a>

          <Button
            variant="primary"
            size="md"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="px-4 font-bold uppercase text-xs tracking-wider"
          >
            {!isOutOfStock ? t('product.add_to_cart') : t('product.out_of_stock')}
          </Button>
        </div>
      </div>
    </div>
  );
};
