import { Review } from '../types/database';
import { DEMO_REVIEWS, DEMO_PRODUCTS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';
import { aiService } from './aiService';

const STORAGE_KEY_REVIEWS = 'arts_apparel_reviews';

function loadReviews(): Review[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_REVIEWS];
}

let inMemoryReviews: Review[] = loadReviews();

function saveReviews() {
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(inMemoryReviews));
  } catch {}
}

export const reviewService = {
  async getReviews(productId?: string): Promise<Review[]> {
    if (!isDemoMode && supabase) {
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (productId) {
        query = query.eq('product_id', productId).eq('is_approved', true);
      }
      const { data } = await query;
      if (data && data.length > 0) return data;
    }

    if (productId) {
      return inMemoryReviews.filter((r) => r.product_id === productId && r.is_approved);
    }
    return [...inMemoryReviews];
  },

  async getAllAdminReviews(): Promise<Review[]> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }
    return [...inMemoryReviews];
  },

  async submitReview(input: {
    product_id: string;
    rating: number;
    title: string;
    comment: string;
    user_id?: string;
  }): Promise<{ id: string; success: boolean }> {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      product_id: input.product_id,
      user_id: input.user_id || 'usr-demo',
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      is_approved: false, // Moderated by staff per PRD
      created_at: new Date().toISOString(),
    };

    inMemoryReviews = [newReview, ...inMemoryReviews];
    saveReviews();

    if (!isDemoMode && supabase) {
      await supabase.from('reviews').insert([newReview]);
    }

    return { id: newReview.id, success: true };
  },

  async setReviewApproval(reviewId: string, isApproved: boolean): Promise<boolean> {
    inMemoryReviews = inMemoryReviews.map((r) =>
      r.id === reviewId ? { ...r, is_approved: isApproved } : r
    );
    saveReviews();

    if (!isDemoMode && supabase) {
      await supabase.from('reviews').update({ is_approved: isApproved }).eq('id', reviewId);
    }
    return true;
  },

  async deleteReview(reviewId: string): Promise<boolean> {
    inMemoryReviews = inMemoryReviews.filter((r) => r.id !== reviewId);
    saveReviews();

    if (!isDemoMode && supabase) {
      await supabase.from('reviews').delete().eq('id', reviewId);
    }
    return true;
  },

  async generateProductSummary(productId: string): Promise<{ summary_en: string; summary_ur: string }> {
    const productReviews = inMemoryReviews.filter((r) => r.product_id === productId);
    const prod = DEMO_PRODUCTS.find((p) => p.id === productId);
    const prodName = prod?.name_en || 'garment';

    return await aiService.generateReviewSummary(
      productId,
      prodName,
      productReviews.map((r) => ({ rating: r.rating, comment: r.comment }))
    );
  },
};
