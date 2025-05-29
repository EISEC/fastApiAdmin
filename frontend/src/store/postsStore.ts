import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/axios.config';
import type { 
  Post, 
  PostCreateData, 
  PostUpdateData, 
  PostListItem, 
  Category, 
  Tag, 
  PostStatus, 
  PostsStore,
  ApiErrorResponse 
} from '../types';
import { useToastStore } from './toastStore';

export const usePostsStore = create<PostsStore>()(
  persist(
    (set) => ({
      posts: [],
      currentPost: null,
      categories: [],
      tags: [],
      isLoading: false,
      error: null,

      fetchPosts: async (siteId?: number) => {
        set({ isLoading: true, error: null });
        try {
          const url = siteId ? `/posts/?site=${siteId}` : '/posts/';
          const response = await api.get<{ results: PostListItem[] }>(url);
          const posts = Array.isArray(response) ? response : response.results || [];
          set({ posts, isLoading: false });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки постов';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка загрузки', errorMessage);
        }
      },

      fetchPost: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const post = await api.get<Post>(`/posts/${id}/`);
          set({ currentPost: post, isLoading: false });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки поста';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка загрузки', errorMessage);
        }
      },

      createPost: async (data: PostCreateData) => {
        set({ isLoading: true, error: null });
        try {
          const newPost = await api.post<Post>('/posts/', data);
          // Конвертируем в PostListItem для списка
          const postListItem: PostListItem = {
            id: newPost.id,
            title: newPost.title,
            slug: newPost.slug,
            excerpt: newPost.excerpt,
            featured_image: newPost.featured_image,
            status: newPost.status,
            author_name: newPost.author_name,
            site_name: newPost.site_name,
            published_at: newPost.published_at,
            views_count: newPost.views_count,
            created_at: newPost.created_at,
            updated_at: newPost.updated_at,
          };
          
          set((state) => ({
            posts: [...state.posts, postListItem],
            isLoading: false
          }));
          useToastStore.getState().success('Пост создан', `Пост "${newPost.title}" был успешно создан`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка создания поста';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка создания', errorMessage);
          throw error;
        }
      },

      updatePost: async (id: number, data: PostUpdateData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedPost = await api.patch<Post>(`/posts/${id}/`, data);
          
          // Обновляем в списке постов
          const postListItem: PostListItem = {
            id: updatedPost.id,
            title: updatedPost.title,
            slug: updatedPost.slug,
            excerpt: updatedPost.excerpt,
            featured_image: updatedPost.featured_image,
            status: updatedPost.status,
            author_name: updatedPost.author_name,
            site_name: updatedPost.site_name,
            published_at: updatedPost.published_at,
            views_count: updatedPost.views_count,
            created_at: updatedPost.created_at,
            updated_at: updatedPost.updated_at,
          };
          
          set((state) => ({
            posts: state.posts.map(post => 
              post.id === id ? postListItem : post
            ),
            currentPost: state.currentPost?.id === id ? updatedPost : state.currentPost,
            isLoading: false
          }));
          useToastStore.getState().success('Пост обновлен', `Пост "${updatedPost.title}" был обновлен`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка обновления поста';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка обновления', errorMessage);
          throw error;
        }
      },

      deletePost: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`/posts/${id}/`);
          set((state) => ({
            posts: state.posts.filter(post => post.id !== id),
            currentPost: state.currentPost?.id === id ? null : state.currentPost,
            isLoading: false
          }));
          useToastStore.getState().success('Пост удален', 'Пост был успешно удален');
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка удаления поста';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка удаления', errorMessage);
          throw error;
        }
      },

      duplicatePost: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const duplicatedPost = await api.post<Post>(`/posts/${id}/duplicate/`);
          
          const postListItem: PostListItem = {
            id: duplicatedPost.id,
            title: duplicatedPost.title,
            slug: duplicatedPost.slug,
            excerpt: duplicatedPost.excerpt,
            featured_image: duplicatedPost.featured_image,
            status: duplicatedPost.status,
            author_name: duplicatedPost.author_name,
            site_name: duplicatedPost.site_name,
            published_at: duplicatedPost.published_at,
            views_count: duplicatedPost.views_count,
            created_at: duplicatedPost.created_at,
            updated_at: duplicatedPost.updated_at,
          };
          
          set((state) => ({
            posts: [...state.posts, postListItem],
            isLoading: false
          }));
          useToastStore.getState().success('Пост скопирован', `Копия поста "${duplicatedPost.title}" создана`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка копирования поста';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка копирования', errorMessage);
          throw error;
        }
      },

      changeStatus: async (id: number, status: PostStatus) => {
        set({ isLoading: true, error: null });
        try {
          const updatedPost = await api.patch<Post>(`/posts/${id}/`, { status });
          
          const postListItem: PostListItem = {
            id: updatedPost.id,
            title: updatedPost.title,
            slug: updatedPost.slug,
            excerpt: updatedPost.excerpt,
            featured_image: updatedPost.featured_image,
            status: updatedPost.status,
            author_name: updatedPost.author_name,
            site_name: updatedPost.site_name,
            published_at: updatedPost.published_at,
            views_count: updatedPost.views_count,
            created_at: updatedPost.created_at,
            updated_at: updatedPost.updated_at,
          };
          
          set((state) => ({
            posts: state.posts.map(post => 
              post.id === id ? postListItem : post
            ),
            currentPost: state.currentPost?.id === id ? updatedPost : state.currentPost,
            isLoading: false
          }));
          
          const statusText = {
            draft: 'черновик',
            published: 'опубликован',
            scheduled: 'запланирован',
            archived: 'архивирован'
          }[status] || status;
          
          useToastStore.getState().success('Статус изменен', `Пост переведен в статус "${statusText}"`);
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка изменения статуса';
          set({ error: errorMessage, isLoading: false });
          useToastStore.getState().error('Ошибка', errorMessage);
          throw error;
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await api.get<Category[]>('/categories/');
          set({ categories });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки категорий';
          useToastStore.getState().error('Ошибка категорий', errorMessage);
        }
      },

      fetchTags: async () => {
        try {
          const tags = await api.get<Tag[]>('/tags/');
          set({ tags });
        } catch (error) {
          const apiError = error as ApiErrorResponse;
          const errorMessage = apiError.message || 'Ошибка загрузки тегов';
          useToastStore.getState().error('Ошибка тегов', errorMessage);
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setCurrentPost: (post: Post | null) => {
        set({ currentPost: post });
      },
    }),
    {
      name: 'posts-storage',
      partialize: (state) => ({
        currentPost: state.currentPost,
        categories: state.categories,
        tags: state.tags,
      }),
    }
  )
); 