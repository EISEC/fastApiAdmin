import { create } from 'zustand';
import dynamicModelsService from '../services/dynamicModels.service';
import { useToastStore } from './toastStore';
import type {
  DynamicModel,
  DynamicModelData,
  DynamicFieldType,
  DynamicModelCreateData,
  DynamicModelUpdateData,
  DynamicModelDataCreateData,
  DynamicModelDataUpdateData,
  DynamicModelBulkCreateData,
  DynamicModelPreview,
  DynamicModelFilters,
  DynamicModelDataFilters,
  PaginatedResponse
} from '../types/dynamicModel.types';

export interface FieldSchema {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOption[];
  validation?: FieldValidation;
  default_value?: any;
  help_text?: string;
  order: number;
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
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'email' 
  | 'url' 
  | 'date' 
  | 'datetime' 
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'file'
  | 'image'
  | 'json';

interface DynamicModelsState {
  // Models
  models: DynamicModel[];
  selectedModel: DynamicModel | null;
  modelsLoading: boolean;
  modelsError: string | null;
  modelsPagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };

  // Общие состояния для совместимости
  isLoading: boolean;
  error: string | null;

  // Model Data
  modelData: DynamicModelData[];
  selectedModelData: DynamicModelData | null;
  dataLoading: boolean;
  dataError: string | null;
  dataPagination: {
    count: number;
    next: string | null;
    previous: string | null;
  };

  // Field Types
  fieldTypes: DynamicFieldType[];
  fieldTypesLoading: boolean;
  fieldTypesError: string | null;

  // Preview
  preview: DynamicModelPreview | null;
  previewLoading: boolean;

  // Actions - Models
  fetchModels: (filters?: DynamicModelFilters) => Promise<void>;
  fetchModel: (id: number) => Promise<DynamicModel | null>;
  createModel: (data: DynamicModelCreateData) => Promise<DynamicModel | null>;
  updateModel: (id: number, data: DynamicModelUpdateData) => Promise<DynamicModel | null>;
  deleteModel: (id: number) => Promise<boolean>;
  duplicateModel: (id: number) => Promise<DynamicModel | null>;
  
  // Actions - Model Data  
  fetchModelData: (filters?: DynamicModelDataFilters) => Promise<void>;
  fetchModelDataEntry: (id: number) => Promise<DynamicModelData | null>;
  createModelData: (data: DynamicModelDataCreateData) => Promise<DynamicModelData | null>;
  updateModelData: (id: number, data: DynamicModelDataUpdateData) => Promise<DynamicModelData | null>;
  deleteModelData: (id: number) => Promise<boolean>;
  bulkCreateModelData: (data: DynamicModelBulkCreateData) => Promise<boolean>;

  // Actions - Field Types
  fetchFieldTypes: (params?: { search?: string; category?: string }) => Promise<void>;

  // Actions - Preview & Utils
  generatePreview: (id: number) => Promise<void>;
  exportModelConfig: (id: number, includeData?: boolean) => Promise<void>;
  importModelConfig: (file: File) => Promise<boolean>;
  
  // Actions - Status Management
  toggleStatus: (id: number) => Promise<boolean>;
  
  // State management
  setSelectedModel: (model: DynamicModel | null) => void;
  setSelectedModelData: (data: DynamicModelData | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Store для управления динамическими моделями
 */
export const useDynamicModelsStore = create<DynamicModelsState>((set, get) => ({
  // Initial state
  models: [],
  selectedModel: null,
  modelsLoading: false,
  modelsError: null,
  modelsPagination: { count: 0, next: null, previous: null },

  modelData: [],
  selectedModelData: null,
  dataLoading: false,
  dataError: null,
  dataPagination: { count: 0, next: null, previous: null },

  fieldTypes: [],
  fieldTypesLoading: false,
  fieldTypesError: null,

  preview: null,
  previewLoading: false,
  
  // Общие состояния для совместимости
  isLoading: false,
  error: null,

  // Models Actions
  fetchModels: async (filters?: DynamicModelFilters) => {
    set({ modelsLoading: true, modelsError: null });
    
    try {
      const response = await dynamicModelsService.getModels(filters);
      set({
        models: response.results,
        modelsPagination: {
          count: response.count,
          next: response.next || null,
          previous: response.previous || null,
        },
        modelsLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки моделей';
      set({ modelsError: errorMessage, modelsLoading: false });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
    }
  },

  fetchModel: async (id: number) => {
    try {
      const model = await dynamicModelsService.getModel(id);
      set({ selectedModel: model });
      return model;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки модели';
      set({ modelsError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  createModel: async (data: DynamicModelCreateData) => {
    try {
      const newModel = await dynamicModelsService.createModel(data);
      
      // Обновляем список моделей
      set(state => ({
        models: [newModel, ...state.models]
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Модель создана',
      });

      return newModel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания модели';
      set({ modelsError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  updateModel: async (id: number, data: DynamicModelUpdateData) => {
    try {
      const updatedModel = await dynamicModelsService.updateModel(id, data);
      
      // Обновляем в списке
      set(state => ({
        models: state.models.map(model => 
          model.id === id ? updatedModel : model
        ),
        selectedModel: state.selectedModel?.id === id ? updatedModel : state.selectedModel
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Модель обновлена',
      });

      return updatedModel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления модели';
      set({ modelsError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  deleteModel: async (id: number) => {
    try {
      await dynamicModelsService.deleteModel(id);
      
      // Удаляем из списка
      set(state => ({
        models: state.models.filter(model => model.id !== id),
        selectedModel: state.selectedModel?.id === id ? null : state.selectedModel
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Модель удалена',
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления модели';
      set({ modelsError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return false;
    }
  },

  duplicateModel: async (id: number) => {
    try {
      // Сначала получаем оригинальную модель для получения site
      const originalModel = await dynamicModelsService.getModel(id);
      
      // Затем экспортируем конфигурацию
      const config = await dynamicModelsService.exportModelConfig(id, false, false);
      
      // Создаем новую модель с измененным именем и site из оригинальной модели
      const duplicateData: DynamicModelCreateData = {
        name: `${config.name}_copy`,
        site: originalModel.site,
        model_type: config.model_type as 'standalone' | 'extension',
        target_model: config.target_model,
        fields_config: config.fields_config,
        validation_rules: config.validation_rules,
      };

      const newModel = await dynamicModelsService.createModel(duplicateData);
      
      // Обновляем список
      set(state => ({
        models: [newModel, ...state.models]
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Модель скопирована',
      });

      return newModel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка копирования модели';
      set({ modelsError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  // Model Data Actions
  fetchModelData: async (filters?: DynamicModelDataFilters) => {
    set({ dataLoading: true, dataError: null });
    
    try {
      const response = await dynamicModelsService.getModelData(filters);
      set({
        modelData: response.results,
        dataPagination: {
          count: response.count,
          next: response.next || null,
          previous: response.previous || null,
        },
        dataLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки данных';
      set({ dataError: errorMessage, dataLoading: false });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
    }
  },

  fetchModelDataEntry: async (id: number) => {
    try {
      const entry = await dynamicModelsService.getModelDataEntry(id);
      set({ selectedModelData: entry });
      return entry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки записи';
      set({ dataError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  createModelData: async (data: DynamicModelDataCreateData) => {
    try {
      const newEntry = await dynamicModelsService.createModelData(data);
      
      // Обновляем список данных
      set(state => ({
        modelData: [newEntry, ...state.modelData]
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Запись создана',
      });

      return newEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания записи';
      set({ dataError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  updateModelData: async (id: number, data: DynamicModelDataUpdateData) => {
    try {
      const updatedEntry = await dynamicModelsService.updateModelData(id, data);
      
      // Обновляем в списке
      set(state => ({
        modelData: state.modelData.map(entry => 
          entry.id === id ? updatedEntry : entry
        ),
        selectedModelData: state.selectedModelData?.id === id ? updatedEntry : state.selectedModelData
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Запись обновлена',
      });

      return updatedEntry;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления записи';
      set({ dataError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return null;
    }
  },

  deleteModelData: async (id: number) => {
    try {
      await dynamicModelsService.deleteModelData(id);
      
      // Удаляем из списка
      set(state => ({
        modelData: state.modelData.filter(entry => entry.id !== id),
        selectedModelData: state.selectedModelData?.id === id ? null : state.selectedModelData
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Запись удалена',
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления записи';
      set({ dataError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return false;
    }
  },

  bulkCreateModelData: async (data: DynamicModelBulkCreateData) => {
    try {
      const result = await dynamicModelsService.bulkCreateData(data);
      
      // Перезагружаем данные модели после массового создания
      const currentFilters = {
        dynamic_model: data.dynamic_model
      };
      await get().fetchModelData(currentFilters);

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: `Создано ${result.created_count} записей`,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка массового создания';
      set({ dataError: errorMessage });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return false;
    }
  },

  // Field Types Actions
  fetchFieldTypes: async (params?: { search?: string; category?: string }) => {
    set({ fieldTypesLoading: true, fieldTypesError: null });
    
    try {
      const response = await dynamicModelsService.getFieldTypes({
        ...params,
        is_active: true
      });
      set({
        fieldTypes: response.results,
        fieldTypesLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки типов полей';
      set({ fieldTypesError: errorMessage, fieldTypesLoading: false });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
    }
  },

  // Preview & Utils Actions
  generatePreview: async (id: number) => {
    set({ previewLoading: true });
    
    try {
      const preview = await dynamicModelsService.getModelPreview(id);
      set({ preview, previewLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания превью';
      set({ previewLoading: false });
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
    }
  },

  exportModelConfig: async (id: number, includeData = false) => {
    try {
      const config = await dynamicModelsService.exportModelConfig(id, includeData);
      
      // Создаем и скачиваем файл
      const blob = new Blob([JSON.stringify(config, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dynamic_model_${config.name}_config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Конфигурация экспортирована',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка экспорта';
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
    }
  },

  importModelConfig: async (file: File) => {
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      await dynamicModelsService.importModelConfig(config);
      
      // Обновляем список моделей
      get().fetchModels();

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: 'Конфигурация импортирована',
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка импорта';
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return false;
    }
  },

  // Status Management
  toggleStatus: async (id: number) => {
    try {
      const updatedModel = await dynamicModelsService.toggleStatus(id);
      
      // Обновляем модель в списке
      set(state => ({
        models: state.models.map(model => 
          model.id === id ? { ...model, is_active: updatedModel.is_active } : model
        )
      }));

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Успешно',
        message: `Статус модели ${updatedModel.is_active ? 'активирован' : 'деактивирован'}`,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка изменения статуса';
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Ошибка',
        message: errorMessage,
      });
      return false;
    }
  },

  // State Management
  setSelectedModel: (model: DynamicModel | null) => {
    set({ selectedModel: model });
  },

  setSelectedModelData: (data: DynamicModelData | null) => {
    set({ selectedModelData: data });
  },

  clearError: () => {
    set({ 
      modelsError: null, 
      dataError: null, 
      fieldTypesError: null 
    });
  },

  reset: () => {
    set({
      models: [],
      selectedModel: null,
      modelsLoading: false,
      modelsError: null,
      modelsPagination: { count: 0, next: null, previous: null },
      
      modelData: [],
      selectedModelData: null,
      dataLoading: false,
      dataError: null,
      dataPagination: { count: 0, next: null, previous: null },
      
      fieldTypes: [],
      fieldTypesLoading: false,
      fieldTypesError: null,
      
      preview: null,
      previewLoading: false,
    });
  },
}));

// Экспорт типов для использования в компонентах
export type {
  DynamicModel,
  DynamicModelData,
  DynamicFieldType,
  DynamicModelCreateData,
  DynamicModelUpdateData,
  DynamicModelDataCreateData,
  DynamicModelDataUpdateData,
  DynamicModelBulkCreateData,
}; 