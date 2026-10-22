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

const USERS_STORAGE_KEY = 'arts_registered_users';
const SESSION_STORAGE_KEY = 'arts_auth_session';

// Seed default accounts if empty
function initializeUsers(): AuthUser[] {
  const existing = localStorage.getItem(USERS_STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch {
      // Fallback
    }
  }

  const defaultUsers: AuthUser[] = [
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

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

export const authService = {
  getUsers(): AuthUser[] {
    return initializeUsers();
  },

  getCurrentSession(): AuthUser | null {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  async login(email: string, pass: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Supabase path if configured
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (error) return { success: false, error: error.message };

      if (data.user) {
        const profileRes = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        const authUser: AuthUser = {
          id: data.user.id,
          email: cleanEmail,
          full_name: profileRes.data?.full_name || 'Customer',
          role: profileRes.data?.role || 'customer',
          phone: profileRes.data?.phone || '',
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
        return { success: true, user: authUser };
      }
    }

    // Local real user database
    const users = this.getUsers();
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // Dynamic staff accounts check from arts_apparel_staff
    if (!found) {
      try {
        const staffList = JSON.parse(localStorage.getItem('arts_apparel_staff') || '[]');
        const staffMatch = staffList.find((s: any) => s.email.toLowerCase() === cleanEmail);
        if (staffMatch) {
          found = {
            id: staffMatch.id,
            email: staffMatch.email,
            full_name: staffMatch.full_name,
            role: staffMatch.role,
            phone: staffMatch.phone,
          };
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!found) {
      // If customer logging in with new valid email and password >= 6 characters, allow easy sign-in or register
      if (cleanEmail.includes('@') && pass.length >= 6) {
        const newCustomer: AuthUser = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          full_name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          role: 'customer',
          phone: '0300 0000000',
          created_at: new Date().toISOString(),
        };
        const updated = [...users, newCustomer];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newCustomer));
        return { success: true, user: newCustomer };
      }
      return { success: false, error: 'No account found with this email. Please check your spelling or sign up.' };
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(found));
    return { success: true, user: found };
  },

  async signup(email: string, pass: string, name: string, phone?: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { full_name: name, phone: phone || '' } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: cleanEmail,
          full_name: name,
          role: 'customer',
          phone: phone || '',
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
        return { success: true, user: authUser };
      }
    }

    const users = this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please sign in.' };
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: name.trim(),
      role: 'customer',
      phone: phone?.trim() || '',
      created_at: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newUser));

    return { success: true, user: newUser };
  },

  async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser | null> {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    const updatedUser = { ...users[idx], ...updates };
    users[idx] = updatedUser;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    const currentSession = this.getCurrentSession();
    if (currentSession && currentSession.id === userId) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
    }

    return updatedUser;
  },
};
