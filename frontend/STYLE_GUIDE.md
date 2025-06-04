# 🎨 FastAPI Admin - Style Guide

Руководство по стилистике и дизайну для поддержания консистентности проекта.

## 📋 Оглавление

- [Цветовая палитра](#цветовая-палитра)
- [Типографика](#типографика)
- [Компоненты](#компоненты)
- [Анимации](#анимации)
- [Иконки и эмодзи](#иконки-и-эмодзи)
- [Адаптивность](#адаптивность)
- [Стандарты кода](#стандарты-кода)
- [React/TypeScript Patterns](#react-typescript-patterns)
- [Система иконок](#система-иконок)

## 🎨 Цветовая палитра

### Основные цвета
```css
/* Primary - основной цвет проекта */
--primary-25: #f8fafc
--primary-50: #f1f5f9
--primary-100: #e2e8f0
--primary-200: #cbd5e1
--primary-300: #94a3b8
--primary-400: #64748b
--primary-500: #475569
--primary-600: #334155  /* Основной темный */
--primary-700: #1e293b
--primary-800: #0f172a
--primary-900: #020617

/* Gray - оттенки серого */
--gray-25: #fcfcfd
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-400: #9ca3af
--gray-500: #6b7280
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827
```

### Функциональные цвета
```css
/* Статусы */
--success: #10b981   /* bg-green-500 */
--warning: #f59e0b   /* bg-yellow-500 */
--error: #ef4444     /* bg-red-500 */
--info: #3b82f6      /* bg-blue-500 */

/* Интерактивные элементы */
--link: #2563eb      /* bg-blue-600 */
--link-hover: #1d4ed8 /* bg-blue-700 */
```

### Градиенты
```css
/* Кнопки */
.btn-gradient-primary {
  @apply bg-gradient-to-r from-blue-500 to-blue-600;
}

.btn-gradient-success {
  @apply bg-gradient-to-r from-green-500 to-green-600;
}

/* Карточки */
.card-gradient-subtle {
  @apply bg-gradient-to-br from-transparent to-gray-25;
}

/* Аватары fallback */
.avatar-gradient-blue {
  @apply bg-gradient-to-br from-blue-400 to-blue-600;
}

.avatar-gradient-purple {
  @apply bg-gradient-to-br from-purple-400 to-purple-600;
}

.avatar-gradient-indigo {
  @apply bg-gradient-to-br from-indigo-400 to-indigo-600;
}
```

## ✍️ Типографика

### Заголовки
```css
/* H1 - Главные заголовки страниц */
.heading-1 {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

/* H2 - Заголовки секций */
.heading-2 {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

/* H3 - Подзаголовки */
.heading-3 {
  @apply text-lg font-medium text-gray-900 mb-2;
}

/* H4 - Заголовки карточек */
.heading-4 {
  @apply text-base font-semibold text-gray-900;
}
```

### Текст
```css
/* Основной текст */
.text-body {
  @apply text-sm text-gray-700;
}

/* Вторичный текст */
.text-secondary {
  @apply text-sm text-gray-500;
}

/* Подписи и мелкий текст */
.text-caption {
  @apply text-xs text-gray-400;
}

/* Ссылки */
.text-link {
  @apply text-blue-600 hover:text-blue-700 transition-colors;
}
```

### Специальные стили
```css
/* Italic placeholder */
.text-placeholder {
  @apply text-gray-400 italic;
}

/* Код/моноширинный */
.text-mono {
  @apply font-mono text-sm bg-gray-100 px-1 py-0.5 rounded;
}
```

## 🧩 Компоненты

### Кнопки
```css
/* Primary кнопка */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
  @apply px-4 py-2 rounded-lg font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
  @apply transition-all duration-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Secondary кнопка */
.btn-secondary {
  @apply bg-gray-200 hover:bg-gray-300 text-gray-900;
  @apply border border-gray-300 hover:border-gray-400;
  @apply px-4 py-2 rounded-lg font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
  @apply transition-all duration-200;
}

/* Danger кнопка */
.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white;
  @apply px-4 py-2 rounded-lg font-medium;
  @apply focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2;
  @apply transition-all duration-200;
}

/* Размеры кнопок */
.btn-sm {
  @apply px-3 py-1.5 text-sm;
}

.btn-lg {
  @apply px-6 py-3 text-lg;
}
```

### Карточки
```css
/* Базовая карточка */
.card {
  @apply bg-white rounded-2xl shadow-sm border border-gray-100;
  @apply p-6;
}

/* Интерактивная карточка */
.card-interactive {
  @apply card hover:shadow-md transition-all duration-200;
  @apply group cursor-pointer;
}

/* Карточка с градиентом */
.card-gradient {
  @apply card relative overflow-hidden;
}

.card-gradient::before {
  content: '';
  @apply absolute inset-0 bg-gradient-to-br from-transparent to-gray-25;
  @apply opacity-50;
}
```

### Формы
```css
/* Input поля */
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply transition-all duration-200;
  @apply placeholder-gray-400;
}

/* Labels */
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

/* Ошибки */
.form-error {
  @apply text-red-600 text-sm mt-1;
}

/* Подсказки */
.form-hint {
  @apply text-gray-500 text-xs mt-1;
}
```

### Таблицы
```css
/* Заголовки таблиц */
.table-header {
  @apply bg-gray-50 px-6 py-3;
  @apply text-xs font-medium text-gray-500 uppercase tracking-wider;
}

/* Ячейки таблиц */
.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}

/* Hover эффект для строк */
.table-row {
  @apply hover:bg-gray-50 transition-colors;
}
```

### Бейджи и статусы
```css
/* Базовый бейдж */
.badge {
  @apply inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full;
  @apply border transition-colors;
}

/* Статусы */
.badge-success {
  @apply bg-green-100 text-green-800 border-green-300;
}

.badge-warning {
  @apply bg-yellow-100 text-yellow-800 border-yellow-300;
}

.badge-error {
  @apply bg-red-100 text-red-800 border-red-300;
}

.badge-info {
  @apply bg-blue-100 text-blue-800 border-blue-300;
}

.badge-gray {
  @apply bg-gray-100 text-gray-800 border-gray-300;
}
```

## ⚡ Анимации и переходы

### Базовые переходы
```css
/* Общие переходы */
.transition-base {
  @apply transition-all duration-200 ease-in-out;
}

.transition-colors {
  @apply transition-colors duration-200;
}

.transition-transform {
  @apply transition-transform duration-200;
}
```

### Hover эффекты
```css
/* Масштабирование */
.hover-scale {
  @apply hover:scale-105 transform transition-transform duration-200;
}

.hover-scale-sm {
  @apply hover:scale-110 transform transition-transform duration-200;
}

/* Поднятие */
.hover-lift {
  @apply hover:shadow-lg hover:-translate-y-1 transition-all duration-200;
}

/* Свечение */
.hover-glow {
  @apply hover:shadow-md hover:shadow-blue-200 transition-all duration-200;
}
```

### Кастомные анимации
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

/* Slide up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

/* Bounce */
.animate-bounce-sm {
  animation: bounce 1s infinite;
  animation-iteration-count: 1;
}
```

## 🎭 Иконки и эмодзи

### Статусы и состояния
```
✅ Активен / Успешно / Да
❌ Неактивен / Ошибка / Нет  
⏰ Запланировано / Ожидание
🔄 Загрузка / Обновление
⚡ Быстро / Мгновенно
�� Важно / Цель
```

### Роли пользователей
```
👑 Супер администратор (superuser)
🛡️ Администратор (admin)
✍️ Автор (author)
👁️ Просмотр только (viewer)
```

### Действия
```
✏️ Редактировать
🗑️ Удалить
📋 Копировать / Дублировать
👁️ Просмотреть
➕ Добавить / Создать
🔍 Поиск
⚙️ Настройки
📤 Экспорт
📥 Импорт
🔄 Обновить
```

### Типы контента
```
🌐 Сайт / Веб
📄 Пост / Статья
📋 Страница
👤 Пользователь
📊 Статистика
📁 Категория
🏷️ Тег
🖼️ Изображение
📎 Файл
```

### Уведомления
```
🎉 Поздравления / Успех
⚠️ Предупреждение
🚨 Критическая ошибка
ℹ️ Информация
💡 Подсказка
🔔 Новое уведомление
```

## 📱 Адаптивность

### Breakpoints
```css
/* Mobile First подход */
/* Base: 320px+ */

/* Small tablets */
@media (min-width: 640px) { /* sm: */ }

/* Large tablets */
@media (min-width: 768px) { /* md: */ }

/* Laptops */
@media (min-width: 1024px) { /* lg: */ }

/* Desktops */
@media (min-width: 1280px) { /* xl: */ }

/* Large desktops */
@media (min-width: 1536px) { /* 2xl: */ }
```

### Grid системы
```css
/* Адаптивные сетки */
.grid-responsive-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.grid-responsive-stats {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6;
}

.grid-responsive-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
```

### Скрытие элементов
```css
/* Скрыть на мобильных */
.hidden-mobile {
  @apply hidden sm:block;
}

/* Показать только на мобильных */
.mobile-only {
  @apply block sm:hidden;
}

/* Адаптивные отступы */
.padding-responsive {
  @apply p-4 sm:p-6 lg:p-8;
}
```

## 💻 Стандарты кода

### Именование классов CSS
```css
/* Блок__элемент--модификатор */
.card { }
.card__header { }
.card__body { }
.card--large { }
.card--interactive { }

/* Состояния */
.is-active { }
.is-loading { }
.is-disabled { }
.has-error { }
```

### TypeScript интерфейсы
```typescript
// Всегда типизируем props
interface ComponentProps {
  title: string;
  description?: string;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Используем generics для переиспользуемых компонентов
interface TableProps<T extends { id: string | number }> {
  data: T[];
  columns: TableColumn<T>[];
}

// Enum для статусов
enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived'
}
```

### Структура компонентов
```typescript
// 1. Импорты
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Типы и интерфейсы
interface ComponentProps {
  // ...
}

// 3. Компонент
const Component: React.FC<ComponentProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // 4. Хуки
  const navigate = useNavigate();
  const [state, setState] = useState();

  // 5. Эффекты
  useEffect(() => {
    // ...
  }, []);

  // 6. Обработчики
  const handleClick = () => {
    // ...
  };

  // 7. Рендер
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 8. Экспорт
export default Component;
```

### Коммиты
```bash
# Формат коммитов
feat: добавление новой функциональности
fix: исправление бага
docs: обновление документации
style: изменения стилизации
refactor: рефакторинг кода
test: добавление тестов
chore: обновление зависимостей

# Примеры
feat: добавить компонент UsersTable
fix: исправить ошибку сортировки в таблице
style: обновить дизайн кнопок
docs: добавить style guide
```

## 🚀 Практические советы

### Производительность
1. Используйте `React.memo` для компонентов с частыми ре-рендерами
2. Мемоизируйте вычисления с `useMemo`
3. Оптимизируйте изображения (WebP, lazy loading)
4. Минимизируйте bundle size

### Доступность
1. Всегда добавляйте `alt` атрибуты к изображениям
2. Используйте семантические HTML теги
3. Обеспечьте focus states для интерактивных элементов
4. Поддерживайте навигацию с клавиатуры

### Консистентность
1. Следуйте данному style guide
2. Используйте ESLint и Prettier
3. Проверяйте код перед коммитом
4. Документируйте сложные компоненты

## React/TypeScript Patterns

### Компоненты
- Использовать функциональные компоненты с TypeScript
- Все props должны быть типизированы через интерфейсы
- Использовать `React.memo()` для оптимизации перерендеров
- Избегать inline объектов и функций в props

### Zustand Store Usage
- **✅ ПРАВИЛЬНО**: Использовать селекторы для состояний
  ```typescript
  const data = useMyStore(state => state.data);
  const isLoading = useMyStore(state => state.isLoading);
  ```
- **✅ ПРАВИЛЬНО**: Вызывать функции напрямую из store
  ```typescript
  const handleSubmit = async () => {
    await useMyStore.getState().submitData(data);
  };
  ```
- **❌ НЕПРАВИЛЬНО**: Деструктурировать функции из store
  ```typescript
  const { fetchData, submitData } = useMyStore(); // Вызывает бесконечный рендер!
  ```

### useEffect Patterns
- Минимизировать зависимости в dependency array
- Не включать функции store в зависимости
- Определять async функции внутри useEffect
- **Документация**: См. [INFINITE_RENDER_FIX.md](INFINITE_RENDER_FIX.md) для деталей

### Хуки
- Называть кастомные хуки с префикса `use`
- Возвращать объекты с именованными свойствами
- Типизировать все параметры и возвращаемые значения

---

**Помните:** Этот style guide - живой документ. Обновляйте его при добавлении новых паттернов и компонентов! 🎨✨ 

## 📊 Система иконок

### 🚨 КРИТИЧЕСКИ ВАЖНО! Система HugeIcons
**ВСЕГДА используйте ТОЛЬКО иконки из нашей системы HugeIcons!**

#### ✅ ПРАВИЛЬНО:
```tsx
import Icon from '../components/ui/Icon';

// Использование нашей системы
<Icon name="user" size="md" color="primary" />
<Icon name="settings" size="lg" />
<Icon name="dashboard" />
```

#### ❌ ЗАПРЕЩЕНО:
```tsx
// НЕ используйте эмодзи
<span>📊</span>
<span>⚙️</span>

// НЕ создавайте SVG иконки вручную  
<svg className="w-6 h-6">...</svg>

// НЕ используйте другие библиотеки иконок
<SomeOtherIcon />
```

### 📖 Доступные иконки
У нас есть **60+ иконок** в системе. Проверьте доступные иконки на странице `/icons` или в файле `Icon.tsx`:

#### Основные категории:
- **Навигация**: home, menu, dashboard, search, settings
- **Пользователи**: user, users, userAdd, userRemove
- **Действия**: add, edit, delete, copy, share, upload, download
- **Файлы**: file, folder, image, video, pdf
- **Статус**: check, cancel, warning, info, alert
- **Стрелки**: arrowUp, arrowDown, arrowLeft, arrowRight

### ⚙️ Настройки иконок

#### Размеры:
- `xs` (12px) - для очень мелких элементов
- `sm` (16px) - для кнопок, таблиц 
- `md` (20px) - размер по умолчанию
- `lg` (24px) - для заголовков
- `xl` (32px) - для больших элементов
- `2xl` (48px) - для hero блоков

#### Цвета:
- `primary` - основной синий цвет
- `secondary` - серый цвет
- `success` - зеленый для успеха
- `warning` - желтый для предупреждений
- `danger` - красный для ошибок
- `gray` - нейтральный серый
- `white` - белый цвет
- `current` - цвет родительского элемента

### 📋 Примеры использования

#### В кнопках:
```tsx
<Button>
  <Icon name="add" size="sm" className="mr-2" />
  Создать
</Button>
```

#### В навигации:
```tsx
<NavLink to="/users">
  <Icon name="users" size="md" />
  Пользователи  
</NavLink>
```

#### В статусах:
```tsx
{status === 'active' && (
  <Icon name="check" size="sm" color="success" />
)}
```

### 🔧 Добавление новых иконок
Если нужна новая иконка:

1. Проверьте [HugeIcons каталог](https://hugeicons.com/)
2. Добавьте импорт в `Icon.tsx`
3. Добавьте в тип `AvailableIconName`
4. Обновите документацию

---

## 🎨 Цветовая палитра