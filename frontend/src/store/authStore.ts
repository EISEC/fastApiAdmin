import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, LoginCredentials, RegisterData, PasswordChangeData, User, AuthTokens, ApiErrorResponse } from '../types';
import { api } from '../lib/axios.config';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post<AuthTokens>('/auth/token/', credentials);
          
          // Store tokens
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          
          set({
            tokens: response,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch user profile
          await get().checkAuth();
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка входа в систему';
          
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.post('/auth/register/', data);
          
          // Auto-login after registration
          await get().login({
            email: data.email,
            password: data.password,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка регистрации';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await api.post<{ access: string }>('/auth/token/refresh/', {
            refresh: refreshToken,
          });

          localStorage.setItem('access_token', response.access);
          
          set(state => ({
            tokens: state.tokens ? { ...state.tokens, access: response.access } : null,
          }));
        } catch (error: unknown) {
          get().logout();
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedUser = await api.patch<User>('/auth/profile/', data);
          
          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления профиля';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      changePassword: async (data: PasswordChangeData) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.post('/auth/change-password/', data);
          
          set({ isLoading: false });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка смены пароля';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      checkAuth: async () => {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const user = await api.get<User>('/auth/me/');
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          get().logout();
          set({ isLoading: false });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 