import { ContactMessage } from '../types/database';
import { isDemoMode, supabase } from '../lib/supabase';

const STORAGE_KEY_MESSAGES = 'arts_demo_messages';

const INITIAL_DEMO_MESSAGES: ContactMessage[] = [
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

function loadDemoMessages(): ContactMessage[] {
  if (typeof window === 'undefined') return [...INITIAL_DEMO_MESSAGES];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...INITIAL_DEMO_MESSAGES];
}

let inMemoryMessages: ContactMessage[] = loadDemoMessages();

function saveDemoMessages() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(inMemoryMessages));
  } catch {}
}

export const contactService = {
  async submitMessage(data: { name: string; phone?: string; email?: string; message: string }): Promise<{ success: boolean; id: string }> {
    if (!isDemoMode && supabase) {
      const { data: inserted, error } = await supabase
        .from('contact_messages')
        .insert([{
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          message: data.message.trim(),
          status: 'new',
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
      return { success: true, id: inserted.id };
    }

    if (isDemoMode) {
      const newMsg: ContactMessage = {
        id: `msg-${Date.now()}`,
        name: data.name.trim(),
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        message: data.message.trim(),
        status: 'new',
        created_at: new Date().toISOString(),
      };

      inMemoryMessages = [newMsg, ...inMemoryMessages];
      saveDemoMessages();
      return { success: true, id: newMsg.id };
    }

    throw new Error('Database connection is not configured.');
  },

  async getMessages(): Promise<ContactMessage[]> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Failed to load messages: ${error.message}`);
      }
      return data || [];
    }

    if (isDemoMode) {
      return [...inMemoryMessages];
    }

    return [];
  },

  async markHandled(id: string): Promise<boolean> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase.from('contact_messages').update({ status: 'handled' }).eq('id', id);
      if (error) {
        throw new Error(`Failed to mark message as handled: ${error.message}`);
      }
      return true;
    }

    if (isDemoMode) {
      inMemoryMessages = inMemoryMessages.map((m) =>
        m.id === id ? { ...m, status: 'handled' as const } : m
      );
      saveDemoMessages();
      return true;
    }

    throw new Error('Database connection is not configured.');
  },
};
