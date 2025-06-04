# 🔧 Документация исправлений Frontend-Backend интеграции

## 📋 Обзор

Данная документация содержит все критические исправления, сделанные при интеграции frontend и backend системы. **ОБЯЗАТЕЛЬНО** изучите эту документацию перед внесением изменений в соответствующие компоненты.

---

## 🗂 Список исправленных проблем

### 1. 📸 **Загрузка файлов (Featured Images)**

#### Проблема:
- Frontend отправлял файлы как обычные JSON поля
- Backend ожидал файлы через `multipart/form-data`
- Ошибка: `"Загруженный файл не является корректным файлом"`

#### Решение:
**Файл:** `frontend/src/store/postsStore.ts`

```typescript
// ✅ ПРАВИЛЬНО: Использование FormData для файлов
if (data.featured_image instanceof File) {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'featured_image' && value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  // POST: используем api.upload()
  newPost = await api.upload<Post>('/posts/', formData);
  
  // PATCH: используем прямой вызов axios
  const response = await apiClient.patch(`/posts/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

#### ⚠️ Важные моменты:
1. Для создания (POST) используем `api.upload()`
2. Для обновления (PATCH) используем прямой `apiClient.patch()` с FormData
3. Всегда проверяем `instanceof File` перед созданием FormData
4. Если файла нет - используем обычный JSON через `api.post()` / `api.patch()`

---

### 2. 📝 **Валидация форм PostForm**

#### Проблема:
- Кнопка создания поста была неактивна из-за строгой валидации
- Поле `site` не устанавливалось корректно
- Поле `slug` блокировало валидацию когда было пустым

#### Решение:
**Файл:** `frontend/src/components/forms/PostForm.tsx`

```typescript
// ✅ ПРАВИЛЬНАЯ Zod схема
const postSchema = z.object({
  // Обязательные поля
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  site: z.number().min(1),
  
  // Опциональные поля с правильной обработкой пустых строк
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'URL slug может содержать только строчные буквы, цифры и дефисы')
    .or(z.literal(''))  // ✅ Разрешаем пустую строку
    .optional(),
    
  excerpt: z.string()
    .max(500)
    .or(z.literal(''))  // ✅ Разрешаем пустую строку
    .optional(),
});

// ✅ ПРАВИЛЬНАЯ инициализация формы
const form = useForm<PostFormData>({
  resolver: zodResolver(postSchema),
  mode: 'onChange', // ✅ Валидация при изменении
  defaultValues: {
    title: '',
    content: '',
    status: 'draft',
    visibility: 'public',
    // site устанавливается после загрузки сайтов
  },
});

// ✅ ПРАВИЛЬНАЯ установка сайта по умолчанию
useEffect(() => {
  if (sites.length > 0 && !isEditing && !watchedSite) {
    setValue('site', sites[0].id, { shouldValidate: true });
  }
}, [sites, isEditing, setValue, watchedSite]);
```

#### ⚠️ Важные моменты:
1. Используйте `mode: 'onChange'` для валидации в реальном времени
2. Опциональные строковые поля должны разрешать пустые строки через `.or(z.literal(''))`
3. Поле `site` устанавливается ПОСЛЕ загрузки сайтов, не в defaultValues
4. Всегда используйте `{ shouldValidate: true }` при программной установке значений

---

### 3. 🔧 **Backend сериализаторы PostListSerializer**

#### Проблема:
- Конфликт полей `tags` в сериализаторе
- Дублирование `source='tags'` для поля с именем `tags`
- Ошибка при сериализации списка постов

#### Решение:
**Файл:** `backend/apps/posts/serializers.py`

```python
class PostListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка постов"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags_list = TagSerializer(source='tags', many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    
    # ✅ ПРАВИЛЬНО: без лишнего source='tags'
    tags = TagSerializer(many=True, read_only=True)
    
    # ❌ НЕПРАВИЛЬНО: tags = TagSerializer(source='tags', many=True, read_only=True)
```

#### ⚠️ Важные моменты:
1. Если поле сериализатора называется также как поле модели - НЕ указывайте `source`
2. `source` нужен только когда имя поля сериализатора отличается от имени поля модели
3. Можно иметь несколько полей для одних данных: `tags` и `tags_list`

---

### 4. 🔄 **Синхронизация типов Frontend-Backend**

#### Проблема:
- Frontend ожидал поля которых не было в backend сериализаторах
- Несоответствие полей `visibility`, `meta_keywords`, `comments_count`

#### Решение:

**Backend:** Добавлены поля в модель Post
```python
# backend/apps/posts/models.py
class Post(models.Model):
    # ... существующие поля ...
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    meta_keywords = models.CharField(max_length=255, blank=True)
```

**Backend:** Обновлены сериализаторы
```python
class PostListSerializer(serializers.ModelSerializer):
    comments_count = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField() 
    tags = TagSerializer(many=True, read_only=True)
    
    def get_comments_count(self, obj):
        return 0  # Пока без комментариев
    
    def get_categories(self, obj):
        return [obj.category] if obj.category else []
```

**Frontend:** Обновлены типы
```typescript
// frontend/src/types/post.types.ts
export interface PostListItem {
  // ... существующие поля ...
  visibility: PostVisibility;
  categories: Category[];
  tags: Tag[];
  comments_count: number;
}
```

#### ⚠️ Важные моменты:
1. Всегда синхронизируйте типы frontend с полями backend сериализаторов
2. Создавайте миграции для новых полей модели
3. Обновляйте все сериализаторы (List, Detail, Create, Update)

---

### 5. 🌐 **API Endpoints исправления**

#### Проблема:
- Неправильные пути к endpoints категорий и тегов
- Неправильный endpoint для изменения статуса поста

#### Решение:
**Файл:** `frontend/src/store/postsStore.ts`

```typescript
// ✅ ПРАВИЛЬНЫЕ пути к API
const correctEndpoints = {
  // Посты
  posts: '/posts/',
  postDetail: '/posts/{id}/',
  changeStatus: '/posts/{id}/change_status/',  // ✅ action endpoint
  duplicate: '/posts/{id}/duplicate/',
  
  // Связанные ресурсы  
  categories: '/posts/categories/',  // ✅ правильный путь
  tags: '/posts/tags/',              // ✅ правильный путь
};

// ❌ НЕПРАВИЛЬНО:
// changeStatus: '/posts/{id}/' + PATCH  // обычный endpoint
// categories: '/categories/'             // неправильный путь
// tags: '/tags/'                        // неправильный путь
```

---

## 🧪 **Тестирование исправлений**

### Тест загрузки файлов:
1. Создайте пост с изображением
2. Проверьте что файл загрузился на backend
3. Убедитесь что изображение отображается в списке

### Тест валидации форм:
1. Откройте форму создания поста
2. Введите заголовок и содержимое
3. Кнопка должна стать активной
4. Slug должен автогенерироваться

### Тест API endpoints:
1. Измените статус поста в таблице
2. Проверьте обновление в реальном времени
3. Убедитесь что категории и теги загружаются

---

## 🚨 **КРИТИЧЕСКИЕ предупреждения**

### ❌ НЕ ДЕЛАЙТЕ:

1. **НЕ меняйте логику FormData** в `postsStore.ts` без понимания последствий
2. **НЕ добавляйте `source='field_name'`** если поле сериализатора называется также как поле модели
3. **НЕ делайте поля Zod схемы обязательными** без `.or(z.literal(''))` для опциональных строк
4. **НЕ используйте неправильные API paths** - всегда проверяйте в `API_SUMMARY.md`

### ✅ ВСЕГДА:

1. **Тестируйте загрузку файлов** после изменений в postsStore
2. **Проверяйте валидацию форм** после изменений в PostForm
3. **Синхронизируйте типы** при изменении backend сериализаторов
4. **Создавайте миграции** при добавлении полей в модели

---

## 📚 **Связанные файлы**

### Frontend:
- `frontend/src/store/postsStore.ts` - логика API постов
- `frontend/src/components/forms/PostForm.tsx` - форма поста
- `frontend/src/types/post.types.ts` - типы постов
- `frontend/src/lib/axios.config.ts` - конфигурация API

### Backend:
- `backend/apps/posts/models.py` - модель Post
- `backend/apps/posts/serializers.py` - сериализаторы постов
- `backend/apps/posts/migrations/` - миграции базы данных

---

## 🏷️ **Версия исправлений**

**Дата:** Декабрь 2024  
**Статус:** ✅ Все исправления протестированы и работают  
**Совместимость:** Frontend + Backend v1.0

---

> **💡 Совет:** Перед внесением изменений в любой из перечисленных файлов, обязательно изучите эту документацию и протестируйте на локальной среде! 