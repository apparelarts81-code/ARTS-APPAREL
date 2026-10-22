import { ContactMessage } from '../types/database';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_MESSAGES = 'arts_apparel_messages';

const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Hamza Farooq',
    phone: '0312 9876543',
    email: 'hamza@example.com',
    message: 'Salam, do you do custom stitching for groom sherwanis for an upcoming December wedding?',
    status: 'new',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'msg-2',
    name: 'Noman Tariq',
    phone: '0300 1122334',
    email: 'noman@example.com',
    message: 'Can I visit your Sadiqabad Club Road outlet directly for fabric trials?',
    status: 'handled',
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

function loadMessages(): ContactMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...INITIAL_MESSAGES];
}

let inMemoryMessages: ContactMessage[] = loadMessages();

function saveMessages() {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(inMemoryMessages));
  } catch {}
}

export const contactService = {
  async submitMessage(data: { name: string; phone?: string; email?: string; message: string }): Promise<{ success: boolean; id: string }> {
    const newMsg: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      message: data.message.trim(),
      status: 'new',
      created_at: new Date().toISOString(),
    };

    inMemoryMessages = [newMsg, ...inMemoryMessages];
    saveMessages();

    if (!isDemoMode && supabase) {
      await supabase.from('contact_messages').insert([newMsg]);
    }

    return { success: true, id: newMsg.id };
  },

  async getMessages(): Promise<ContactMessage[]> {
    if (!isDemoMode && supabase) {
      const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) return data;
    }
    return [...inMemoryMessages];
  },

  async markHandled(id: string): Promise<boolean> {
    inMemoryMessages = inMemoryMessages.map((m) =>
      m.id === id ? { ...m, status: 'handled' as const } : m
    );
    saveMessages();
    if (!isDemoMode && supabase) {
      await supabase.from('contact_messages').update({ status: 'handled' }).eq('id', id);
    }
    return true;
  },
};
