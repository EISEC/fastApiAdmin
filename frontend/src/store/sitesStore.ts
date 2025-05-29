import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Site, SiteCreateData, SiteUpdateData, SitesStore, SiteStats, ApiErrorResponse } from '../types';
import { api } from '../lib/axios.config';
import { useToastStore } from './toastStore';

export const useSitesStore = create<SitesStore>()(
  persist(
    (set, get) => ({
      sites: [],
      currentSite: null,
      isLoading: false,
      error: null,

      fetchSites: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.get<{ results: Site[] }>('/sites/');
          const sites = Array.isArray(response) ? response : response.results || [];
          
          set({
            sites,
            isLoading: false,
          });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки сайтов';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка загрузки', errorMessage);
        }
      },

      fetchSite: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const site = await api.get<Site>(`/sites/${id}/`);
          set({ currentSite: site, isLoading: false });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки сайта';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка загрузки', errorMessage);
        }
      },

      createSite: async (data: SiteCreateData) => {
        set({ isLoading: true, error: null });
        try {
          const newSite = await api.post<Site>('/sites/', data);
          set((state) => ({ 
            sites: [...state.sites, newSite], 
            isLoading: false 
          }));
          useToastStore.getState().success('Успешно создан', `Сайт "${newSite.name}" был создан`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка создания сайта';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка создания', errorMessage);
          throw error;
        }
      },

      updateSite: async (id: number, data: SiteUpdateData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedSite = await api.patch<Site>(`/sites/${id}/`, data);
          set((state) => ({
            sites: state.sites.map(site => 
              site.id === id ? updatedSite : site
            ),
            currentSite: state.currentSite?.id === id ? updatedSite : state.currentSite,
            isLoading: false
          }));
          useToastStore.getState().success('Успешно обновлен', `Сайт "${updatedSite.name}" был обновлен`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления сайта';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка обновления', errorMessage);
          throw error;
        }
      },

      deleteSite: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/sites/${id}/`);
          set((state) => ({
            sites: state.sites.filter(site => site.id !== id),
            currentSite: state.currentSite?.id === id ? null : state.currentSite,
            isLoading: false
          }));
          useToastStore.getState().success('Удален', 'Сайт был успешно удален');
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка удаления сайта';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка удаления', errorMessage);
          throw error;
        }
      },

      assignUsers: async (siteId: number, userIds: number[]) => {
        set({ isLoading: true, error: null });
        try {
          const updatedSite = await api.post<Site>(`/sites/${siteId}/assign-users/`, { user_ids: userIds });
          set((state) => ({
            sites: state.sites.map(site => 
              site.id === siteId ? updatedSite : site
            ),
            currentSite: state.currentSite?.id === siteId ? updatedSite : state.currentSite,
            isLoading: false
          }));
          useToastStore.getState().success('Пользователи назначены', 'Пользователи успешно назначены на сайт');
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка назначения пользователей';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка назначения', errorMessage);
          throw error;
        }
      },

      toggleActive: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const updatedSite = await api.patch<Site>(`/sites/${id}/toggle-active/`);
          set((state) => ({
            sites: state.sites.map(site => 
              site.id === id ? updatedSite : site
            ),
            currentSite: state.currentSite?.id === id ? updatedSite : state.currentSite,
            isLoading: false
          }));
          const status = updatedSite.is_active ? 'активирован' : 'деактивирован';
          useToastStore.getState().success('Статус изменен', `Сайт ${status}`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка изменения статуса';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка', errorMessage);
          throw error;
        }
      },

      getStats: async () => {
        try {
          const stats = await api.get<SiteStats>('/sites/stats/');
          return stats;
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки статистики';
          useToastStore.getState().error('Ошибка статистики', errorMessage);
          throw error;
        }
      },

      toggleSiteStatus: async (id: number) => {
        return get().toggleActive(id);
      },

      clearError: () => {
        set({ error: null });
      },

      setCurrentSite: (site: Site | null) => {
        set({ currentSite: site });
      },
    }),
    {
      name: 'sites-storage',
      partialize: (state) => ({
        currentSite: state.currentSite,
      }),
    }
  )
); 