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
  avatar?: File;
  birth_date?: string;
  about?: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string;
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
  rolesLoading: boolean;
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
      rolesLoading: false,
      isLoading: false,
      error: null,

      fetchUsers: async () => {
        console.log('🔄 UsersStore: Starting fetchUsers...');
        set({ isLoading: true, error: null });
        
        try {
          console.log('📡 UsersStore: Making API request to /auth/users/');
          const response = await api.get<{ results?: User[], count?: number }>('/auth/users/');
          console.log('📨 UsersStore: API response received:', response);
          
          const users = Array.isArray(response) ? response : (response.results || []);
          console.log('👥 UsersStore: Processed users:', users);
          
          set({
            users,
            isLoading: false,
          });
          
          console.log('✅ UsersStore: Users loaded successfully, count:', users.length);
        } catch (error: unknown) {
          console.error('❌ UsersStore: Error loading users:', error);
          
          // Более детальная обработка ошибок
          let errorMessage = 'Ошибка загрузки пользователей';
          
          if (error && typeof error === 'object') {
            const apiError = error as any;
            
            // Проверяем статус ответа
            if (apiError.response?.status === 401) {
              errorMessage = 'Ошибка авторизации. Пожалуйста, войдите в систему.';
            } else if (apiError.response?.status === 403) {
              errorMessage = 'Недостаточно прав для просмотра пользователей.';
            } else if (apiError.response?.status === 404) {
              errorMessage = 'API endpoint не найден.';
            } else if (apiError.response?.status >= 500) {
              errorMessage = 'Ошибка сервера. Попробуйте позже.';
            } else if (apiError.message) {
              errorMessage = apiError.message;
            } else if (apiError.response?.data?.detail) {
              errorMessage = apiError.response.data.detail;
            }
          }
          
          console.error('📝 UsersStore: Error details:', {
            status: (error as any)?.response?.status,
            statusText: (error as any)?.response?.statusText,
            data: (error as any)?.response?.data,
            message: (error as any)?.message
          });
          
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
          // Если есть аватар (файл), используем FormData
          if (data.avatar instanceof File) {
            const formData = new FormData();
            formData.append('username', data.username);
            formData.append('email', data.email);
            formData.append('password', data.password);
            if (data.first_name) formData.append('first_name', data.first_name);
            if (data.last_name) formData.append('last_name', data.last_name);
            formData.append('role', data.role.toString());
            formData.append('is_active', data.is_active ? 'true' : 'false');
            if (data.birth_date) formData.append('birth_date', data.birth_date);
            if (data.about) formData.append('about', data.about);
            formData.append('avatar', data.avatar);

            const newUser = await api.uploadFile<User>('POST', '/auth/users/', formData);
            
            set(state => ({
              users: [newUser, ...state.users],
              currentUser: newUser,
              isLoading: false,
            }));
          } else {
            // Обычный JSON запрос без файлов
            const newUser = await api.post<User>('/auth/users/', data);
            
            set(state => ({
              users: [newUser, ...state.users],
              currentUser: newUser,
              isLoading: false,
            }));
          }
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
          // Если есть аватар (файл), используем FormData
          if (data.avatar instanceof File) {
            const formData = new FormData();
            if (data.username) formData.append('username', data.username);
            if (data.email) formData.append('email', data.email);
            if (data.password) formData.append('password', data.password);
            if (data.first_name !== undefined) formData.append('first_name', data.first_name);
            if (data.last_name !== undefined) formData.append('last_name', data.last_name);
            if (data.role) formData.append('role', data.role.toString());
            if (data.is_active !== undefined) formData.append('is_active', data.is_active ? 'true' : 'false');
            if (data.birth_date !== undefined) formData.append('birth_date', data.birth_date);
            if (data.about !== undefined) formData.append('about', data.about);
            formData.append('avatar', data.avatar);

            const updatedUser = await api.uploadFile<User>('PATCH', `/auth/users/${id}/`, formData);
            
            set(state => ({
              users: state.users.map(user => 
                user.id === id ? updatedUser : user
              ),
              currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
              isLoading: false,
            }));
          } else {
            // Обычный JSON запрос без файлов
            const updatedUser = await api.patch<User>(`/auth/users/${id}/`, data);
            
            set(state => ({
              users: state.users.map(user => 
                user.id === id ? updatedUser : user
              ),
              currentUser: state.currentUser?.id === id ? updatedUser : state.currentUser,
              isLoading: false,
            }));
          }
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
        set({ rolesLoading: true, error: null });
        
        try {
          const response = await api.get<{ results: Role[] }>('/auth/roles/');
          const roles = response.results || [];
          console.log('✅ Roles loaded:', roles.length, 'roles');
          
          set({ roles, rolesLoading: false });
        } catch (error: unknown) {
          console.error('❌ fetchRoles: Error:', error);
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки ролей';
          
          set({ error: errorMessage, rolesLoading: false });
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