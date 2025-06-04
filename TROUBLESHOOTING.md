# 🚨 Быстрое устранение неполадок Frontend-Backend

## 🔍 Распространенные проблемы и решения

### 1. 📸 "Файл не является корректным файлом"

**Симптомы:**
- Ошибка при загрузке изображений в посты
- В консоли: `featured_image: ["Загруженный файл не является корректным файлом."]`

**Причина:** Файл отправляется как JSON вместо FormData

**Решение:**
```typescript
// Проверьте в postsStore.ts
if (data.featured_image instanceof File) {
  // ✅ Используйте FormData
  const formData = new FormData();
  // ... добавление полей
  await api.upload('/posts/', formData);
} else {
  // ✅ Используйте JSON
  await api.post('/posts/', data);
}
```

---

### 2. 🔘 Кнопка "Создать пост" неактивна

**Симптомы:**
- Кнопка серая и не нажимается
- Все поля заполнены корректно

**Причина:** Проблемы с валидацией Zod схемы

**Диагностика:**
```typescript
// Добавьте временно в PostForm.tsx
console.log('Form state:', { 
  isValid: formState.isValid, 
  errors: formState.errors 
});
```

**Решения:**
1. **Проблема с slug:** Используйте `.or(z.literal('')).optional()`
2. **Проблема с site:** Убедитесь что setValue вызывается с `shouldValidate: true`
3. **Пустые строки:** Добавьте `.or(z.literal(''))` для опциональных полей

---

### 3. 🏷️ Ошибки сериализации тегов

**Симптомы:**
- Ошибки в логах backend при загрузке постов
- Конфликты полей в сериализаторе

**Причина:** Дублирование `source='tags'` для поля `tags`

**Решение:**
```python
# В PostListSerializer
tags = TagSerializer(many=True, read_only=True)  # ✅ Правильно
# tags = TagSerializer(source='tags', many=True, read_only=True)  # ❌ Неправильно
```

---

### 4. 🌐 404 ошибки API endpoints

**Симптомы:**
- Категории/теги не загружаются
- 404 ошибки в Network tab

**Причина:** Неправильные пути к API

**Решение:**
```typescript
// ✅ Правильные пути
fetchCategories: () => api.get('/posts/categories/')
fetchTags: () => api.get('/posts/tags/')
changeStatus: (id, status) => api.patch(`/posts/${id}/change_status/`, { status })

// ❌ Неправильные пути
// '/categories/', '/tags/', `/posts/${id}/` для статуса
```

---

### 5. 💾 Проблемы с сохранением

**Симптомы:**
- Данные не сохраняются
- Форма отправляется но пост не создается

**Диагностика:**
1. Откройте Network tab в браузере
2. Проверьте статус ответа (200, 400, 500)
3. Посмотрите на payload запроса

**Частые причины:**
- **400:** Ошибки валидации, проверьте поля
- **401:** Проблемы с авторизацией
- **500:** Ошибки backend сериализатора

---

## 🛠️ Команды для диагностики

### Backend проверки:
```bash
cd backend
python3 manage.py check                    # Проверка системы
python3 manage.py shell                   # Django shell
python3 manage.py runserver --noreload    # Запуск без автоперезагрузки
```

### Frontend проверки:
```bash
cd frontend
yarn dev                     # Запуск development сервера
yarn build                   # Проверка сборки
yarn type-check             # Проверка типов TypeScript
```

---

## 📋 Чеклист быстрой проверки

### При проблемах с постами:
- [ ] Backend сервер запущен на :8000
- [ ] Frontend сервер запущен на :5174
- [ ] JWT токен авторизации действителен
- [ ] В PostListSerializer нет конфликтов полей
- [ ] FormData используется для файлов
- [ ] Zod схема корректна для опциональных полей

### При изменении кода:
- [ ] Миграции применены (для backend)
- [ ] Типы синхронизированы (для frontend)
- [ ] Нет конфликтов в сериализаторах
- [ ] API пути корректны
- [ ] Документация обновлена

---

## 🆘 Быстрые фиксы

### "Не могу создать пост":
```typescript
// 1. Проверьте валидацию
const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).or(z.literal('')).optional(),
  excerpt: z.string().max(500).or(z.literal('')).optional(),
});

// 2. Проверьте инициализацию сайта
useEffect(() => {
  if (sites.length > 0 && !watchedSite) {
    setValue('site', sites[0].id, { shouldValidate: true });
  }
}, [sites, watchedSite]);
```

### "Файлы не загружаются":
```typescript
// Убедитесь что используете FormData
if (data.featured_image instanceof File) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof File ? value : String(value));
    }
  });
  return api.upload('/posts/', formData);
}
```

### "Теги не работают":
```python
# В сериализаторе убедитесь:
tags = TagSerializer(many=True, read_only=True)  # БЕЗ source='tags'
```

---

> **💡 Если проблема не решается:** Проверьте `FRONTEND_BACKEND_FIXES.md` для подробного анализа! 