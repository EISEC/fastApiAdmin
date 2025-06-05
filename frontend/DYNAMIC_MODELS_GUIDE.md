# 🔧 Система динамических моделей - Руководство разработчика

## 📋 Обзор системы

Система динамических моделей позволяет создавать и управлять произвольными структурами данных через веб-интерфейс без необходимости изменения кода.

### ✨ Основные возможности

- 🏗️ **Создание моделей**: Визуальный конструктор полей данных
- 📝 **Управление данными**: CRUD операции для записей модели
- 🎨 **Превью**: Предварительный просмотр форм и таблиц
- 📊 **Экспорт/Импорт**: Резервное копирование конфигураций
- 🔍 **Валидация**: Встроенная валидация полей с Zod
- 🔗 **API интеграция**: Полная интеграция с backend Django

## 🏗️ Архитектура

### Frontend компоненты

```
src/
├── pages/
│   ├── DynamicModelsPage.tsx              # Главная страница моделей
│   ├── CreateDynamicModelPage.tsx         # Создание модели
│   ├── EditDynamicModelPage.tsx           # Редактирование модели
│   ├── DynamicModelDataPage.tsx           # Управление данными
│   ├── CreateDynamicModelDataPage.tsx     # Создание записи
│   ├── EditDynamicModelDataPage.tsx       # Редактирование записи
│   └── DynamicModelPreviewPage.tsx        # Превью модели
├── components/forms/
│   └── DynamicModelForm.tsx               # Форма создания/редактирования модели
├── store/
│   └── dynamicModelsStore.ts              # Zustand store для состояния
├── services/
│   └── dynamicModels.service.ts           # API клиент
└── types/
    └── dynamicModel.types.ts              # TypeScript типы
```

### Backend API endpoints

```
/api/dynamic-models/                       # CRUD операции с моделями
/api/dynamic-models/{id}/data/             # CRUD операции с данными
/api/dynamic-models/{id}/preview/          # Генерация превью
/api/dynamic-models/{id}/export/           # Экспорт конфигурации
/api/dynamic-models/import/                # Импорт конфигурации
/api/dynamic-field-types/                  # Доступные типы полей
```

## 🔧 Создание динамической модели

### 1. Основные параметры

- **Название**: Описательное имя модели
- **Сайт**: Привязка к конкретному сайту
- **Тип модели**: 
  - `standalone` - Отдельная модель
  - `extension` - Расширение существующей модели
- **Описание**: Краткое описание назначения

### 2. Настройка полей

Каждое поле модели включает:

- **Название поля** (`name`): Системное имя (латиница, подчеркивания)
- **Тип поля** (`type`): Тип данных (text, number, email, date, etc.)
- **Отображаемое название** (`label`): Название для пользователя
- **Обязательное** (`required`): Флаг обязательности
- **Показывать в списке** (`show_in_list`): Отображение в таблице
- **Подсказка** (`help_text`): Дополнительная информация
- **Значение по умолчанию** (`default_value`): Значение по умолчанию

### 3. Поддерживаемые типы полей

| Тип | Описание | Компонент |
|-----|----------|-----------|
| `text` | Однострочный текст | Input |
| `textarea` | Многострочный текст | Textarea |
| `number` | Числовое значение | Input[type="number"] |
| `email` | Email адрес | Input[type="email"] |
| `url` | URL ссылка | Input[type="url"] |
| `date` | Дата | Input[type="date"] |
| `datetime` | Дата и время | Input[type="datetime-local"] |
| `boolean` | Флаг Да/Нет | Checkbox |
| `select` | Выбор из списка | Select |
| `file` | Загрузка файла | FileUpload |
| `image` | Загрузка изображения | ImageUpload |

## 📝 Управление данными

### Создание записи

1. Переход: `Модель → Данные → Добавить запись`
2. Заполнение полей согласно схеме модели
3. Настройка публикации (`is_published`)
4. Валидация перед сохранением

### Редактирование записи

1. Переход: `Данные → Действия → Редактировать`
2. Изменение значений полей
3. Сохранение изменений

### Фильтрация данных

- 🔍 **Поиск**: По всем текстовым полям
- 📊 **Статус**: Опубликованные/Черновики
- 📄 **Пагинация**: Разделение на страницы

## 🎨 Превью системы

Функция превью генерирует:

- **Превью формы**: Показывает как будет выглядеть форма ввода
- **Превью таблицы**: Демонстрирует структуру таблицы данных
- **Примеры данных**: Сгенерированные тестовые данные

## 📊 Экспорт и импорт

### Экспорт конфигурации

```typescript
// Экспорт только структуры модели
await dynamicModelsService.exportModelConfig(modelId, false);

// Экспорт с данными
await dynamicModelsService.exportModelConfig(modelId, true);
```

### Импорт конфигурации

```typescript
// Импорт из JSON файла
await dynamicModelsService.importModelConfig(configObject);
```

## 🔍 API интеграция

### Основные методы store

```typescript
const store = useDynamicModelsStore();

// Модели
await store.fetchModels(filters);
await store.createModel(data);
await store.updateModel(id, data);
await store.deleteModel(id);

// Данные модели
await store.fetchModelData(filters);
await store.createModelData(data);
await store.updateModelData(id, data);
await store.deleteModelData(id);

// Утилиты
await store.generatePreview(id);
await store.exportModelConfig(id);
await store.importModelConfig(file);
```

### Типы данных

```typescript
interface DynamicModel {
  id: number;
  name: string;
  site: number;
  model_type: 'standalone' | 'extension';
  target_model?: string;
  fields_config: {
    fields: DynamicModelField[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DynamicModelData {
  id: number;
  dynamic_model: number;
  data: Record<string, any>;
  is_published: boolean;
  display_value: string;
  created_at: string;
  updated_at: string;
}
```

## 🔧 Валидация

Система использует динамическую генерацию Zod схем:

```typescript
const createValidationSchema = (model: DynamicModel) => {
  const schemaFields: Record<string, any> = {};
  
  model.fields_config.fields.forEach(field => {
    let fieldSchema: any;
    
    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Некорректный email');
        break;
      case 'number':
        fieldSchema = z.number();
        break;
      default:
        fieldSchema = z.string();
    }
    
    if (field.required) {
      fieldSchema = fieldSchema.min(1, 'Поле обязательно');
    }
    
    schemaFields[field.name] = fieldSchema;
  });
  
  return z.object(schemaFields);
};
```

## 🚨 Ошибки и отладка

### Распространенные проблемы

1. **Ошибка валидации полей**
   - Проверьте корректность типов полей
   - Убедитесь в правильности обязательных полей

2. **Ошибки API**
   - Проверьте подключение к backend
   - Убедитесь в корректности endpoint'ов

3. **Проблемы с формами**
   - Проверьте схемы валидации Zod
   - Убедитесь в корректности значений по умолчанию

### Логирование

```typescript
// Включение отладочного режима
console.log('Dynamic Models Store:', useDynamicModelsStore.getState());
```

## 🛠️ Расширение системы

### Добавление нового типа поля

1. **Backend**: Добавить обработку в Django
2. **Types**: Обновить типы TypeScript
3. **Form**: Добавить рендеринг в формы
4. **Validation**: Добавить Zod валидацию

### Кастомизация компонентов

Система поддерживает переопределение компонентов через UI библиотеку.

## 📈 Производительность

### Оптимизация

- **Пагинация**: Загрузка данных порциями
- **Мемоизация**: React.memo для компонентов
- **Lazy loading**: Отложенная загрузка данных
- **Debounce**: Задержка для поиска

### Мониторинг

- Отслеживание времени загрузки API
- Мониторинг ошибок валидации
- Анализ использования типов полей

## 🔒 Безопасность

- **Валидация**: Серверная и клиентская валидация
- **Разрешения**: Система ролей пользователей
- **Санитизация**: Очистка пользовательского ввода
- **CSRF защита**: Токены для форм

---

## 🎉 Заключение

Система динамических моделей предоставляет мощный инструмент для создания произвольных структур данных без программирования. Гибкая архитектура позволяет легко расширять функциональность и интегрировать с существующими системами.

**Система полностью готова к использованию!** 🚀 