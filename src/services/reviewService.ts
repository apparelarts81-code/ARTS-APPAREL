import { Review } from '../types/database';
import { DEMO_REVIEWS, DEMO_PRODUCTS } from '../demo/demoData';
import { isDemoMode, supabase } from '../lib/supabase';
import { aiService } from './aiService';

const STORAGE_KEY_REVIEWS = 'arts_demo_reviews';

function loadDemoReviews(): Review[] {
  if (typeof window === 'undefined') return [...DEMO_REVIEWS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEMO_REVIEWS];
}

let inMemoryReviews: Review[] = loadDemoReviews();

function saveDemoReviews() {
  if (typeof window === 'undefined') return;
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
      const { data, error } = await query;
      if (error) {
        throw new Error(`Failed to load reviews: ${error.message}`);
      }
      return data || [];
    }

    if (productId) {
      return inMemoryReviews.filter((r) => r.product_id === productId && r.is_approved);
    }
    return [...inMemoryReviews];
  },

  async getAllAdminReviews(): Promise<Review[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Failed to load admin reviews: ${error.message}`);
      }
      return data || [];
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
    if (!isDemoMode && supabase) {
      // Try documented RPC submit_review first
      try {
        const { data, error } = await supabase.rpc('submit_review', {
          p_product_id: input.product_id,
          p_rating: input.rating,
          p_title: input.title.trim(),
          p_comment: input.comment.trim(),
        });

        if (!error && data) {
          return { id: String(data), success: true };
        }
      } catch (err) {
        console.warn('submit_review RPC warning, trying table insert:', err);
      }

      const { data: inserted, error } = await supabase
        .from('reviews')
        .insert([{
          product_id: input.product_id,
          user_id: input.user_id,
          rating: input.rating,
          title: input.title.trim(),
          comment: input.comment.trim(),
          is_approved: false,
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit review: ${error.message}`);
      }
      return { id: inserted.id, success: true };
    }

    if (isDemoMode) {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        product_id: input.product_id,
        user_id: input.user_id || 'usr-demo',
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        is_approved: false,
        created_at: new Date().toISOString(),
      };

      inMemoryReviews = [newReview, ...inMemoryReviews];
      saveDemoReviews();
      return { id: newReview.id, success: true };
    }

    throw new Error('Database connection is not configured.');
  },

  async setReviewApproval(reviewId: string, isApproved: boolean): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('reviews').update({ is_approved: isApproved }).eq('id', reviewId);
      if (error) {
        throw new Error(`Failed to update review status: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryReviews = inMemoryReviews.map((r) =>
        r.id === reviewId ? { ...r, is_approved: isApproved } : r
      );
      saveDemoReviews();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async deleteReview(reviewId: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) {
        throw new Error(`Failed to delete review: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryReviews = inMemoryReviews.filter((r) => r.id !== reviewId);
      saveDemoReviews();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },

  async generateProductSummary(productId: string): Promise<{ summary_en: string; summary_ur: string }> {
    const reviews = await this.getReviews(productId);
    if (!reviews || reviews.length === 0) {
      return {
        summary_en: 'Not enough reviews to summarize.',
        summary_ur: 'خلاصہ پیش کرنے کے لیے ریویوز کی تعداد ناکافی ہے۔',
      };
    }

    let prodName = 'garment';
    if (isDemoMode) {
      const prod = DEMO_PRODUCTS.find((p) => p.id === productId);
      if (prod) prodName = prod.name_en;
    }

    return await aiService.generateReviewSummary(
      productId,
      prodName,
      reviews.map((r) => ({ rating: r.rating, comment: r.comment }))
    );
  },
};
