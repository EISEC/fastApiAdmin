# 🧩 Компоненты FastAPI Admin

Детальная документация всех компонентов проекта.

## 📋 Оглавление

- [UI Компоненты](#ui-компоненты)
- [Layout Компоненты](#layout-компоненты)
- [Form Компоненты](#form-компоненты)
- [Table Компоненты](#table-компоненты)
- [Toast Система](#toast-система)
- [Примеры использования](#примеры-использования)

## 🎨 UI Компоненты

### Button - Универсальная кнопка

**Расположение:** `src/components/ui/Button.tsx`

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

**Особенности:**
- ✨ Три варианта дизайна (primary, secondary, danger)
- 📏 Три размера (sm, md, lg)
- ⚡ Поддержка loading состояния с спиннером
- 🎯 Focus states для доступности
- 🔧 Полная кастомизация через className

**Примеры использования:**
```typescript
// Основная кнопка
<Button variant="primary" onClick={handleSubmit}>
  Сохранить
</Button>

// Кнопка с загрузкой
<Button variant="primary" loading={isLoading}>
  {isLoading ? 'Загрузка...' : 'Отправить'}
</Button>

// Маленькая кнопка действия
<Button variant="secondary" size="sm" onClick={handleEdit}>
  ✏️ Редактировать
</Button>
```

---

### Icon - Система иконок HugeIcons

**Расположение:** `src/components/ui/Icon.tsx`

```typescript
interface IconProps {
  name: AvailableIconName;        // Название иконки (обязательно)
  size?: IconSize;                // xs | sm | md | lg | xl | 2xl
  color?: IconColor;              // primary | secondary | success | warning | danger | gray | white | current
  strokeWidth?: number;           // Толщина обводки (по умолчанию 1.5)
  className?: string;             // Дополнительные CSS классы
  onClick?: () => void;           // Обработчик клика
  title?: string;                 // Заголовок для доступности
}

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray' | 'white' | 'current';
```

**Особенности:**
- 🎨 **60+ иконок** из библиотеки HugeIcons
- 📐 **6 размеров** от 12px до 48px
- 🌈 **8 цветовых схем** включая текущий цвет
- ✨ **TypeScript типизация** с автокомплитом
- ♿ **Accessibility** поддержка
- 🔄 **Fallback** для несуществующих иконок

**Доступные категории иконок:**
- **Основные:** home, dashboard, menu, close, search, settings
- **Пользователи:** user, users, userAdd, userRemove, userEdit
- **Действия:** add, edit, delete, copy, share, download, upload, refresh, filter
- **Файлы:** file, folder, image, video, pdf, zip
- **Веб:** globe, link, browser, code
- **Статус:** check, cancel, alert, info, question, warning
- **Навигация:** arrowUp, arrowDown, arrowLeft, arrowRight
- И многие другие...

**Примеры использования:**
```typescript
// Простая иконка
<Icon name="home" />

// С настройками размера и цвета
<Icon name="user" size="lg" color="primary" />

// В кнопке
<Button>
  <Icon name="add" size="sm" className="mr-2" />
  Создать
</Button>

// Интерактивная иконка
<Icon 
  name="settings" 
  size="md" 
  onClick={() => openSettings()}
  title="Открыть настройки"
  className="cursor-pointer hover:text-primary-600"
/>

// В навигации
<NavLink to="/users">
  <Icon name="users" size="md" className="mr-3" />
  Пользователи
</NavLink>
```

**Страница демонстрации:**
- 📍 Доступна по адресу `/icons`
- 🔍 Поиск и фильтрация по категориям
- 🎛 Настройка размера и цвета в реальном времени
- 📋 Копирование кода в буфер обмена
- 📱 Responsive дизайн

---

### Table - Универсальная таблица данных

**Расположение:** `src/components/ui/Table.tsx`

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

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, item: T, index: number) => ReactNode;
}
```

**Возможности:**
- 🔄 Сортировка с анимированными индикаторами
- 🎯 Кастомный рендеринг через render функции
- 📱 Адаптивный дизайн
- ✨ Hover эффекты и состояния загрузки
- 🎨 Автоматическая обработка типов данных

**Пример конфигурации колонок:**
```typescript
const columns: TableColumn<Site>[] = [
  {
    key: 'name',
    label: 'Название',
    sortable: true,
    render: (value, site) => (
      <div className="flex items-center">
        {site.logo && <img src={site.logo} className="w-8 h-8 mr-2" />}
        <span className="font-medium">{value}</span>
      </div>
    ),
  },
  {
    key: 'is_active',
    label: 'Статус',
    align: 'center',
    render: (value) => (
      <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>
        {value ? '✅ Активен' : '❌ Неактивен'}
      </span>
    ),
  },
];
```

---

### StatsCard - Карточка статистики

**Расположение:** `src/components/ui/StatsCard.tsx`

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
  className?: string;
}
```

**Особенности:**
- 📊 Индикаторы изменений с иконками направления
- 🌈 6 цветовых схем
- ⚡ Hover анимации и эффекты
- 🎨 Градиентные фоны и паттерны

**Примеры:**
```typescript
<StatsCard
  title="Всего сайтов"
  value={24}
  change={{ value: '+3', type: 'increase' }}
  color="blue"
  icon={<WebIcon />}
/>
```

---

### Card - Базовая карточка

**Расположение:** `src/components/ui/Card.tsx`

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}
```

**Варианты использования:**
```typescript
// Обычная карточка
<Card>
  <h3>Заголовок</h3>
  <p>Контент карточки</p>
</Card>

// Интерактивная карточка
<Card hover className="cursor-pointer" onClick={handleClick}>
  Контент
</Card>
```

---

## 🏗 Layout Компоненты

### DashboardLayout - Основной макет

**Расположение:** `src/components/layout/DashboardLayout.tsx`

```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Структура:**
- 📱 Адаптивная боковая панель
- 🔝 Верхняя навигация с профилем
- 🖥️ Основная область контента
- 📱 Мобильная навигация

---

### Sidebar - Боковая панель

**Расположение:** `src/components/layout/Sidebar.tsx`

**Возможности:**
- 🎯 Активные состояния для текущей страницы
- 📱 Скрытие на мобильных устройствах
- 🎨 Иконки для каждого пункта меню
- 🔄 Hover эффекты

---

### Header - Верхняя панель

**Расположение:** `src/components/layout/Header.tsx`

**Элементы:**
- 👤 Профиль пользователя
- 🔔 Уведомления
- 🚪 Кнопка выхода
- 📱 Мобильное меню

---

## 📝 Form Компоненты

### SiteForm - Форма сайта

**Расположение:** `src/components/forms/SiteForm.tsx`

```typescript
interface SiteFormProps {
  mode: 'create' | 'edit';
  initialData?: Site;
  onSubmit: (data: SiteCreateData | SiteUpdateData) => void;
  loading?: boolean;
}
```

**Поля:**
- 🏷️ Название сайта (обязательное)
- 🌐 Домен (валидация URL)
- 📝 Описание (textarea)
- 🖼️ Логотип (загрузка файла)
- ✅ Статус активности

**Валидация:**
- Проверка уникальности домена
- Валидация формата URL
- Ограничение размера файла логотипа

---

### PostForm - Форма поста

**Расположение:** `src/components/forms/PostForm.tsx`

**Особенности:**
- 📝 Rich text редактор (TinyMCE)
- 🔗 Автогенерация slug из заголовка
- 🖼️ Загрузка изображений
- 🎯 SEO поля (meta description, keywords)
- 📅 Планирование публикации

---

### UserForm - Форма пользователя

**Расположение:** `src/components/forms/UserForm.tsx`

**Поля:**
- 👤 Личные данные (имя, фамилия, email)
- 🔑 Настройки авторизации
- 👥 Роль пользователя
- 🖼️ Аватар
- ✅ Статус активности

---

### LoginForm - Форма входа

**Расположение:** `src/components/forms/LoginForm.tsx`

**Возможности:**
- 🔐 Валидация email и пароля
- 👁️ Показать/скрыть пароль
- 💾 Запомнить пользователя
- ⚡ Состояния загрузки и ошибок

---

## 📊 Table Компоненты

### SitesTable - Таблица сайтов

**Расположение:** `src/components/tables/SitesTable.tsx`

**Колонки:**
1. **Сайт** - Логотип, название, домен
2. **Описание** - Краткое описание
3. **Статус** - Активен/Неактивен (интерактивное переключение)
4. **Создан** - Дата создания
5. **Действия** - Редактировать, Удалить

**Особенности:**
- 🖼️ Логотипы с fallback на инициалы
- 🔄 Интерактивное переключение статуса
- ✅ Подтверждение удаления
- 📅 Форматированные даты

---

### PostsTable - Таблица постов

**Расположение:** `src/components/tables/PostsTable.tsx`

**Колонки:**
1. **Пост** - Изображение, заголовок, slug
2. **Автор** - Аватар и имя автора
3. **Сайт** - Название сайта
4. **Статус** - Селект смены статуса + бейдж
5. **Просмотры** - Счетчик просмотров
6. **Создан** - Дата создания
7. **Действия** - Редактировать, Копировать, Удалить

**Особенности:**
- 🖼️ Миниатюры постов
- 🎛️ Интерактивный селект статуса
- 📋 Функция дублирования
- 📊 Отображение статистики

---

### UsersTable - Таблица пользователей

**Расположение:** `src/components/tables/UsersTable.tsx`

**Колонки:**
1. **Пользователь** - Аватар, логин, email
2. **Имя** - Полное имя
3. **Роль** - Цветовой бейдж роли
4. **Статус** - Активен/Заблокирован
5. **Последний вход** - Дата входа
6. **Регистрация** - Дата регистрации
7. **Действия** - Редактировать, Удалить

**Особенности:**
- 👤 Аватары с градиентными fallback
- 🏷️ Цветовые бейджи ролей с иконками
- 🔄 Переключение активности
- 🕐 Информация о последней активности

---

## 🔔 Toast Система

### Toast - Компонент уведомления

**Расположение:** `src/components/ui/Toast.tsx`

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

**Типы уведомлений:**
- ✅ **Success** - Успешные операции (зеленый)
- ❌ **Error** - Ошибки (красный)
- ⚠️ **Warning** - Предупреждения (желтый)
- ℹ️ **Info** - Информационные (синий)

---

### ToastContainer - Контейнер уведомлений

**Расположение:** `src/components/ui/ToastContainer.tsx`

**Возможности:**
- 📍 Позиционирование (по умолчанию top-right)
- ⚡ Анимации появления/исчезновения
- 🔄 Автоматическое удаление через timeout
- 📱 Адаптивность для мобильных

---

## 💻 Примеры использования

### Создание новой таблицы

```typescript
// 1. Определить типы данных
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  createdAt: string;
}

// 2. Создать компонент таблицы
const ProductsTable: React.FC = () => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });

  const columns: TableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Товар',
      sortable: true,
      render: (value, product) => (
        <div className="font-medium text-gray-900">
          {value}
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Цена',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono">
          {Number(value).toLocaleString()} ₽
        </span>
      ),
    },
    {
      key: 'inStock',
      label: 'В наличии',
      align: 'center',
      render: (value) => (
        <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>
          {value ? 'Есть' : 'Нет'}
        </span>
      ),
    },
  ];

  return (
    <Table
      data={products}
      columns={columns}
      loading={isLoading}
      sortConfig={sortConfig}
      onSort={handleSort}
      emptyMessage="Товары не найдены"
    />
  );
};
```

### Создание формы с валидацией

```typescript
// 1. Определить схему валидации
const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  category: z.string().min(1, 'Категория обязательна'),
});

// 2. Создать форму
const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="form-label">Название товара</label>
        <input
          {...register('name')}
          className="form-input"
          placeholder="Введите название"
        />
        {errors.name && (
          <p className="form-error">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="form-label">Цена</label>
        <input
          type="number"
          {...register('price', { valueAsNumber: true })}
          className="form-input"
          placeholder="0"
        />
        {errors.price && (
          <p className="form-error">{errors.price.message}</p>
        )}
      </div>

      <Button type="submit" loading={loading}>
        Сохранить
      </Button>
    </form>
  );
};
```

### Интеграция с Toast уведомлениями

```typescript
const MyComponent: React.FC = () => {
  const { success, error } = useToastStore();

  const handleSave = async () => {
    try {
      await saveData();
      success('Успешно сохранено', 'Данные были успешно обновлены');
    } catch (err) {
      error('Ошибка сохранения', 'Не удалось сохранить данные');
    }
  };

  return (
    <Button onClick={handleSave}>
      Сохранить
    </Button>
  );
};
```

---

## 🔧 Рекомендации по разработке

### 1. Переиспользование компонентов
- Создавайте generic компоненты для типовых задач
- Используйте composition pattern вместо большого количества props
- Выносите общую логику в кастомные хуки

### 2. Типизация
- Всегда типизируйте props и state
- Используйте generics для универсальных компонентов
- Создавайте union types для вариантов

### 3. Производительность
- Мемоизируйте тяжелые вычисления
- Используйте React.memo для компонентов
- Избегайте inline объектов в props

### 4. Доступность
- Добавляйте aria-labels для интерактивных элементов
- Обеспечивайте keyboard navigation
- Используйте семантические HTML теги

---

**Документация обновляется при добавлении новых компонентов! 📝✨** 