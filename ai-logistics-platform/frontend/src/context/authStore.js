import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login({ email, password });
          const { user, access_token } = response.data.data;
          
          localStorage.setItem('token', access_token);
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.detail || 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(userData);
          const { user, access_token } = response.data.data;
          
          localStorage.setItem('token', access_token);
          
          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.detail || 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await authAPI.getMe();
          set({
            user: response.data.data,
            token,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

export default useAuthStore;
