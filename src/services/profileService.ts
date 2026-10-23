import { authService, AuthUser } from './authService';

export const profileService = {
  async getProfile(userId: string): Promise<AuthUser | null> {
    const profile = await authService.getUserProfile(userId);
    if (!profile) return null;
    return {
      id: profile.id,
      email: profile.email || '',
      full_name: profile.full_name || 'Customer',
      role: profile.role,
      phone: profile.phone || '',
    };
  },

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }): Promise<AuthUser | null> {
    return authService.updateProfile(userId, data);
  },
};
