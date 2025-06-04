# FastAPI Admin - Frontend 🚀

Современная административная панель, построенная на React + TypeScript + TailwindCSS.

## 📋 Содержание

- [Описание проекта](#описание-проекта)
- [Технический стек](#технический-стек)
- [Архитектура проекта](#архитектура-проекта)
- [Компоненты](#компоненты)
- [Stores (Zustand)](#stores-zustand)
- [Style Guide](#style-guide)
- [Установка и запуск](#установка-и-запуск)
- [Разработка](#разработка)

## 🎯 Описание проекта

FastAPI Admin - это полнофункциональная система управления контентом (CMS) с современным интерфейсом для управления:
- **Сайтами** - создание и управление множественными сайтами
- **Постами** - создание, редактирование и публикация контента
- **Страницами** - управление статическими страницами
- **Пользователями** - система ролей и прав доступа

## 🛠 Технический стек

### Основные технологии
- **React 18** - библиотека для создания пользовательских интерфейсов
- **TypeScript** - типизация для безопасной разработки
- **TailwindCSS** - utility-first CSS фреймворк
- **Vite** - современный сборщик

### Библиотеки управления состоянием и данными
- **Zustand** - легковесное управление состоянием
- **Axios** - HTTP клиент для API запросов
- **React Router DOM** - клиентская маршрутизация

### Формы и валидация
- **React Hook Form** - управление формами
- **Zod** - схемы валидации данных

### Дополнительные инструменты
- **ESLint** - линтер для проверки качества кода
- **TypeScript ESLint** - правила TypeScript
- **PostCSS** - обработка CSS

## 🏗 Архитектура проекта

```
frontend/src/
├── components/          # React компоненты
│   ├── ui/             # Базовые UI компоненты
│   ├── layout/         # Компоненты макета
│   ├── forms/          # Формы
│   ├── tables/         # Таблицы данных
│   └── index.ts        # Barrel exports
├── pages/              # Страницы приложения
├── hooks/              # Кастомные React хуки
├── store/              # Zustand stores
├── services/           # API сервисы
├── types/              # TypeScript типы
├── utils/              # Утилиты и хелперы
├── constants/          # Константы приложения
└── lib/                # Конфигурации библиотек
```

### Принципы архитектуры

1. **Компонентная архитектура** - все UI разбито на переиспользуемые компоненты
2. **Типизация** - полная типизация TypeScript для всех компонентов и данных
3. **Состояние** - централизованное управление через Zustand stores
4. **Слоистая архитектура** - разделение на UI, бизнес-логику и данные

## 🧩 Компоненты

### UI Компоненты (`components/ui/`)

#### **Button** - Базовая кнопка
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**Особенности:**
- 🎨 3 варианта стилизации с hover эффектами
- 📏 3 размера кнопок
- ⚡ Поддержка loading состояния
- 🔧 Полная кастомизация через className

#### **Table** - Универсальная таблица данных
```typescript
interface TableProps<T extends { id?: string | number }> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  sortConfig?: SortConfig;
  onSort?: (field: string) => void;
  emptyMessage?: string;
  className?: string;
  showIndex?: boolean;
}
```

**Возможности:**
- 🔄 Сортировка колонок с анимированными индикаторами
- 🎯 Кастомный рендеринг ячеек через render функции
- 📱 Адаптивный дизайн
- ✨ Hover эффекты и анимации
- 🎨 Автоматическая обработка типов данных

#### **StatsCard** - Карточка статистики
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
}
```

**Особенности:**
- 📊 Индикаторы изменений с иконками
- 🌈 6 цветовых схем
- ⚡ Hover анимации
- 🎨 Градиентные фоны

#### **Toast** - Система уведомлений
```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}
```

### Специализированные таблицы (`components/tables/`)

#### **SitesTable** - Таблица сайтов
- 🖼️ Логотипы сайтов с fallback на инициалы
- 🔄 Интерактивное переключение статуса
- ⚡ Действия редактирования/удаления
- 📅 Форматированные даты

#### **PostsTable** - Таблица постов
- 🖼️ Миниатюры постов
- 🎛️ Селект смены статуса
- 👤 Аватары авторов
- 📊 Счетчик просмотров

#### **UsersTable** - Таблица пользователей
- 👤 Аватары пользователей
- 🏷️ Цветовые бейджи ролей
- 🔄 Переключение активности
- 🕐 Время последнего входа

### Формы (`components/forms/`)

#### **SiteForm** - Форма сайта
```typescript
interface SiteFormProps {
  mode: 'create' | 'edit';
  initialData?: Site;
  onSubmit: (data: SiteCreateData | SiteUpdateData) => void;
  loading?: boolean;
}
```

#### **PostForm** - Форма поста
- 📝 Rich text редактор (TinyMCE)
- 🔗 Автогенерация slug
- 🖼️ Загрузка изображений
- 🎯 SEO поля

## 🗄 Stores (Zustand)

### Архитектура состояния

Каждый store следует единому паттерну:

```typescript
interface BaseStore<T> {
  // Данные
  items: T[];
  currentItem: T | null;
  isLoading: boolean;
  error: string | null;

  // CRUD операции
  fetchItems: () => Promise<void>;
  fetchItem: (id: number) => Promise<void>;
  createItem: (data: CreateData) => Promise<void>;
  updateItem: (id: number, data: UpdateData) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;

  // Дополнительные операции
  clearError: () => void;
  reset: () => void;
}
```

### Реализованные stores

#### **authStore** - Аутентификация
- 🔐 JWT токены
- 👤 Данные пользователя
- 🚪 Логин/логаут
- 🔄 Обновление токенов

#### **sitesStore** - Управление сайтами
- 📋 CRUD операции
- 🔄 Переключение статуса
- 👥 Назначение пользователей

#### **postsStore** - Управление постами
- 📝 CRUD операции
- 📊 Смена статуса
- 📋 Дублирование постов
- 🔍 Фильтрация по сайтам

#### **usersStore** - Управление пользователями
- 👤 CRUD операции
- 🔄 Переключение статуса
- 🔑 Сброс паролей
- 👥 Назначение ролей

#### **toastStore** - Уведомления
```typescript
interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  // Хелперы
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}
```

## 🎨 Style Guide

### Цветовая палитра

#### Основные цвета
```css
/* Primary */
--primary-50: #f1f5f9;
--primary-600: #334155;
--primary-900: #020617;

/* Функциональные цвета */
--success: #10b981;    /* Зеленый */
--warning: #f59e0b;    /* Желтый */
--error: #ef4444;      /* Красный */
--info: #3b82f6;       /* Синий */
```

#### Градиенты
```css
/* Для кнопок */
bg-gradient-to-r from-blue-500 to-blue-600
bg-gradient-to-br from-purple-400 to-purple-600

/* Для карточек */
bg-gradient-to-br from-transparent to-gray-25
```

### Типографика

#### Заголовки
```css
h1: text-3xl font-bold text-gray-900
h2: text-xl font-semibold text-gray-900
h3: text-lg font-medium text-gray-900
```

#### Текст
```css
body: text-sm text-gray-700
secondary: text-sm text-gray-500
muted: text-xs text-gray-400
```

### Компоненты стилизации

#### Кнопки
```css
/* Primary */
bg-blue-600 hover:bg-blue-700 text-white
focus:ring-2 focus:ring-blue-500

/* Secondary */
bg-gray-200 hover:bg-gray-300 text-gray-900
border border-gray-300

/* Danger */
bg-red-600 hover:bg-red-700 text-white
focus:ring-2 focus:ring-red-500
```

#### Карточки
```css
/* Основные */
bg-white rounded-2xl shadow-sm border border-gray-100

/* С hover эффектом */
hover:shadow-md transition-all duration-200

/* Интерактивные */
group hover:bg-gradient-to-r hover:from-blue-25 hover:to-blue-50
```

#### Формы
```css
/* Input */
border border-gray-300 rounded-lg px-3 py-2
focus:ring-2 focus:ring-blue-500 focus:border-blue-500

/* Labels */
text-sm font-medium text-gray-700

/* Ошибки */
text-red-600 text-sm
```

### Анимации и переходы

#### Hover эффекты
```css
/* Кнопки */
transition-colors duration-200
hover:scale-105 transform

/* Карточки */
transition-all duration-200
group-hover:scale-110

/* Таблицы */
hover:bg-gray-50 transition-colors
```

#### Загрузка
```css
/* Спиннер */
animate-spin rounded-full border-2 border-blue-200 border-t-blue-600

/* Fade in */
animate-fade-in opacity-0 animate-[fadeIn_0.5s_ease-in-out_forwards]
```

### Иконки и эмодзи

#### Статусы
- ✅ Активен / Успех
- ❌ Неактивен / Ошибка
- ⏰ Запланировано
- 🔄 Загрузка

#### Роли
- 👑 Супер админ
- 🛡️ Администратор  
- ✍️ Автор
- 👁️ Просмотр

#### Действия
- ✏️ Редактировать
- 🗑️ Удалить
- 📋 Копировать
- 👁️ Просмотр

### Адаптивность

#### Breakpoints
```css
sm: 640px   /* Планшеты */
md: 768px   /* Планшеты ландшафт */
lg: 1024px  /* Ноутбуки */
xl: 1280px  /* Десктопы */
```

#### Grid системы
```css
/* Мобильные */
grid-cols-1

/* Планшеты */
sm:grid-cols-2 md:grid-cols-2

/* Десктопы */
lg:grid-cols-3 xl:grid-cols-4
```

## 🚀 Установка и запуск

### Требования
- Node.js 18.20.2+
- Yarn 1.22+

### Установка
```bash
# Переход в папку frontend
cd frontend

# Установка зависимостей
yarn install

# Запуск в режиме разработки
yarn dev

# Сборка для production
yarn build

# Проверка кода
yarn lint
```

### Конфигурация API
Настройка в `src/lib/axios.config.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1';
```

## 📚 Дополнительная документация

- **[STYLE_GUIDE.md](STYLE_GUIDE.md)** - Руководство по стилю кодирования и дизайна
- **[COMPONENTS.md](COMPONENTS.md)** - Детальная документация всех компонентов
- **[INFINITE_RENDER_FIX.md](INFINITE_RENDER_FIX.md)** - Решение проблемы бесконечного рендера в React компонентах

## 🔧 Разработка

### Добавление нового компонента

1. **Создание компонента**
```typescript
// src/components/ui/NewComponent.tsx
interface NewComponentProps {
  // Типы props
}

const NewComponent: React.FC<NewComponentProps> = ({ }) => {
  return (
    // JSX
  );
};

export default NewComponent;
```

2. **Экспорт в index.ts**
```typescript
// src/components/ui/index.ts
export { default as NewComponent } from './NewComponent';
```

### Добавление нового store

1. **Создание типов**
```typescript
// src/types/newEntity.types.ts
export interface NewEntity {
  id: number;
  // поля
}

export interface NewEntityStore {
  // методы store
}
```

2. **Создание store**
```typescript
// src/store/newEntityStore.ts
export const useNewEntityStore = create<NewEntityStore>()(
  persist(
    (set, get) => ({
      // реализация
    }),
    { name: 'newEntity-store' }
  )
);
```

### Добавление новой таблицы

1. **Создание TableComponent**
```typescript
const NewTable: React.FC<NewTableProps> = ({ className }) => {
  // Конфигурация колонок
  const columns: TableColumn<Entity>[] = [
    {
      key: 'field',
      label: 'Заголовок',
      sortable: true,
      render: (value, item) => (
        // Кастомный рендер
      ),
    },
  ];

  return (
    <Table
      data={sortedData}
      columns={columns}
      loading={isLoading}
      sortConfig={sortConfig}
      onSort={handleSort}
      emptyMessage="Нет данных"
    />
  );
};
```

### Стандарты кода

#### TypeScript
- ✅ Полная типизация всех props и state
- ✅ Интерфейсы для всех объектов
- ✅ Generic типы для переиспользуемых компонентов
- ❌ Использование `any` типа

#### React
- ✅ Функциональные компоненты + хуки
- ✅ Мемоизация с React.memo при необходимости
- ✅ Кастомные хуки для логики
- ✅ JSDoc комментарии для сложных компонентов

#### Именование
```typescript
// Компоненты - PascalCase
const UserTable: React.FC = () => {};

// Хуки - camelCase с префиксом use
const useUserData = () => {};

// Константы - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// Переменные - camelCase
const userData = {};
```

### Разработка компонентов

При создании новых компонентов следуйте принципам:

1. **Типизация** - всегда создавайте TypeScript интерфейсы для props
2. **Переиспользование** - проверьте существующие компоненты перед созданием новых
3. **Стилизация** - используйте TailwindCSS классы согласно STYLE_GUIDE.md
4. **Документация** - добавляйте JSDoc комментарии

### Решение проблем

При возникновении проблем обратитесь к документации:

- **Бесконечный рендер** → [INFINITE_RENDER_FIX.md](INFINITE_RENDER_FIX.md)
- **Стилизация компонентов** → [STYLE_GUIDE.md](STYLE_GUIDE.md)  
- **Использование компонентов** → [COMPONENTS.md](COMPONENTS.md)

### Отладка

```bash
# Включить детальное логирование в development
yarn dev

# Проверить типы TypeScript
yarn type-check

# Линтинг кода
yarn lint
```

## 📝 Заключение

Данный проект реализует современные принципы разработки фронтенда с акцентом на:

- **Типобезопасность** через TypeScript
- **Переиспользуемость** компонентов
- **Производительность** через оптимизации
- **UX/UI** через современный дизайн
- **Масштабируемость** архитектуры

Следуя данному style guide и архитектурным принципам, можно легко расширять функциональность и поддерживать консистентность кода. 🚀
