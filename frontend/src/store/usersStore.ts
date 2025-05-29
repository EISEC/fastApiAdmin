import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, UsersStore, ApiErrorResponse } from '../types';
import { api } from '../lib/axios.config';

export interface UserCreateData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: number;
  parent_user?: number;
  is_active?: boolean;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: number;
  parent_user?: number;
  is_active?: boolean;
  avatar?: File | string;
  birth_date?: string;
  about?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admins_count: number;
  authors_count: number;
  superusers_count: number;
}

export interface UsersStoreExtended extends UsersStore {
  roles: Role[];
  createUser: (data: UserCreateData) => Promise<void>;
  updateUser: (id: number, data: UserUpdateData) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  toggleUserStatus: (id: number) => Promise<void>;
  resetPassword: (id: number) => Promise<string>;
  assignToSite: (userId: number, siteId: number) => Promise<void>;
  removeFromSite: (userId: number, siteId: number) => Promise<void>;
  fetchRoles: () => Promise<void>;
  getStats: () => Promise<UserStats>;
}

export const useUsersStore = create<UsersStoreExtended>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      roles: [],
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.get<{ results?: User[], count?: number }>('/auth/users/');
          const users = Array.isArray(response) ? response : (response.results || []);
          
          set({
            users,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки пользователей';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      fetchUser: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const user = await api.get<User>(`/auth/users/${id}/`);
          
          set({
            currentUser: user,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки пользователя';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      createUser: async (data: UserCreateData) => {
        set({ isLoading: true, error: null });
        
        try {
          const newUser = await api.post<User>('/auth/users/', data);
          
          set(state => ({
            users: [newUser, ...state.users],
            currentUser: newUser,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка создания пользователя';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      updateUser: async (id: number, data: UserUpdateData) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedUser = await api.patch<User>(`/auth/users/${id}/`, data);
          
          set(state => ({
            users: state.users.map(user => 
              user.id === id ? updatedUser : user
            ),
            currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления пользователя';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      deleteUser: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.delete(`/auth/users/${id}/`);
          
          set(state => ({
            users: state.users.filter(user => user.id !== id),
            currentUser: state.currentUser?.id === id ? null : state.currentUser,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка удаления пользователя';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      toggleUserStatus: async (id: number) => {
        try {
          const user = get().users.find(u => u.id === id);
          if (!user) return;

          await api.post(`/auth/users/${id}/toggle_active/`);
          
          set(state => ({
            users: state.users.map(user => 
              user.id === id ? { ...user, is_active: !user.is_active } : user
            ),
            currentUser: state.currentUser?.id === id 
              ? { ...state.currentUser, is_active: !state.currentUser.is_active }
              : state.currentUser,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка изменения статуса пользователя';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      resetPassword: async (id: number): Promise<string> => {
        try {
          const response = await api.post<{ new_password: string }>(`/auth/users/${id}/reset_password/`);
          return response.new_password;
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка сброса пароля';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      assignToSite: async (userId: number, siteId: number) => {
        try {
          await api.post(`/auth/users/${userId}/assign_site/`, { site_id: siteId });
          
          // Refresh user data
          await get().fetchUser(userId);
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка назначения пользователя на сайт';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      removeFromSite: async (userId: number, siteId: number) => {
        try {
          await api.post(`/auth/users/${userId}/remove_site/`, { site_id: siteId });
          
          // Refresh user data
          await get().fetchUser(userId);
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка удаления пользователя с сайта';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      fetchRoles: async () => {
        try {
          const roles = await api.get<Role[]>('/auth/roles/');
          
          set({ roles });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки ролей';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      getStats: async (): Promise<UserStats> => {
        try {
          const stats = await api.get<UserStats>('/auth/users/stats/');
          return stats;
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка получения статистики пользователей';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setCurrentUser: (user: User | null) => {
        set({ currentUser: user });
      },
    }),
    {
      name: 'users-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        roles: state.roles,
      }),
    }
  )
); 