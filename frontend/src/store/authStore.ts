import { create } from 'zustand';
import { login as loginAPI, logout as logoutAPI, checkAuth as checkAuthAPI } from '../api/auth';
import type { LoginRequest } from '../types/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      await loginAPI(credentials);
      set({ isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        isAuthenticated: false,
        isLoading: false,
        error: error.error || '登录失败',
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await logoutAPI();
      set({ isAuthenticated: false, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.error || '登出失败',
      });
    }
  },

  checkAuth: async () => {
    try {
      await checkAuthAPI();
      set({ isAuthenticated: true });
    } catch (error) {
      set({ isAuthenticated: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
