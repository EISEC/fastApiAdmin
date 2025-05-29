// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

// Common types
export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
  width?: string;
}

export interface FilterParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  [key: string]: unknown;
}

export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

// Common interface types
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  timeout?: number;
  persistent?: boolean;
}

// Form types
export type FormFieldType = 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: Record<string, unknown>;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

// Auth types
export type { 
  User, 
  Role, 
  LoginCredentials, 
  RegisterData, 
  AuthTokens, 
  PasswordChangeData, 
  AuthState, 
  AuthStore,
  UsersState,
  UsersStore
} from './auth.types';

// Site types  
export type { 
  Site, 
  SiteCreateData, 
  SiteUpdateData, 
  SiteStats,
  SitesState, 
  SitesStore 
} from './site.types';

// Post types
export type { 
  Post, 
  PostCreateData, 
  PostUpdateData, 
  PostListItem, 
  Category, 
  Tag, 
  PostStatus, 
  PostVisibility,
  PostsState, 
  PostsStore 
} from './post.types';

// Page types
export type { 
  Page, 
  PageCreateData, 
  PageUpdateData, 
  PageListItem, 
  PageHierarchy,
  PageStatus, 
  PageVisibility,
  PagesState, 
  PagesStore 
} from './page.types';

// API types
export type { 
  ApiErrorResponse, 
  ApiRequestConfig, 
  SearchParams, 
  PaginationParams, 
  ApiClient, 
  UseApiOptions, 
  UseApiReturn, 
  UseMutationOptions, 
  UseMutationReturn,
  HttpMethod 
} from './api.types';

// Export all specific types
export * from './auth.types';
export * from './site.types';
export * from './post.types';
export * from './page.types';
export * from './api.types'; 