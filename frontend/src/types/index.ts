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
export type * from './auth.types';
export type * from './site.types';
export type * from './post.types';
export type * from './page.types';
export type * from './api.types';
export type * from './pageBuilder.types';

// File Types  
export * from './file.types';

// Common interfaces
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

export interface FileSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface FileTableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => React.ReactNode;
}

export interface FileTableProps<T = any> {
  data: T[];
  columns: FileTableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRows: string[];
    onChange: (selectedRows: string[]) => void;
    getRowId: (item: T) => string;
  };
  sorting?: {
    field: string;
    direction: 'asc' | 'desc';
    onChange: (field: string, direction: 'asc' | 'desc') => void;
  };
  onRowClick?: (item: T, index: number) => void;
  emptyText?: string;
  className?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  className?: string;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
} 