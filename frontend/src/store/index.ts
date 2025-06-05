/**
 * Centralized export for all Zustand stores
 * 
 * This file provides a single entry point for importing any store in the application.
 * Each store manages its specific domain state and provides typed actions.
 */

// Auth store (уже существует)
export { useAuthStore } from './authStore';

// Domain-specific stores
export { useSitesStore } from './sitesStore';
export { usePostsStore } from './postsStore';
export { usePagesStore } from './pagesStore';
export { useUsersStore } from './usersStore';
export { useToastStore } from './toastStore';
export { usePageBuilderStore } from './pageBuilderStore';
export { useDynamicModelsStore } from './dynamicModelsStore';

// Re-export store types and interfaces for external usage
export type { 
  UserCreateData, 
  UserUpdateData, 
  UserStats 
} from './usersStore';

export type {
  DynamicModel,
  DynamicModelCreateData,
  DynamicModelUpdateData,
  FieldSchema,
  FieldType
} from './dynamicModelsStore'; 