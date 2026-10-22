import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | 'guest';
  isLoggedIn: boolean;
  isStaffOrOwner: boolean;
  isOwner: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, pass: string, name: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; phone?: string }) => Promise<void>;
  switchDemoRole: (role: UserRole | 'guest') => void;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    return authService.getCurrentSession();
  });

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

  // Optional quick switcher for admin testing without logging out
  const switchDemoRole = (newRole: UserRole | 'guest') => {
    if (newRole === 'guest') {
      logout();
      return;
    }
    const users = authService.getUsers();
    const match = users.find((u) => u.role === newRole);
    if (match) {
      localStorage.setItem('arts_auth_session', JSON.stringify(match));
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
        login,
        signup,
        logout,
        updateProfile,
        switchDemoRole,
        isDemo: false,
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
