import { ReturnRequest } from '../types/database';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_RETURNS = 'arts_demo_returns';

const INITIAL_DEMO_RETURNS: ReturnRequest[] = [
  {
    id: 'ret-1',
    order_id: 'ord-101',
    user_id: 'usr-1',
    reason: 'Size exchange needed from M to L for Waistcoat.',
    status: 'requested',
    staff_note: null,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
];

function loadDemoReturns(): ReturnRequest[] {
  if (typeof window === 'undefined') return [...INITIAL_DEMO_RETURNS];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RETURNS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...INITIAL_DEMO_RETURNS];
}

let inMemoryReturns: ReturnRequest[] = loadDemoReturns();

function saveDemoReturns() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(inMemoryReturns));
  } catch {}
}

export const returnService = {
  async getReturns(): Promise<ReturnRequest[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('return_requests').select('*').order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Failed to load return requests: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return [...inMemoryReturns];
    }

    return [];
  },

  async requestReturn(orderId: string, reason: string, userId?: string): Promise<{ success: boolean; id: string }> {
    if (!isDemoMode && supabase) {
      // Try documented RPC request_return first
      try {
        const { data, error } = await supabase.rpc('request_return', {
          p_order_id: orderId,
          p_reason: reason.trim(),
        });
        if (!error && data) {
          return { success: true, id: String(data) };
        }
      } catch (err) {
        console.warn('request_return RPC warning, trying direct table insert:', err);
      }

      const { data: inserted, error } = await supabase
        .from('return_requests')
        .insert([{
          order_id: orderId,
          user_id: userId || null,
          reason: reason.trim(),
          status: 'requested',
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Return request failed: ${error.message}`);
      }
      return { success: true, id: inserted.id };
    }

    if (isDemoMode) {
      const newReq: ReturnRequest = {
        id: `ret-${Date.now()}`,
        order_id: orderId,
        user_id: userId || null,
        reason: reason.trim(),
        status: 'requested',
        staff_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      inMemoryReturns = [newReq, ...inMemoryReturns];
      saveDemoReturns();
      return { success: true, id: newReq.id };
    }

    throw new Error('Database connection is not configured.');
  },

  async updateReturnStatus(id: string, status: 'approved' | 'rejected' | 'completed', staffNote?: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('return_requests')
        .update({
          status,
          staff_note: staffNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update return status: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryReturns = inMemoryReturns.map((r) =>
        r.id === id ? { ...r, status, staff_note: staffNote || r.staff_note, updated_at: new Date().toISOString() } : r
      );
      saveDemoReturns();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },
};
