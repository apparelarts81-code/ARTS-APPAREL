import { authService, AuthUser } from './authService';

export const profileService = {
  async getProfile(userId: string): Promise<AuthUser | null> {
    const users = authService.getUsers();
    return users.find((u) => u.id === userId) || null;
  },

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }): Promise<AuthUser | null> {
    return authService.updateProfile(userId, data);
  },
};
