// Типы для системы динамических моделей
// Совместимы с backend API

export interface DynamicFieldType {
  id: number;
  name: string;
  label: string;
  category: string;
  description: string;
  ui_component: string;
  default_config: Record<string, any>;
  validation_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DynamicModelField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  default_value?: any;
  help_text?: string;
  placeholder?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  ui_config?: Record<string, any>;
  show_in_list?: boolean;
  order?: number;
}

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  required?: boolean;
  type?: string;
}

export interface DynamicModel {
  id: number;
  name: string;
  site: number;
  description?: string;
  model_type: 'standalone' | 'extension';
  target_model?: string;
  fields_config: {
    fields: DynamicModelField[];
  };
  validation_rules?: Record<string, any>;
  version: number;
  parent_model?: number;
  table_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Computed fields from API
  fields_count?: number;
  data_entries_count?: number;
}

export interface DynamicModelData {
  id: number;
  dynamic_model: number;
  dynamic_model_name?: string;
  data: Record<string, any>;
  is_published: boolean;
  display_value: string;
  created_at: string;
  updated_at: string;
}

export interface DynamicModelVersion {
  id: number;
  dynamic_model: number;
  parent_version?: number;
  changes_description: string;
  is_rollback: boolean;
  created_by: number;
  created_at: string;
}

export interface DynamicModelExtension {
  id: number;
  dynamic_model: number;
  target_model: string;
  extension_type: 'field_addition' | 'field_modification' | 'relation_addition';
  field_mappings?: Record<string, any>;
  relation_config?: Record<string, any>;
  migration_applied: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DynamicModelPermission {
  id: number;
  dynamic_model: number;
  user?: number;
  role?: number;
  permission_type: 'view' | 'create' | 'edit' | 'delete' | 'manage';
  field_restrictions?: string[];
  conditions?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Request/Response типы
export interface DynamicModelCreateData {
  name: string;
  site: number;
  description?: string;
  model_type: 'standalone' | 'extension';
  target_model?: string;
  fields_config: {
    fields: DynamicModelField[];
  };
  validation_rules?: Record<string, any>;
}

export interface DynamicModelUpdateData {
  name?: string;
  site?: number;
  description?: string;
  model_type?: 'standalone' | 'extension';
  target_model?: string;
  fields_config?: {
    fields: DynamicModelField[];
  };
  validation_rules?: Record<string, any>;
  is_active?: boolean;
}

export interface DynamicModelDataCreateData {
  dynamic_model: number;
  data: Record<string, any>;
  is_published?: boolean;
}

export interface DynamicModelDataUpdateData {
  data?: Record<string, any>;
  is_published?: boolean;
}

export interface DynamicModelBulkCreateData {
  dynamic_model: number;
  entries: Record<string, any>[];
  is_published?: boolean;
}

export interface DynamicModelPreview {
  model_info: {
    id: number;
    name: string;
    model_type: string;
    fields_count: number;
  };
  form_preview: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    ui_component: string;
    sample_value: any;
  }>;
  table_preview: {
    columns: Array<{
      name: string;
      label: string;
      type: string;
    }>;
    sample_data: Record<string, any>[];
  };
}

export interface DynamicModelSchema {
  model_info: {
    id: number;
    name: string;
    model_type: string;
    table_name: string;
  };
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    ui_config: Record<string, any>;
    validation: Record<string, any>;
  }>;
}

export interface DynamicModelExportConfig {
  name: string;
  model_type: string;
  target_model?: string;
  fields_config: {
    fields: DynamicModelField[];
  };
  validation_rules?: Record<string, any>;
  include_data?: boolean;
  include_permissions?: boolean;
}

// Фильтры и пагинация
export interface DynamicModelFilters {
  search?: string;
  model_type?: 'standalone' | 'extension';
  site?: number;
  is_active?: boolean;
  ordering?: string;
}

export interface DynamicModelDataFilters {
  dynamic_model?: number;
  is_published?: boolean;
  search?: string;
  ordering?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Ошибки валидации
export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  detail?: string;
  errors?: ValidationError[];
  non_field_errors?: string[];
} 