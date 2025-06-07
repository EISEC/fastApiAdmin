import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  SettingsState, 
  SettingsActions, 
  Setting, 
  SettingCategory, 
  SettingsCategory,
  ValidationRule 
} from '../types/settings.types';
import { 
  SETTING_CATEGORIES,
  VALIDATION_MESSAGES
} from '../types/settings.types';
import { settingsService } from '../services/settings.service';
import { useToastStore } from './toastStore';

interface SettingsStore extends SettingsState, SettingsActions {}

const initialState: SettingsState = {
  settings: [],
  categories: [],
  currentCategory: 'general',
  changedSettings: {},
  validationErrors: {},
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: undefined,
  hasUnsavedChanges: false,
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Загрузка настроек
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Используем реальный API backend
          const backendSettings = await settingsService.getSettings();
          const settings = settingsService.transformBackendToFrontend(backendSettings);
          
          set({ 
            settings,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка загрузки настроек';
          
          set({ 
            error: errorMessage,
            isLoading: false 
          });
          
          useToastStore.getState().error('Ошибка загрузки настроек', errorMessage);
        }
      },

      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Используем новый API endpoint который возвращает данные уже в нужном формате
          const categories = await settingsService.getCategories();
          
          set({ 
            categories,
            isLoading: false,
            error: null 
          });
          
          // Если нет текущей категории, устанавливаем первую
          const { currentCategory } = get();
          if (!currentCategory && categories.length > 0) {
            set({ currentCategory: categories[0].id });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка загрузки категорий';
          
          set({ 
            error: errorMessage,
            isLoading: false 
          });
          
          useToastStore.getState().error('Ошибка загрузки категорий', errorMessage);
        }
      },

      // Управление настройками
      updateSetting: (key: string, value: any) => {
        const { changedSettings, settings } = get();
        const setting = settings.find(s => s.key === key);
        
        if (!setting) return;

        // Валидируем значение
        const errors = get().validateSetting(setting, value);
        
        set(state => ({
          changedSettings: {
            ...state.changedSettings,
            [key]: value
          },
          validationErrors: {
            ...state.validationErrors,
            [key]: errors
          },
          hasUnsavedChanges: true
        }));
      },

      saveSetting: async (key: string) => {
        const { changedSettings, settings } = get();
        
        if (!changedSettings[key]) return;

        set({ isSaving: true, error: null });
        
        try {
          const setting = settings.find(s => s.key === key);
          if (!setting) throw new Error('Настройка не найдена');

          // Валидируем перед сохранением
          const errors = get().validateSetting(setting, changedSettings[key]);
          if (errors.length > 0) {
            set(state => ({
              validationErrors: {
                ...state.validationErrors,
                [key]: errors
              },
              isSaving: false
            }));
            return;
          }

          // ДЕМО: Имитируем API запрос
          // await apiClient.put(`/settings/${setting.id}`, {
          //   value: changedSettings[key]
          // });
          
          await new Promise(resolve => setTimeout(resolve, 500));

          // Обновляем локальное состояние
          set(state => {
            const updatedSettings = state.settings.map(s => 
              s.key === key ? { ...s, value: changedSettings[key] } : s
            );
            
            const { [key]: _, ...remainingChanges } = state.changedSettings;
            const { [key]: __, ...remainingErrors } = state.validationErrors;
            
            return {
              settings: updatedSettings,
              changedSettings: remainingChanges,
              validationErrors: remainingErrors,
              hasUnsavedChanges: Object.keys(remainingChanges).length > 0,
              lastSaved: new Date().toISOString(),
              isSaving: false
            };
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Ошибка сохранения настройки',
            isSaving: false 
          });
        }
      },

      saveAllSettings: async () => {
        const { changedSettings, validateAll } = get();
        
        if (Object.keys(changedSettings).length === 0) {
          useToastStore.getState().warning('Нет изменений', 'Нет изменений для сохранения');
          return;
        }
        
        // Валидация перед сохранением
        const isValid = validateAll();
        if (!isValid) {
          useToastStore.getState().error('Ошибка валидации', 'Исправьте ошибки перед сохранением');
          return;
        }
        
        set({ isSaving: true, error: null });
        
        try {
          // Преобразуем изменения в формат backend
          const updates = settingsService.transformFrontendToBackend(changedSettings);
          
          // Отправляем массовое обновление
          const result = await settingsService.updateSettings(updates);
          
          if (result.success) {
            // Перезагружаем все данные после сохранения для корректного отображения
            await get().fetchSettings();
            await get().fetchCategories();
            
            set({
              changedSettings: {},
              validationErrors: {},
              hasUnsavedChanges: false,
              lastSaved: new Date().toISOString(),
              isSaving: false
            });
            
            useToastStore.getState().success(
              'Настройки сохранены', 
              `Сохранено изменений: ${result.count}`
            );
          } else if (result.errors && result.errors.length > 0) {
            // Показываем ошибки
            set({ 
              error: result.errors.join(', '),
              isSaving: false 
            });
            
            useToastStore.getState().error(
              'Ошибки при сохранении', 
              result.errors.join('\n')
            );
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка сохранения настроек';
          
          set({ 
            error: errorMessage,
            isSaving: false 
          });
          
          useToastStore.getState().error('Ошибка сохранения', errorMessage);
        }
      },

      resetSetting: (key: string) => {
        const { settings } = get();
        const setting = settings.find(s => s.key === key);
        
        if (!setting) return;

        set(state => {
          const { [key]: _, ...remainingChanges } = state.changedSettings;
          const { [key]: __, ...remainingErrors } = state.validationErrors;
          
          return {
            changedSettings: remainingChanges,
            validationErrors: remainingErrors,
            hasUnsavedChanges: Object.keys(remainingChanges).length > 0
          };
        });
      },

      resetCategory: (category: SettingCategory) => {
        const { settings } = get();
        const categorySettings = settings.filter(s => s.category === category);
        
        set(state => {
          const changedSettings = { ...state.changedSettings };
          const validationErrors = { ...state.validationErrors };
          
          categorySettings.forEach(setting => {
            delete changedSettings[setting.key];
            delete validationErrors[setting.key];
          });
          
          return {
            changedSettings,
            validationErrors,
            hasUnsavedChanges: Object.keys(changedSettings).length > 0
          };
        });
      },

      resetAllSettings: () => {
        set({
          changedSettings: {},
          validationErrors: {},
          hasUnsavedChanges: false
        });
      },

      // Навигация
      setCurrentCategory: (category: SettingCategory) => {
        set({ currentCategory: category });
      },

      // Валидация
      validateSetting: (setting: Setting, value: any): string[] => {
        const errors: string[] = [];
        
        if (!setting.validation) return errors;

        setting.validation.forEach(rule => {
          switch (rule.type) {
            case 'required':
              if (!value || value === '' || value === null || value === undefined) {
                errors.push(rule.message || VALIDATION_MESSAGES.required);
              }
              break;
              
            case 'min':
              if (typeof value === 'number' && value < rule.value) {
                errors.push(rule.message || VALIDATION_MESSAGES.min.replace('{min}', rule.value));
              }
              if (typeof value === 'string' && value.length < rule.value) {
                errors.push(rule.message || `Минимальная длина: ${rule.value} символов`);
              }
              break;
              
            case 'max':
              if (typeof value === 'number' && value > rule.value) {
                errors.push(rule.message || VALIDATION_MESSAGES.max.replace('{max}', rule.value));
              }
              if (typeof value === 'string' && value.length > rule.value) {
                errors.push(rule.message || `Максимальная длина: ${rule.value} символов`);
              }
              break;
              
            case 'pattern':
              if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
                errors.push(rule.message || VALIDATION_MESSAGES.pattern);
              }
              break;
              
            case 'custom':
              if (rule.customValidator && !rule.customValidator(value)) {
                errors.push(rule.message || VALIDATION_MESSAGES.custom);
              }
              break;
          }
        });

        // Дополнительная валидация по типу поля
        if (setting.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(VALIDATION_MESSAGES.email);
          }
        }

        if (setting.type === 'url' && value) {
          try {
            new URL(value);
          } catch {
            errors.push(VALIDATION_MESSAGES.url);
          }
        }

        return errors;
      },

      validateAll: (): boolean => {
        const { changedSettings, settings } = get();
        const allErrors: Record<string, string[]> = {};
        let isValid = true;

        Object.entries(changedSettings).forEach(([key, value]) => {
          const setting = settings.find(s => s.key === key);
          if (setting) {
            const errors = get().validateSetting(setting, value);
            if (errors.length > 0) {
              allErrors[key] = errors;
              isValid = false;
            }
          }
        });

        set({ validationErrors: allErrors });
        return isValid;
      },

      // Экспорт настроек
      exportSettings: async (categories?: SettingCategory[]) => {
        try {
          const params = categories ? { categories } : undefined;
          const data = await settingsService.exportSettings(params);
          
          return JSON.stringify(data, null, 2);
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка экспорта настроек';
          
          useToastStore.getState().error('Ошибка экспорта', errorMessage);
          throw error;
        }
      },

      // Импорт настроек
      importSettings: async (data: string) => {
        set({ isSaving: true, error: null });
        
        try {
          // Парсим JSON данные
          const importData = JSON.parse(data);
          
          // Преобразуем в формат updates
          let updates: Array<{ key: string; value: any }> = [];
          
          if (importData.settings) {
            // Формат экспорта
            updates = Object.entries(importData.settings).map(([key, value]) => ({
              key,
              value
            }));
          } else if (Array.isArray(importData)) {
            // Прямой массив updates
            updates = importData;
          } else {
            throw new Error('Неверный формат данных для импорта');
          }
          
          // Импортируем настройки
          const result = await settingsService.importSettings(updates);
          
          if (result.success) {
            // Перезагружаем настройки
            await get().fetchSettings();
            
            set({
              changedSettings: {},
              validationErrors: {},
              hasUnsavedChanges: false,
              lastSaved: new Date().toISOString(),
              isSaving: false
            });
            
            useToastStore.getState().success(
              'Настройки импортированы', 
              `Импортировано настроек: ${result.imported}`
            );
            
            if (result.errors.length > 0) {
              useToastStore.getState().warning(
                'Предупреждения при импорте',
                result.errors.join('\n')
              );
            }
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка импорта настроек';
          
          set({ 
            error: errorMessage,
            isSaving: false 
          });
          
          useToastStore.getState().error('Ошибка импорта', errorMessage);
        }
      },

      // Шаблоны
      saveAsTemplate: async (name: string, categories: SettingCategory[]): Promise<void> => {
        const { settings } = get();
        
        const templateSettings = settings
          .filter(s => categories.includes(s.category))
          .reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, any>);

        try {
          await settingsService.createTemplate({
            name,
            description: `Шаблон категорий: ${categories.join(', ')}`,
            settings_data: templateSettings,
            is_public: false
          });
          
          useToastStore.getState().success(
            'Шаблон сохранен', 
            `Шаблон "${name}" успешно создан`
          );
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка сохранения шаблона';
          
          set({ error: errorMessage });
          useToastStore.getState().error('Ошибка сохранения шаблона', errorMessage);
        }
      },

      loadTemplate: async (templateId: string): Promise<void> => {
        try {
          set({ isLoading: true, error: null });
          
          const result = await settingsService.applyTemplate(templateId);

          if (result.success) {
            // Перезагружаем настройки после применения шаблона
            await get().fetchSettings();
            
            set({
              changedSettings: {},
              validationErrors: {},
              hasUnsavedChanges: false,
              lastSaved: new Date().toISOString(),
              isLoading: false
            });
            
            useToastStore.getState().success(
              'Шаблон применен', 
              `Применено настроек: ${result.applied}`
            );
            
            if (result.errors.length > 0) {
              useToastStore.getState().warning(
                'Предупреждения при применении шаблона',
                result.errors.join('\n')
              );
            }
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 
                              error.response?.data?.message || 
                              error.message || 
                              'Ошибка загрузки шаблона';
          
          set({ 
            error: errorMessage,
            isLoading: false 
          });
          
          useToastStore.getState().error('Ошибка загрузки шаблона', errorMessage);
        }
      },

      // Утилиты
      clearErrors: () => {
        set({ error: null, validationErrors: {} });
      },

      discardChanges: () => {
        set({
          changedSettings: {},
          validationErrors: {},
          hasUnsavedChanges: false
        });
      },

      hasChanges: (): boolean => {
        const { changedSettings } = get();
        return Object.keys(changedSettings).length > 0;
      },
    }),
    {
      name: 'settings-storage',
    }
  )
); 