// Базовые типы настроек
export interface BaseSetting {
  id: string;
  key: string;
  value: any;
  type: SettingType;
  category: SettingCategory;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  validation?: ValidationRule[];
  createdAt: string;
  updatedAt: string;
}

export type SettingType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'color' 
  | 'file' 
  | 'image' 
  | 'url' 
  | 'email' 
  | 'password'
  | 'json'
  | 'richtext';

export type SettingCategory = 
  | 'general' 
  | 'appearance' 
  | 'seo' 
  | 'notifications' 
  | 'security' 
  | 'integrations'
  | 'performance'
  | 'developer';

// Правила валидации
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

// Опции для select полей
export interface SettingOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

// Расширенная настройка с дополнительными свойствами
export interface Setting extends BaseSetting {
  options?: SettingOption[];
  defaultValue?: any;
  dependsOn?: string[]; // зависимости от других настроек
  group?: string; // группировка внутри категории
  order?: number; // порядок отображения
  helpText?: string;
  helpUrl?: string;
  preview?: boolean; // показывать превью изменений
}

// Группы настроек
export interface SettingsGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  settings: Setting[];
}

// Категории настроек
export interface SettingsCategory {
  id: SettingCategory;
  name: string;
  description: string;
  icon: string;
  order: number;
  groups: SettingsGroup[];
}

// Специфические типы настроек

// Общие настройки
export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  siteLogo?: string;
  favicon?: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  adminEmail: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

// Настройки оформления
export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  customCss?: string;
  logoPosition: 'left' | 'center' | 'right';
  headerStyle: 'fixed' | 'static';
  footerText?: string;
  showBreadcrumbs: boolean;
}

// SEO настройки
export interface SeoSettings {
  defaultTitle: string;
  titleSeparator: string;
  defaultDescription: string;
  defaultKeywords: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard: 'summary' | 'summary_large_image';
  twitterSite?: string;
  googleAnalyticsId?: string;
  yandexMetrikaId?: string;
  googleSearchConsole?: string;
  robotsTxt: string;
  generateSitemap: boolean;
  sitemapUrl?: string;
}

// Настройки уведомлений
export interface NotificationSettings {
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpEncryption: 'none' | 'ssl' | 'tls';
  fromEmail: string;
  fromName: string;
  emailTemplates: EmailTemplate[];
  pushEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  slackWebhookUrl?: string;
  notifyOnNewUser: boolean;
  notifyOnNewPost: boolean;
  notifyOnNewComment: boolean;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'welcome' | 'reset_password' | 'notification' | 'custom';
}

// Настройки безопасности
export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number; // в минутах
  maxLoginAttempts: number;
  lockoutDuration: number; // в минутах
  twoFactorEnabled: boolean;
  allowedIpRanges?: string[];
  blockedIpRanges?: string[];
  enableAuditLog: boolean;
  logRetentionDays: number;
}

// Настройки интеграций
export interface IntegrationSettings {
  socialLogin: SocialLoginConfig;
  paymentGateways: PaymentGatewayConfig[];
  cdnUrl?: string;
  cdnEnabled: boolean;
  apiRateLimit: number;
  webhooks: WebhookConfig[];
  externalApis: ExternalApiConfig[];
}

export interface SocialLoginConfig {
  googleEnabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookEnabled: boolean;
  facebookAppId?: string;
  facebookAppSecret?: string;
  githubEnabled: boolean;
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  enabled: boolean;
  publicKey?: string;
  secretKey?: string;
  testMode: boolean;
  supportedCurrencies: string[];
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
}

export interface ExternalApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retries: number;
}

// Настройки производительности
export interface PerformanceSettings {
  cacheEnabled: boolean;
  cacheTtl: number; // в секундах
  compressionEnabled: boolean;
  imageOptimization: boolean;
  imageQuality: number;
  lazyLoading: boolean;
  minifyCss: boolean;
  minifyJs: boolean;
  enableCdn: boolean;
}

// Настройки для разработчиков
export interface DeveloperSettings {
  debugMode: boolean;
  sqlLogging: boolean;
  apiLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  allowedOrigins: string[];
  corsEnabled: boolean;
  rateLimitEnabled: boolean;
  maintenanceMode: boolean;
}

// Все настройки объединенные
export interface AllSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  seo: SeoSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  performance: PerformanceSettings;
  developer: DeveloperSettings;
}

// Состояние и действия для store
export interface SettingsState {
  settings: Setting[];
  categories: SettingsCategory[];
  currentCategory: SettingCategory;
  changedSettings: Record<string, any>; // измененные но не сохраненные настройки
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved?: string;
  hasUnsavedChanges: boolean;
}

export interface SettingsActions {
  // Загрузка настроек
  fetchSettings: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  
  // Управление настройками
  updateSetting: (key: string, value: any) => void;
  saveSetting: (key: string) => Promise<void>;
  saveAllSettings: () => Promise<void>;
  resetSetting: (key: string) => void;
  resetCategory: (category: SettingCategory) => void;
  resetAllSettings: () => void;
  
  // Навигация
  setCurrentCategory: (category: SettingCategory) => void;
  
  // Валидация
  validateSetting: (setting: Setting, value: any) => string[];
  validateAll: () => boolean;
  
  // Импорт/экспорт
  exportSettings: (categories?: SettingCategory[]) => Promise<string>;
  importSettings: (data: string) => Promise<void>;
  
  // Шаблоны
  saveAsTemplate: (name: string, categories: SettingCategory[]) => Promise<void>;
  loadTemplate: (templateId: string) => Promise<void>;
  
  // Утилиты
  clearErrors: () => void;
  discardChanges: () => void;
  hasChanges: () => boolean;
}

// Шаблоны настроек
export interface SettingsTemplate {
  id: string;
  name: string;
  description?: string;
  categories: SettingCategory[];
  settings: Record<string, any>;
  createdAt: string;
  createdBy: string;
  isDefault?: boolean;
}

// История изменений
export interface SettingsHistory {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'reset';
  settingKey: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

// Типы для компонентов
export interface SettingsFormProps {
  category: SettingCategory;
  settings: Setting[];
  values: Record<string, any>;
  errors: Record<string, string[]>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export interface SettingsTabsProps {
  categories: SettingsCategory[];
  currentCategory: SettingCategory;
  onChange: (category: SettingCategory) => void;
  hasUnsavedChanges?: boolean;
}

export interface SettingsPreviewProps {
  setting: Setting;
  value: any;
  originalValue: any;
}

// Константы
export const SETTING_CATEGORIES: Record<SettingCategory, { name: string; icon: string; description: string }> = {
  general: {
    name: 'Общие настройки',
    icon: '⚙️',
    description: 'Основные настройки сайта и приложения'
  },
  appearance: {
    name: 'Оформление',
    icon: '🎨',
    description: 'Внешний вид, темы и стилизация'
  },
  seo: {
    name: 'SEO',
    icon: '🔍',
    description: 'Поисковая оптимизация и метаданные'
  },
  notifications: {
    name: 'Уведомления',
    icon: '📧',
    description: 'Email, push-уведомления и интеграции'
  },
  security: {
    name: 'Безопасность',
    icon: '🔐',
    description: 'Пароли, доступ и аудит'
  },
  integrations: {
    name: 'Интеграции',
    icon: '🔗',
    description: 'Внешние сервисы и API'
  },
  performance: {
    name: 'Производительность',
    icon: '⚡',
    description: 'Кеширование и оптимизация'
  },
  developer: {
    name: 'Для разработчиков',
    icon: '👨‍💻',
    description: 'Отладка и технические настройки'
  }
};

export const VALIDATION_MESSAGES = {
  required: 'Это поле обязательно для заполнения',
  min: 'Значение должно быть не менее {min}',
  max: 'Значение должно быть не более {max}',
  pattern: 'Неверный формат значения',
  email: 'Введите корректный email адрес',
  url: 'Введите корректный URL',
  custom: 'Значение не прошло валидацию'
} as const; 