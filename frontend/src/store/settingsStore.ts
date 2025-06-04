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
import apiClient from '../services/api';

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
          // ДЕМО: Используем локальные данные вместо API
          // const response = await apiClient.get('/settings');
          
          // Имитируем загрузку
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Если настройки уже есть, не загружаем снова
          const { settings } = get();
          if (settings.length > 0) {
            set({ isLoading: false });
            return;
          }
          
          // Создаем демо-настройки
          const demoSettings: Setting[] = [
            // Общие настройки
            {
              id: '1',
              key: 'site_name',
              value: 'FastAPI Admin',
              type: 'text',
              category: 'general',
              label: 'Название сайта',
              description: 'Основное название вашего сайта',
              placeholder: 'Введите название сайта',
              required: true,
              group: 'Основная информация',
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              key: 'site_description',
              value: 'Современная система управления контентом',
              type: 'textarea',
              category: 'general',
              label: 'Описание сайта',
              description: 'Краткое описание вашего сайта',
              placeholder: 'Введите описание сайта',
              group: 'Основная информация',
              order: 2,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '3',
              key: 'admin_email',
              value: 'admin@example.com',
              type: 'email',
              category: 'general',
              label: 'Email администратора',
              description: 'Основной email для уведомлений',
              placeholder: 'admin@example.com',
              required: true,
              group: 'Контакты',
              order: 1,
              validation: [
                { type: 'required', message: 'Email обязателен' },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '4',
              key: 'maintenance_mode',
              value: false,
              type: 'boolean',
              category: 'general',
              label: 'Режим обслуживания',
              description: 'Включить режим обслуживания сайта',
              group: 'Система',
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            // Настройки оформления
            {
              id: '5',
              key: 'theme',
              value: 'light',
              type: 'select',
              category: 'appearance',
              label: 'Тема оформления',
              description: 'Выберите тему для интерфейса',
              group: 'Внешний вид',
              order: 1,
              options: [
                { value: 'light', label: 'Светлая' },
                { value: 'dark', label: 'Темная' },
                { value: 'auto', label: 'Автоматически' }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '6',
              key: 'primary_color',
              value: '#3B82F6',
              type: 'color',
              category: 'appearance',
              label: 'Основной цвет',
              description: 'Основной цвет интерфейса',
              group: 'Цвета',
              order: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            // SEO настройки
            {
              id: '7',
              key: 'default_title',
              value: 'FastAPI Admin - Система управления',
              type: 'text',
              category: 'seo',
              label: 'Заголовок по умолчанию',
              description: 'Заголовок страницы по умолчанию',
              group: 'Метаданные',
              order: 1,
              validation: [
                { type: 'max', value: 60, message: 'Заголовок должен быть не более 60 символов' }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            // Настройки безопасности
            {
              id: '8',
              key: 'password_min_length',
              value: 8,
              type: 'number',
              category: 'security',
              label: 'Минимальная длина пароля',
              description: 'Минимальное количество символов в пароле',
              group: 'Пароли',
              order: 1,
              validation: [
                { type: 'min', value: 6, message: 'Минимум 6 символов' },
                { type: 'max', value: 50, message: 'Максимум 50 символов' }
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ];

          set({ 
            settings: demoSettings,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Ошибка загрузки настроек',
            isLoading: false 
          });
        }
      },

      fetchCategories: async () => {
        set({ isLoading: true });
        
        try {
          // Создаем категории на основе настроек
          const { settings } = get();
          const categories: SettingsCategory[] = Object.entries(SETTING_CATEGORIES).map(([key, info], index) => {
            const categorySettings = settings.filter(s => s.category === key);
            
            // Группируем настройки по группам
            const groups: { [key: string]: Setting[] } = {};
            categorySettings.forEach(setting => {
              const groupKey = setting.group || 'default';
              if (!groups[groupKey]) {
                groups[groupKey] = [];
              }
              groups[groupKey].push(setting);
            });

            return {
              id: key as SettingCategory,
              name: info.name,
              description: info.description,
              icon: info.icon,
              order: index,
              groups: Object.entries(groups).map(([groupKey, groupSettings]) => ({
                id: groupKey,
                name: groupKey === 'default' ? 'Основные' : groupKey,
                order: 0,
                settings: groupSettings.sort((a, b) => (a.order || 0) - (b.order || 0))
              }))
            };
          });

          set({ 
            categories: categories.filter(cat => cat.groups.length > 0),
            isLoading: false 
          });
        } catch (error: any) {
          set({ 
            error: 'Ошибка загрузки категорий',
            isLoading: false 
          });
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
        const { changedSettings, settings } = get();
        
        if (Object.keys(changedSettings).length === 0) return;

        set({ isSaving: true, error: null });
        
        try {
          // Валидируем все изменения
          const isValid = get().validateAll();
          if (!isValid) {
            set({ isSaving: false });
            return;
          }

          // ДЕМО: Имитируем API запрос
          // const updates = Object.entries(changedSettings).map(([key, value]) => {
          //   const setting = settings.find(s => s.key === key);
          //   return {
          //     id: setting?.id,
          //     key,
          //     value
          //   };
          // });
          // await apiClient.put('/settings/bulk', { updates });
          
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Обновляем локальное состояние
          set(state => {
            const updatedSettings = state.settings.map(setting => {
              const changedValue = changedSettings[setting.key];
              return changedValue !== undefined 
                ? { ...setting, value: changedValue }
                : setting;
            });
            
            return {
              settings: updatedSettings,
              changedSettings: {},
              validationErrors: {},
              hasUnsavedChanges: false,
              lastSaved: new Date().toISOString(),
              isSaving: false
            };
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Ошибка сохранения настроек',
            isSaving: false 
          });
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

      // Импорт/экспорт
      exportSettings: async (categories?: SettingCategory[]): Promise<string> => {
        const { settings } = get();
        
        const settingsToExport = categories 
          ? settings.filter(s => categories.includes(s.category))
          : settings;

        const exportData = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          categories: categories || Object.keys(SETTING_CATEGORIES),
          settings: settingsToExport.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, any>)
        };

        return JSON.stringify(exportData, null, 2);
      },

      importSettings: async (data: string): Promise<void> => {
        try {
          const importData = JSON.parse(data);
          
          if (!importData.settings || typeof importData.settings !== 'object') {
            throw new Error('Неверный формат файла');
          }

          set({ isSaving: true, error: null });

          // Применяем настройки
          const updates = Object.entries(importData.settings).map(([key, value]) => ({
            key,
            value
          }));

          await apiClient.put('/settings/import', { updates });
          
          // Перезагружаем настройки
          await get().fetchSettings();
          
          set({ 
            isSaving: false,
            lastSaved: new Date().toISOString()
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Ошибка импорта настроек',
            isSaving: false 
          });
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
          await apiClient.post('/settings/templates', {
            name,
            categories,
            settings: templateSettings
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Ошибка сохранения шаблона'
          });
        }
      },

      loadTemplate: async (templateId: string): Promise<void> => {
        try {
          set({ isLoading: true });
          
          const response = await apiClient.get(`/settings/templates/${templateId}`);
          const template = response.data;

          // Применяем настройки из шаблона
          set(state => ({
            changedSettings: {
              ...state.changedSettings,
              ...template.settings
            },
            hasUnsavedChanges: true,
            isLoading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Ошибка загрузки шаблона',
            isLoading: false 
          });
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
      name: 'settings-store',
    }
  )
); 