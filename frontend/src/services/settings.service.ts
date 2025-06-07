import { api } from '../lib/axios.config';
import type { 
  Setting, 
  SettingCategory,
  SettingsCategory,
  SettingsTemplate
} from '../types/settings.types';

/**
 * Сервис для работы с API настроек
 */
export class SettingsService {
  private readonly baseUrl = '/settings';

  /**
   * Получить все настройки
   */
  async getSettings(): Promise<Setting[]> {
    const response = await api.get<Setting[]>(`${this.baseUrl}/list_all/`);
    return response;
  }

  /**
   * Получить категории настроек
   */
  async getCategories(): Promise<SettingsCategory[]> {
    const response = await api.get<SettingsCategory[]>(`${this.baseUrl}/categories/list_all/`);
    
    // Теперь всегда ожидаем простой массив
    if (Array.isArray(response)) {
      return response;
    } else {
      console.warn('Unexpected categories response format:', response);
      return [];
    }
  }

  /**
   * Получить настройку по ключу
   */
  async getSetting(key: string): Promise<Setting> {
    const response = await api.get<Setting>(`${this.baseUrl}/${key}/`);
    return response;
  }

  /**
   * Обновить настройку
   */
  async updateSetting(key: string, value: any): Promise<Setting> {
    const response = await api.put<Setting>(`${this.baseUrl}/${key}/`, { value });
    return response;
  }

  /**
   * Массовое обновление настроек
   */
  async updateSettings(updates: Array<{ key: string; value: any }>): Promise<{
    success: boolean;
    updated: Array<{ key: string; value: any; updated_at: string }>;
    count: number;
    errors?: string[];
  }> {
    const response = await api.put<{
      success: boolean;
      updated: Array<{ key: string; value: any; updated_at: string }>;
      count: number;
      errors?: string[];
    }>(`${this.baseUrl}/bulk_update/`, { updates });
    return response;
  }

  /**
   * Экспорт настроек
   */
  async exportSettings(params?: {
    categories?: string[];
    include_defaults?: boolean;
    format?: 'json' | 'yaml';
  }): Promise<any> {
    const response = await api.post(`${this.baseUrl}/export/`, params || {});
    return response;
  }

  /**
   * Импорт настроек
   */
  async importSettings(updates: Array<{ key: string; value: any }>): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    const response = await api.put<{
      success: boolean;
      imported: number;
      errors: string[];
    }>(`${this.baseUrl}/import_data/`, { updates });
    return response;
  }

  /**
   * Получить шаблоны настроек
   */
  async getTemplates(): Promise<SettingsTemplate[]> {
    const response = await api.get<{ results?: SettingsTemplate[]; count?: number } | SettingsTemplate[]>(`${this.baseUrl}/templates/`);
    
    // Обрабатываем и пагинированный, и обычный ответ
    if (Array.isArray(response)) {
      return response;
    } else if (response && 'results' in response && Array.isArray(response.results)) {
      return response.results;
    } else {
      return [];
    }
  }

  /**
   * Создать шаблон настроек
   */
  async createTemplate(data: {
    name: string;
    description?: string;
    settings_data: Record<string, any>;
    is_public?: boolean;
  }): Promise<SettingsTemplate> {
    const response = await api.post<SettingsTemplate>(`${this.baseUrl}/templates/`, data);
    return response;
  }

  /**
   * Применить шаблон настроек
   */
  async applyTemplate(templateId: string): Promise<{
    success: boolean;
    applied: number;
    errors: string[];
  }> {
    const response = await api.post<{
      success: boolean;
      applied: number;
      errors: string[];
    }>(`${this.baseUrl}/templates/${templateId}/apply/`);
    return response;
  }

  /**
   * Преобразовать данные backend в формат frontend
   */
  transformBackendToFrontend(backendSettings: any[]): Setting[] {
    // Проверяем что это массив
    if (!Array.isArray(backendSettings)) {
      console.warn('Expected array for backendSettings, got:', typeof backendSettings);
      return [];
    }

    return backendSettings.map(setting => ({
      id: setting.id || setting.key,
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category as SettingCategory,
      label: setting.label,
      description: setting.description,
      placeholder: setting.placeholder,
      required: setting.required,
      readonly: setting.readonly,
      validation: setting.validation,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
      options: setting.options,
      defaultValue: setting.default_value,
      group: setting.group,
      order: setting.order,
      helpText: setting.help_text,
      helpUrl: setting.help_url,
    }));
  }

  /**
   * Преобразовать категории backend в формат frontend
   */
  transformCategoriesBackendToFrontend(backendCategories: any[]): SettingsCategory[] {
    // Безопасная проверка на массив
    if (!Array.isArray(backendCategories)) {
      console.warn('Expected array for backendCategories, got:', typeof backendCategories);
      return [];
    }

    return backendCategories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'settings',
      order: category.order || 0,
      groups: Array.isArray(category.groups) ? category.groups.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description || '',
        icon: group.icon || 'file',
        order: group.order || 0,
        settings: Array.isArray(group.settings) ? this.transformBackendToFrontend(group.settings) : []
      })) : []
    }));
  }

  /**
   * Преобразовать настройки frontend в формат backend
   */
  transformFrontendToBackend(frontendUpdates: Record<string, any>): Array<{ key: string; value: any }> {
    return Object.entries(frontendUpdates).map(([key, value]) => ({
      key,
      value
    }));
  }
}

// Экспортируем экземпляр сервиса
export const settingsService = new SettingsService();
export default settingsService; 