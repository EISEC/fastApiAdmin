import apiClient from './api';
import type {
  DynamicModel,
  DynamicModelData,
  DynamicFieldType,
  DynamicModelVersion,
  DynamicModelExtension,
  DynamicModelPermission,
  DynamicModelCreateData,
  DynamicModelUpdateData,
  DynamicModelDataCreateData,
  DynamicModelDataUpdateData,
  DynamicModelBulkCreateData,
  DynamicModelPreview,
  DynamicModelSchema,
  DynamicModelExportConfig,
  DynamicModelFilters,
  DynamicModelDataFilters,
  PaginatedResponse
} from '../types/dynamicModel.types';

/**
 * Сервис для работы с API динамических моделей
 */
class DynamicModelsService {
  private baseUrl = '/dynamic-models';

  // === Dynamic Field Types ===
  
  /**
   * Получение списка типов полей
   */
  async getFieldTypes(params?: { search?: string; category?: string; is_active?: boolean }) {
    const response = await apiClient.get<PaginatedResponse<DynamicFieldType>>(
      `${this.baseUrl}/field-types/`,
      { params }
    );
    return response.data;
  }

  /**
   * Получение типа поля по ID
   */
  async getFieldType(id: number) {
    const response = await apiClient.get<DynamicFieldType>(`${this.baseUrl}/field-types/${id}/`);
    return response.data;
  }

  /**
   * Получение категорий типов полей
   */
  async getFieldTypeCategories() {
    const response = await apiClient.get<Array<{ value: string; label: string }>>(
      `${this.baseUrl}/field-types/categories/`
    );
    return response.data;
  }

  // === Dynamic Models ===

  /**
   * Получение списка динамических моделей
   */
  async getModels(filters?: DynamicModelFilters) {
    const response = await apiClient.get<PaginatedResponse<DynamicModel>>(
      `${this.baseUrl}/models/`,
      { params: filters }
    );
    return response.data;
  }

  /**
   * Получение модели по ID
   */
  async getModel(id: number) {
    const response = await apiClient.get<DynamicModel>(`${this.baseUrl}/models/${id}/`);
    return response.data;
  }

  /**
   * Создание новой модели
   */
  async createModel(data: DynamicModelCreateData) {
    const response = await apiClient.post<DynamicModel>(`${this.baseUrl}/models/`, data);
    return response.data;
  }

  /**
   * Обновление модели
   */
  async updateModel(id: number, data: DynamicModelUpdateData) {
    const response = await apiClient.patch<DynamicModel>(`${this.baseUrl}/models/${id}/`, data);
    return response.data;
  }

  /**
   * Удаление модели
   */
  async deleteModel(id: number) {
    await apiClient.delete(`${this.baseUrl}/models/${id}/`);
  }

  /**
   * Получение preview модели
   */
  async getModelPreview(id: number) {
    const response = await apiClient.post<DynamicModelPreview>(`${this.baseUrl}/models/${id}/preview/`);
    return response.data;
  }

  /**
   * Экспорт конфигурации модели
   */
  async exportModelConfig(id: number, includeData = false, includePermissions = false) {
    const response = await apiClient.get<DynamicModelExportConfig>(
      `${this.baseUrl}/models/${id}/export_config/`,
      { 
        params: { 
          include_data: includeData,
          include_permissions: includePermissions 
        }
      }
    );
    return response.data;
  }

  /**
   * Импорт конфигурации модели
   */
  async importModelConfig(data: DynamicModelExportConfig) {
    const response = await apiClient.post<DynamicModel>(
      `${this.baseUrl}/models/import_config/`,
      data
    );
    return response.data;
  }

  /**
   * Создание новой версии модели
   */
  async createModelVersion(id: number, changesDescription: string) {
    const response = await apiClient.post<DynamicModelVersion>(
      `${this.baseUrl}/models/${id}/create_version/`,
      { changes_description: changesDescription }
    );
    return response.data;
  }

  // === Dynamic Model Data ===

  /**
   * Получение данных модели
   */
  async getModelData(filters?: DynamicModelDataFilters) {
    const response = await apiClient.get<PaginatedResponse<DynamicModelData>>(
      `${this.baseUrl}/data/`,
      { params: filters }
    );
    return response.data;
  }

  /**
   * Получение записи данных по ID
   */
  async getModelDataEntry(id: number) {
    const response = await apiClient.get<DynamicModelData>(`${this.baseUrl}/data/${id}/`);
    return response.data;
  }

  /**
   * Создание записи данных
   */
  async createModelData(data: DynamicModelDataCreateData) {
    const response = await apiClient.post<DynamicModelData>(`${this.baseUrl}/data/`, data);
    return response.data;
  }

  /**
   * Обновление записи данных
   */
  async updateModelData(id: number, data: DynamicModelDataUpdateData) {
    const response = await apiClient.patch<DynamicModelData>(`${this.baseUrl}/data/${id}/`, data);
    return response.data;
  }

  /**
   * Удаление записи данных
   */
  async deleteModelData(id: number) {
    await apiClient.delete(`${this.baseUrl}/data/${id}/`);
  }

  /**
   * Получение схемы для создания данных
   */
  async getDataSchema(modelId: number) {
    const response = await apiClient.get<DynamicModelSchema>(
      `${this.baseUrl}/data/schema/`,
      { params: { dynamic_model: modelId } }
    );
    return response.data;
  }

  /**
   * Bulk создание записей
   */
  async bulkCreateData(data: DynamicModelBulkCreateData) {
    const response = await apiClient.post<{ created_count: number; created_ids: number[] }>(
      `${this.baseUrl}/data/bulk_create/`,
      data
    );
    return response.data;
  }

  // === Model Versions ===

  /**
   * Получение истории версий модели
   */
  async getModelVersions(modelId?: number) {
    const response = await apiClient.get<PaginatedResponse<DynamicModelVersion>>(
      `${this.baseUrl}/versions/`,
      { params: { dynamic_model: modelId } }
    );
    return response.data;
  }

  /**
   * Получение версии по ID
   */
  async getModelVersion(id: number) {
    const response = await apiClient.get<DynamicModelVersion>(`${this.baseUrl}/versions/${id}/`);
    return response.data;
  }

  // === Model Extensions ===

  /**
   * Получение расширений моделей
   */
  async getModelExtensions(params?: { dynamic_model?: number; target_model?: string }) {
    const response = await apiClient.get<PaginatedResponse<DynamicModelExtension>>(
      `${this.baseUrl}/extensions/`,
      { params }
    );
    return response.data;
  }

  /**
   * Создание расширения модели
   */
  async createModelExtension(data: Partial<DynamicModelExtension>) {
    const response = await apiClient.post<DynamicModelExtension>(
      `${this.baseUrl}/extensions/`,
      data
    );
    return response.data;
  }

  /**
   * Обновление расширения модели
   */
  async updateModelExtension(id: number, data: Partial<DynamicModelExtension>) {
    const response = await apiClient.patch<DynamicModelExtension>(
      `${this.baseUrl}/extensions/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * Удаление расширения модели
   */
  async deleteModelExtension(id: number) {
    await apiClient.delete(`${this.baseUrl}/extensions/${id}/`);
  }

  /**
   * Применение расширения
   */
  async applyExtension(id: number) {
    const response = await apiClient.post<{ status: string; message: string }>(
      `${this.baseUrl}/extensions/${id}/apply_extension/`
    );
    return response.data;
  }

  // === Model Permissions ===

  /**
   * Получение разрешений модели
   */
  async getModelPermissions(params?: { dynamic_model?: number; user?: number; role?: number }) {
    const response = await apiClient.get<PaginatedResponse<DynamicModelPermission>>(
      `${this.baseUrl}/permissions/`,
      { params }
    );
    return response.data;
  }

  /**
   * Создание разрешения
   */
  async createModelPermission(data: Partial<DynamicModelPermission>) {
    const response = await apiClient.post<DynamicModelPermission>(
      `${this.baseUrl}/permissions/`,
      data
    );
    return response.data;
  }

  /**
   * Обновление разрешения
   */
  async updateModelPermission(id: number, data: Partial<DynamicModelPermission>) {
    const response = await apiClient.patch<DynamicModelPermission>(
      `${this.baseUrl}/permissions/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * Удаление разрешения
   */
  async deleteModelPermission(id: number) {
    await apiClient.delete(`${this.baseUrl}/permissions/${id}/`);
  }

  // === Утилиты ===

  /**
   * Валидация данных
   */
  async validateData(modelId: number, data: Record<string, any>) {
    const response = await apiClient.post<{ valid: boolean; errors?: any }>(
      `${this.baseUrl}/data/validate/`,
      { dynamic_model: modelId, data }
    );
    return response.data;
  }
}

export default new DynamicModelsService(); 