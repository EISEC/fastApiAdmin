import type { AxiosResponse } from 'axios';

// HTTP методы
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Конфигурация API запроса
export interface ApiRequestConfig {
  url: string;
  method?: HttpMethod;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
}

// Типизированный ответ API
export type ApiResponseType<T> = AxiosResponse<T>;

// Ошибка API
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

// Пагинация параметры
export interface PaginationParams {
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
}

// Параметры поиска
export interface SearchParams {
  search?: string;
  q?: string;
}

// Параметры сортировки
export interface OrderingParams {
  ordering?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Объединенные параметры фильтрации
export interface ApiFilterParams extends PaginationParams, SearchParams, OrderingParams {
  [key: string]: unknown;
}

// Типы для различных HTTP статусов
export type SuccessStatus = 200 | 201 | 204;
export type ClientErrorStatus = 400 | 401 | 403 | 404 | 422;
export type ServerErrorStatus = 500 | 502 | 503;
export type HttpStatus = SuccessStatus | ClientErrorStatus | ServerErrorStatus;

// Интерфейс для API клиента
export interface ApiClient {
  get: <T>(url: string, params?: ApiFilterParams) => Promise<T>;
  post: <T>(url: string, data?: unknown) => Promise<T>;
  put: <T>(url: string, data?: unknown) => Promise<T>;
  patch: <T>(url: string, data?: unknown) => Promise<T>;
  delete: <T>(url: string) => Promise<T>;
  request: <T>(config: ApiRequestConfig) => Promise<T>;
}

// Хук для API запросов
export interface UseApiOptions<T> {
  url: string;
  method?: HttpMethod;
  params?: ApiFilterParams;
  dependencies?: unknown[];
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiErrorResponse) => void;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorResponse | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

// Мутации (POST, PUT, PATCH, DELETE)
export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiErrorResponse, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: ApiErrorResponse | null, variables: TVariables) => void;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: ApiErrorResponse | null;
  reset: () => void;
} 