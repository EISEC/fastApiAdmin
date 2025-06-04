import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { Setting, SettingsGroup } from '../types/settings.types';

/**
 * Демо-данные настроек для разработки
 */
const createDemoSettings = (): Setting[] => {
  return [
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
        { type: 'pattern', value: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Неверный формат email' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      key: 'timezone',
      value: 'Europe/Moscow',
      type: 'select',
      category: 'general',
      label: 'Часовой пояс',
      description: 'Часовой пояс для отображения времени',
      group: 'Локализация',
      order: 1,
      options: [
        { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
        { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
        { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
        { value: 'Europe/London', label: 'Лондон (UTC+0)' },
        { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
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
      id: '6',
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
      id: '7',
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
    {
      id: '8',
      key: 'show_breadcrumbs',
      value: true,
      type: 'boolean',
      category: 'appearance',
      label: 'Показывать хлебные крошки',
      description: 'Отображать навигационные хлебные крошки',
      group: 'Навигация',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // SEO настройки
    {
      id: '9',
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
    {
      id: '10',
      key: 'default_description',
      value: 'Современная и удобная система управления контентом на базе FastAPI',
      type: 'textarea',
      category: 'seo',
      label: 'Описание по умолчанию',
      description: 'Мета-описание страницы по умолчанию',
      group: 'Метаданные',
      order: 2,
      validation: [
        { type: 'max', value: 160, message: 'Описание должно быть не более 160 символов' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '11',
      key: 'google_analytics_id',
      value: '',
      type: 'text',
      category: 'seo',
      label: 'Google Analytics ID',
      description: 'Идентификатор Google Analytics (GA4)',
      placeholder: 'G-XXXXXXXXXX',
      group: 'Аналитика',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Настройки уведомлений
    {
      id: '12',
      key: 'email_enabled',
      value: false,
      type: 'boolean',
      category: 'notifications',
      label: 'Включить email уведомления',
      description: 'Разрешить отправку email уведомлений',
      group: 'Email',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '13',
      key: 'smtp_host',
      value: '',
      type: 'text',
      category: 'notifications',
      label: 'SMTP сервер',
      description: 'Адрес SMTP сервера для отправки email',
      placeholder: 'smtp.gmail.com',
      group: 'Email',
      order: 2,
      dependsOn: ['email_enabled'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '14',
      key: 'notify_on_new_user',
      value: true,
      type: 'boolean',
      category: 'notifications',
      label: 'Уведомлять о новых пользователях',
      description: 'Отправлять уведомление при регистрации новых пользователей',
      group: 'События',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Настройки безопасности
    {
      id: '15',
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
    },
    {
      id: '16',
      key: 'session_timeout',
      value: 120,
      type: 'number',
      category: 'security',
      label: 'Время сессии (минуты)',
      description: 'Автоматический выход через указанное время неактивности',
      group: 'Сессии',
      order: 1,
      validation: [
        { type: 'min', value: 15, message: 'Минимум 15 минут' },
        { type: 'max', value: 1440, message: 'Максимум 24 часа' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '17',
      key: 'enable_audit_log',
      value: true,
      type: 'boolean',
      category: 'security',
      label: 'Включить журнал аудита',
      description: 'Ведение журнала действий пользователей',
      group: 'Журналирование',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Настройки производительности
    {
      id: '18',
      key: 'cache_enabled',
      value: true,
      type: 'boolean',
      category: 'performance',
      label: 'Включить кеширование',
      description: 'Использовать кеширование для ускорения работы',
      group: 'Кеш',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '19',
      key: 'cache_ttl',
      value: 3600,
      type: 'number',
      category: 'performance',
      label: 'Время жизни кеша (секунды)',
      description: 'Время хранения данных в кеше',
      group: 'Кеш',
      order: 2,
      dependsOn: ['cache_enabled'],
      validation: [
        { type: 'min', value: 60, message: 'Минимум 60 секунд' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },

    // Настройки для разработчиков
    {
      id: '20',
      key: 'debug_mode',
      value: false,
      type: 'boolean',
      category: 'developer',
      label: 'Режим отладки',
      description: 'Включить подробное логирование и отладочную информацию',
      group: 'Отладка',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '21',
      key: 'log_level',
      value: 'info',
      type: 'select',
      category: 'developer',
      label: 'Уровень логирования',
      description: 'Уровень детализации журналов',
      group: 'Логирование',
      order: 1,
      options: [
        { value: 'debug', label: 'Debug' },
        { value: 'info', label: 'Info' },
        { value: 'warn', label: 'Warning' },
        { value: 'error', label: 'Error' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
};

/**
 * Хук для инициализации демо-настроек
 */
export const useSettingsDemo = () => {
  const settingsStore = useSettingsStore();

  useEffect(() => {
    // Проверяем, есть ли уже настройки
    if (settingsStore.settings.length === 0) {
      // Создаем демо-настройки
      const demoSettings = createDemoSettings();
      
      // Устанавливаем настройки напрямую в store для демо
      settingsStore.settings = demoSettings;
      
      // Генерируем категории на основе настроек
      settingsStore.fetchCategories();
    }
  }, [settingsStore]);

  return {
    initializeDemoSettings: () => {
      const demoSettings = createDemoSettings();
      settingsStore.settings = demoSettings;
      settingsStore.fetchCategories();
    }
  };
}; 