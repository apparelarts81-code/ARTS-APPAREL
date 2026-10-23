import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { authService, AuthUser } from '../services/authService';
import { isDemoMode, supabase } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | 'guest';
  isLoggedIn: boolean;
  isStaffOrOwner: boolean;
  isOwner: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; phone?: string }) => Promise<void>;
  switchDemoRole: (role: UserRole | 'guest') => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const initial = await authService.getInitialSession();
        if (isMounted) {
          setUser(initial);
        }
      } catch (err) {
        console.warn('Initial auth session check error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to authoritative Supabase auth state changes in production
    if (!isDemoMode && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          try {
            const profile = await authService.getUserProfile(session.user.id);
            if (isMounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: profile?.full_name || session.user.user_metadata?.full_name || 'Customer',
                role: profile?.role || 'customer',
                phone: profile?.phone || session.user.user_metadata?.phone || '',
              });
            }
          } catch {
            if (isMounted) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'Customer',
                role: 'customer',
                phone: session.user.user_metadata?.phone || '',
              });
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.login(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid credentials' };
  };

  const signup = async (email: string, pass: string, name: string, phone?: string): Promise<{ success: boolean; error?: string }> => {
    const res = await authService.signup(email, pass, name, phone);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create account' };
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: { full_name?: string; phone?: string }) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updates);
    if (updated) {
      setUser(updated);
    }
  };

  // Demo role switcher strictly enabled in Demo Mode only
  const switchDemoRole = (newRole: UserRole | 'guest') => {
    if (!isDemoMode) {
      console.warn('Role switching is disabled in production mode. Roles are determined by Supabase profiles.');
      return;
    }

    if (newRole === 'guest') {
      logout();
      return;
    }

    const demoUsers = authService.getDemoUsers();
    const match = demoUsers.find((u) => u.role === newRole);
    if (match) {
      try {
        localStorage.setItem('arts_demo_auth_session', JSON.stringify(match));
      } catch {}
      setUser(match);
    }
  };

  const role: UserRole | 'guest' = user ? user.role : 'guest';
  const isStaffOrOwner = role === 'staff' || role === 'owner';
  const isOwner = role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoggedIn: !!user,
        isStaffOrOwner,
        isOwner,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        switchDemoRole,
        isDemo: isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
