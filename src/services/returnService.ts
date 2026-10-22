import { ReturnRequest } from '../types/database';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_RETURNS = 'arts_apparel_returns';

const INITIAL_RETURNS: ReturnRequest[] = [
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

function loadReturns(): ReturnRequest[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RETURNS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...INITIAL_RETURNS];
}

let inMemoryReturns: ReturnRequest[] = loadReturns();

function saveReturns() {
  try {
    localStorage.setItem(STORAGE_KEY_RETURNS, JSON.stringify(inMemoryReturns));
  } catch {}
}

export const returnService = {
  async getReturns(): Promise<ReturnRequest[]> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('return_requests').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }
    return [...inMemoryReturns];
  },

  async requestReturn(orderId: string, reason: string, userId?: string): Promise<{ success: boolean; id: string }> {
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
    saveReturns();

    if (!isDemoMode && supabase) {
      await supabase.from('return_requests').insert([newReq]);
    }

    return { success: true, id: newReq.id };
  },

  async updateReturnStatus(id: string, status: 'approved' | 'rejected' | 'completed', staffNote?: string): Promise<boolean> {
    inMemoryReturns = inMemoryReturns.map((r) =>
      r.id === id ? { ...r, status, staff_note: staffNote || r.staff_note, updated_at: new Date().toISOString() } : r
    );
    saveReturns();
    if (!isDemoMode && supabase) {
      await supabase.from('return_requests').update({ status, staff_note: staffNote, updated_at: new Date().toISOString() }).eq('id', id);
    }
    return true;
  },
};
