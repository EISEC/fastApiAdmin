export interface FieldOption {
  value: string | number;
  label: string;
}

export interface ValidationRule {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  pattern?: string;
  custom_validator?: (value: unknown) => boolean;
}

export interface DynamicModelField {
  id?: number;
  name: string;
  field_type: string;
  label: string;
  help_text?: string;
  required: boolean;
  default_value?: string | number | boolean | null;
  validation_rules?: ValidationRule;
  options?: FieldOption[];
  order: number;
  model?: number;
}

export interface DynamicModelData {
  id?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DynamicModelFormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: FieldOption[];
  default_value?: string | number | boolean | null;
  validation_rules?: ValidationRule;
  help_text?: string;
}

export interface DynamicModelCreate {
  name: string;
  display_name: string;
  description?: string;
  fields: DynamicModelField[];
  site?: number;
}

export interface DynamicModelUpdate {
  name?: string;
  display_name?: string;
  description?: string;
  fields?: DynamicModelField[];
}

export interface DynamicModelPreview {
  form_fields: DynamicModelFormField[];
  sample_data: Record<string, string | number | boolean | null>;
  validation_errors?: string[];
}

export interface DynamicModelDataCreate {
  [key: string]: string | number | boolean | File | null;
}

export interface DynamicModelDataUpdate {
  [key: string]: string | number | boolean | File | null;
}

export interface DynamicModelFilterOptions {
  [key: string]: string | number | boolean | null;
}

export interface DynamicModelQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  ordering?: string;
  filters?: DynamicModelFilterOptions;
} 