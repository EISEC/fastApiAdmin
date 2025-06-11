export interface SettingValue {
  value: string | number | boolean | null;
}

export interface SettingInput {
  value: string | number | boolean;
}

export interface ValidationRule {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  custom_validator?: (value: string | number | boolean) => boolean;
}

export interface SettingDefinition {
  key: string;
  name: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'email' | 'url' | 'textarea' | 'select' | 'file' | 'color' | 'date';
  default_value: string | number | boolean;
  validation_rules?: ValidationRule;
  group_key: string;
  category_key: string;
  is_public?: boolean;
  options?: Record<string, string | number | boolean>;
}

export interface SettingsFormValues {
  [key: string]: string | number | boolean | undefined;
}

export interface SettingsApiResponse {
  success: boolean;
  data: Record<string, string | number | boolean>;
  message?: string;
}

export interface SettingsGroupData {
  key: string;
  name: string;
  description?: string;
  settings: SettingDefinition[];
}

export interface SettingsCategoryData {
  key: string;
  name: string;
  description?: string;
  groups: SettingsGroupData[];
}

export interface SettingValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SettingFormProps {
  setting: SettingDefinition;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
} 