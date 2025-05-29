import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Page, 
  PageCreateData, 
  PageUpdateData, 
  PageListItem, 
  PageHierarchy,
  PageStatus, 
  PagesStore,
  ApiErrorResponse 
} from '../types';
import { api } from '../lib/axios.config';

export const usePagesStore = create<PagesStore>()(
  persist(
    (set) => ({
      pages: [],
      currentPage: null,
      hierarchy: [],
      isLoading: false,
      error: null,

      fetchPages: async (siteId?: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const url = siteId ? `/pages/?site=${siteId}` : '/pages/';
          const response = await api.get<{ results?: PageListItem[], count?: number }>(url);
          const pages = Array.isArray(response) ? response : (response.results || []);
          
          set({
            pages,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки страниц';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      fetchPage: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const page = await api.get<Page>(`/pages/${id}/`);
          
          set({
            currentPage: page,
            isLoading: false,
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки страницы';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      createPage: async (data: PageCreateData) => {
        set({ isLoading: true, error: null });
        
        try {
          const newPage = await api.post<Page>('/pages/', data);
          
          // Convert to PageListItem for pages array
          const pageListItem: PageListItem = {
            id: newPage.id,
            title: newPage.title,
            slug: newPage.slug,
            status: newPage.status,
            author_name: newPage.author_name,
            site_name: newPage.site_name,
            parent_title: newPage.parent_title,
            is_homepage: newPage.is_homepage,
            menu_order: newPage.menu_order,
            views_count: newPage.views_count,
            created_at: newPage.created_at,
            updated_at: newPage.updated_at,
          };
          
          set(state => ({
            pages: [pageListItem, ...state.pages],
            currentPage: newPage,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка создания страницы';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      updatePage: async (id: number, data: PageUpdateData) => {
        set({ isLoading: true, error: null });
        
        try {
          const updatedPage = await api.patch<Page>(`/pages/${id}/`, data);
          
          // Convert to PageListItem for pages array
          const pageListItem: PageListItem = {
            id: updatedPage.id,
            title: updatedPage.title,
            slug: updatedPage.slug,
            status: updatedPage.status,
            author_name: updatedPage.author_name,
            site_name: updatedPage.site_name,
            parent_title: updatedPage.parent_title,
            is_homepage: updatedPage.is_homepage,
            menu_order: updatedPage.menu_order,
            views_count: updatedPage.views_count,
            created_at: updatedPage.created_at,
            updated_at: updatedPage.updated_at,
          };
          
          set(state => ({
            pages: state.pages.map(page => 
              page.id === id ? pageListItem : page
            ),
            currentPage: state.currentPage?.id === id ? updatedPage : state.currentPage,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления страницы';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      deletePage: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          await api.delete(`/pages/${id}/`);
          
          set(state => ({
            pages: state.pages.filter(page => page.id !== id),
            currentPage: state.currentPage?.id === id ? null : state.currentPage,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка удаления страницы';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      duplicatePage: async (id: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const duplicatedPage = await api.post<Page>(`/pages/${id}/duplicate/`);
          
          // Convert to PageListItem for pages array
          const pageListItem: PageListItem = {
            id: duplicatedPage.id,
            title: duplicatedPage.title,
            slug: duplicatedPage.slug,
            status: duplicatedPage.status,
            author_name: duplicatedPage.author_name,
            site_name: duplicatedPage.site_name,
            parent_title: duplicatedPage.parent_title,
            is_homepage: duplicatedPage.is_homepage,
            menu_order: duplicatedPage.menu_order,
            views_count: duplicatedPage.views_count,
            created_at: duplicatedPage.created_at,
            updated_at: duplicatedPage.updated_at,
          };
          
          set(state => ({
            pages: [pageListItem, ...state.pages],
            currentPage: duplicatedPage,
            isLoading: false,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка дублирования страницы';
          
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      changeStatus: async (id: number, status: PageStatus) => {
        try {
          const updatedPage = await api.patch<Page>(`/pages/${id}/`, { status });
          
          // Convert to PageListItem for pages array
          const pageListItem: PageListItem = {
            id: updatedPage.id,
            title: updatedPage.title,
            slug: updatedPage.slug,
            status: updatedPage.status,
            author_name: updatedPage.author_name,
            site_name: updatedPage.site_name,
            parent_title: updatedPage.parent_title,
            is_homepage: updatedPage.is_homepage,
            menu_order: updatedPage.menu_order,
            views_count: updatedPage.views_count,
            created_at: updatedPage.created_at,
            updated_at: updatedPage.updated_at,
          };
          
          set(state => ({
            pages: state.pages.map(page => 
              page.id === id ? pageListItem : page
            ),
            currentPage: state.currentPage?.id === id ? updatedPage : state.currentPage,
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка изменения статуса страницы';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      setHomepage: async (id: number) => {
        try {
          const updatedPage = await api.patch<Page>(`/pages/${id}/set_homepage/`);
          
          // Update all pages in the same site - only one can be homepage
          set(state => {
            const pageListItem: PageListItem = {
              id: updatedPage.id,
              title: updatedPage.title,
              slug: updatedPage.slug,
              status: updatedPage.status,
              author_name: updatedPage.author_name,
              site_name: updatedPage.site_name,
              parent_title: updatedPage.parent_title,
              is_homepage: updatedPage.is_homepage,
              menu_order: updatedPage.menu_order,
              views_count: updatedPage.views_count,
              created_at: updatedPage.created_at,
              updated_at: updatedPage.updated_at,
            };

            return {
              pages: state.pages.map(page => 
                page.site_name === updatedPage.site_name
                  ? page.id === id 
                    ? pageListItem
                    : { ...page, is_homepage: false }
                  : page
              ),
              currentPage: state.currentPage?.id === id ? updatedPage : state.currentPage,
            };
          });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка установки главной страницы';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      updateMenuOrder: async (pages: { id: number; menu_order: number }[]) => {
        try {
          await api.patch('/pages/update_menu_order/', { pages });
          
          // Update local state
          set(state => ({
            pages: state.pages.map(page => {
              const updatedPageData = pages.find(p => p.id === page.id);
              return updatedPageData ? { ...page, menu_order: updatedPageData.menu_order } : page;
            }),
          }));
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления порядка меню';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      fetchHierarchy: async (siteId?: number) => {
        try {
          const url = siteId ? `/pages/hierarchy/?site=${siteId}` : '/pages/hierarchy/';
          const hierarchy = await api.get<PageHierarchy[]>(url);
          
          set({ hierarchy });
        } catch (error: unknown) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки иерархии страниц';
          
          set({ error: errorMessage });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setCurrentPage: (page: Page | null) => {
        set({ currentPage: page });
      },
    }),
    {
      name: 'pages-storage',
      partialize: (state) => ({
        currentPage: state.currentPage,
        hierarchy: state.hierarchy,
      }),
    }
  )
); 