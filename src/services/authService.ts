import { UserRole, Profile } from '../types/database';
import { supabase, isDemoMode } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at?: string;
}

const DEMO_USERS_STORAGE_KEY = 'arts_demo_registered_users';
const DEMO_SESSION_STORAGE_KEY = 'arts_demo_auth_session';

const INITIAL_DEMO_USERS: AuthUser[] = [
  {
    id: 'usr-owner-1',
    email: 'owner@artsapparel.com',
    full_name: 'Muhammad Usman (Owner)',
    role: 'owner',
    phone: '0305 8165623',
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'usr-staff-1',
    email: 'staff@artsapparel.com',
    full_name: 'Bilal Ahmad (Store Staff)',
    role: 'staff',
    phone: '0305 8165624',
    created_at: new Date('2024-02-01').toISOString(),
  },
  {
    id: 'usr-cust-1',
    email: 'customer@example.com',
    full_name: 'Tariq Mehmood',
    role: 'customer',
    phone: '0300 1234567',
    created_at: new Date('2024-03-01').toISOString(),
  },
];

function initializeDemoUsers(): AuthUser[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_USERS;
  try {
    const existing = localStorage.getItem(DEMO_USERS_STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }
  } catch {}

  try {
    localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
  } catch {}
  return INITIAL_DEMO_USERS;
}

export const authService = {
  getDemoUsers(): AuthUser[] {
    return initializeDemoUsers();
  },

  async getUserProfile(userId: string): Promise<Profile | null> {
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) {
        console.warn('Failed to load user profile from Supabase:', error.message);
        return null;
      }
      return data as Profile;
    }

    if (isDemoMode) {
      const users = this.getDemoUsers();
      const match = users.find((u) => u.id === userId);
      if (match) {
        return {
          id: match.id,
          full_name: match.full_name,
          phone: match.phone || null,
          email: match.email,
          role: match.role,
          preferred_language: 'en',
          created_at: match.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    return null;
  },

  async getInitialSession(): Promise<AuthUser | null> {
    // In production with Supabase, restore from actual Supabase Auth session
    if (!isDemoMode && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          return null;
        }

        const profile = await this.getUserProfile(session.user.id);
        return {
          id: session.user.id,
          email: session.user.email || '',
          full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Customer',
          role: profile?.role || 'customer',
          phone: profile?.phone || session.user.user_metadata?.phone || '',
        };
      } catch (err) {
        console.warn('Supabase auth session check failed:', err);
        return null;
      }
    }

    // In demo mode only, restore from demo session storage
    if (isDemoMode && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
        if (!saved) return null;
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }

    return null;
  },

  async login(email: string, pass: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Authoritative Supabase Auth (Production Mode)
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await this.getUserProfile(data.user.id);
        const authUser: AuthUser = {
          id: data.user.id,
          email: cleanEmail,
          full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Customer',
          role: profile?.role || 'customer',
          phone: profile?.phone || data.user.user_metadata?.phone || '',
        };
        return { success: true, user: authUser };
      }
      return { success: false, error: 'Login failed. No user returned.' };
    }

    // 2. Explicit Demo Mode Authentication
    if (isDemoMode) {
      const users = this.getDemoUsers();
      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        // In demo mode, if valid test email and password >= 6, allow quick testing
        if (cleanEmail.includes('@') && pass.length >= 6) {
          const newCustomer: AuthUser = {
            id: `usr-demo-${Date.now()}`,
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            role: 'customer',
            phone: '0300 0000000',
            created_at: new Date().toISOString(),
          };
          const updated = [...users, newCustomer];
          try {
            localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(newCustomer));
          } catch {}
          return { success: true, user: newCustomer };
        }
        return { success: false, error: 'No demo account found with this email. (Available: owner@artsapparel.com, staff@artsapparel.com, customer@example.com)' };
      }

      try {
        localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(found));
      } catch {}
      return { success: true, user: found };
    }

    return { success: false, error: 'Authentication service is not configured.' };
  },

  async signup(email: string, pass: string, name: string, phone?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Authoritative Supabase Auth
    if (!isDemoMode && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone?.trim() || '',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: cleanEmail,
          full_name: name.trim(),
          role: 'customer', // Trigger on_auth_user_created enforces role='customer'
          phone: phone?.trim() || '',
        };
        return { success: true, user: authUser };
      }
      return { success: false, error: 'Registration failed: no user returned.' };
    }

    // 2. Demo Mode
    if (isDemoMode) {
      const users = this.getDemoUsers();
      if (users.find((u) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'An account with this email address already exists.' };
      }

      const newUser: AuthUser = {
        id: `usr-demo-${Date.now()}`,
        email: cleanEmail,
        full_name: name.trim(),
        role: 'customer',
        phone: phone?.trim() || '',
        created_at: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      try {
        localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(newUser));
      } catch {}
      return { success: true, user: newUser };
    }

    return { success: false, error: 'Authentication service is not configured.' };
  },

  async logout(): Promise<void> {
    if (!isDemoMode && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
      } catch {}
    }
  },

  async updateProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<AuthUser | null> {
    if (!isDemoMode && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name?.trim(),
          phone: updates.phone?.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Profile update failed: ${error.message}`);
      }

      const refreshed = await this.getUserProfile(userId);
      if (!refreshed) return null;
      return {
        id: refreshed.id,
        email: refreshed.email || '',
        full_name: refreshed.full_name || '',
        role: refreshed.role,
        phone: refreshed.phone || '',
      };

    }

    if (isDemoMode) {
      const users = this.getDemoUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) return null;

      const updatedUser = { ...users[idx], ...updates };
      users[idx] = updatedUser;
      try {
        localStorage.setItem(DEMO_USERS_STORAGE_KEY, JSON.stringify(users));
        localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch {}
      return updatedUser;
    }

    throw new Error('Database connection is not configured.');
  },
};
