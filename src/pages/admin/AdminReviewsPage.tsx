import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { catalogService } from '../../services/catalogService';
import { Review, Product } from '../../types/database';
import { formatDate } from '../../lib/format';
import { Button } from '../../components/ui/Button';

export const AdminReviewsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [summaries, setSummaries] = useState<Record<string, { en: string; ur: string }>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [revs, prods] = await Promise.all([
      reviewService.getAllAdminReviews(),
      catalogService.getProducts(),
    ]);
    setReviews(revs);
    setProducts(prods);
  };

  const handleApprove = async (id: string) => {
    await reviewService.setReviewApproval(id, true);
    await loadData();
  };

  const handleHide = async (id: string) => {
    await reviewService.setReviewApproval(id, false);
    await loadData();
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await reviewService.deleteReview(id);
    setConfirmDeleteId(null);
    await loadData();
  };

  const handleRefreshAiSummary = async (productId: string) => {
    setGeneratingFor(productId);
    try {
      const res = await reviewService.generateProductSummary(productId);
      setSummaries((prev) => ({
        ...prev,
        [productId]: { en: res.summary_en, ur: res.summary_ur },
      }));
    } finally {
      setGeneratingFor(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === 'pending') return !r.is_approved;
    if (filter === 'approved') return r.is_approved;
    return true;
  });

  const getProductName = (prodId: string) => {
    const found = products.find((p) => p.id === prodId);
    return found?.name_en || 'Tailored Garment';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">Customer Reviews & Ratings</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Moderate verified buyer reviews and refresh AI customer sentiment summaries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-[#E31B23] text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Pending ({reviews.filter((r) => !r.is_approved).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              Approved ({reviews.filter((r) => r.is_approved).length})
            </button>
          </div>
        </div>

        {/* AI Summary Banner per product */}
        <div className="p-4 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
              <span>🤖</span> AI Review Synthesizer (One-Click Summary)
            </h3>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
              Cached in review_summaries
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Generate or refresh the customer sentiment summary for any garment with verified buyer reviews.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {products.slice(0, 4).map((p) => (
              <Button
                key={p.id}
                variant="outline"
                size="sm"
                onClick={() => handleRefreshAiSummary(p.id)}
                disabled={generatingFor === p.id}
                className="text-[11px]"
              >
                {generatingFor === p.id ? 'Analyzing...' : `Refresh Summary: ${p.name_en.slice(0, 20)}...`}
              </Button>
            ))}
          </div>

          {Object.entries(summaries).map(([pId, s]) => (
            <div key={pId} className="mt-3 p-3 bg-neutral-900 border border-neutral-700/60 rounded text-xs space-y-1">
              <strong className="text-white block font-mono text-[11px]">Product: {getProductName(pId)}</strong>
              <p className="text-neutral-300"><strong>EN:</strong> {s.en}</p>
              <p className="text-neutral-300 font-urdu"><strong>UR:</strong> {s.ur}</p>
            </div>
          ))}
        </div>

        {/* Reviews List */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No reviews found matching filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rev) => (
              <div
                key={rev.id}
                className="p-5 bg-[#111111] border border-neutral-800 rounded-[8px] space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-white text-sm">{rev.title}</span>
                    <p className="text-neutral-400 text-[11px] mt-0.5">
                      Garment: <strong className="text-neutral-200">{getProductName(rev.product_id)}</strong> • {formatDate(rev.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 tracking-wider">
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rev.is_approved
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {rev.is_approved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>

                <p className={`text-neutral-300 leading-relaxed ${/[\u0600-\u06FF]/.test(rev.comment) ? 'font-urdu text-sm' : 'font-sans'}`}>
                  {rev.comment}
                </p>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800/60">
                  {!rev.is_approved ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(rev.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      ✓ Approve Review
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleHide(rev.id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      Hide Review
                    </Button>
                  )}
                  {confirmDeleteId === rev.id ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(rev.id)}
                      >
                        Confirm Delete
                      </Button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteId(rev.id)}
                      className="border-red-900/60 text-red-400 hover:bg-red-950/40"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
