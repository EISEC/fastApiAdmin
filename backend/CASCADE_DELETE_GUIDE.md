# 🗑️ Руководство по каскадному удалению сайтов

## 📋 Обзор

Система каскадного удаления сайтов обеспечивает **безопасное и полное удаление** сайта вместе со всеми его зависимостями. При удалении сайта автоматически удаляются:

- ✅ **Все посты** сайта
- ✅ **Все страницы** сайта  
- ✅ **Все категории** сайта
- ✅ **Все теги** сайта
- ✅ **Все динамические модели** сайта
- ✅ **Связи с пользователями** (assigned_users)
- ✅ **Файлы изображений** сайта

## 🔧 Как это работает

### 📊 Текущие настройки CASCADE в моделях:

```python
# ✅ УЖЕ НАСТРОЕНО: Автоматическое каскадное удаление
Post.site → on_delete=models.CASCADE
Category.site → on_delete=models.CASCADE  
Tag.site → on_delete=models.CASCADE
Page.site → on_delete=models.CASCADE
DynamicModel.site → on_delete=models.CASCADE

# ⚠️ ЗАЩИЩЕНО: Пользователи не удаляются
CustomUser.site → on_delete=models.SET_NULL
```

### 🎯 Дополнительные возможности:

1. **Сигналы Django** - автоматическое логирование и очистка файлов
2. **Транзакции** - безопасность операций (откат при ошибке)
3. **API endpoints** - удаление через REST API
4. **Management команда** - удаление через консоль

---

## 🚀 Способы использования

### 1. 🌐 Через API (Рекомендуется для frontend)

#### Предварительный просмотр удаления:
```bash
GET /api/sites/{id}/delete_preview/
```

**Ответ:**
```json
{
  "site_info": {
    "name": "Мой сайт",
    "domain": "example.com",
    "owner": "admin",
    "created_at": "2024-01-01T00:00:00Z",
    "is_active": true
  },
  "to_be_deleted": {
    "posts": 25,
    "pages": 8,
    "categories": 5,
    "tags": 15,
    "dynamic_models": 2
  },
  "users_affected": {
    "assigned_users": 3,
    "assigned_users_list": [
      {"id": 1, "username": "author1", "email": "author1@example.com"},
      {"id": 2, "username": "author2", "email": "author2@example.com"}
    ]
  },
  "warnings": [
    "Большое количество контента (55 объектов)",
    "3 пользователей потеряют доступ"
  ]
}
```

#### Каскадное удаление:
```bash
DELETE /api/sites/{id}/cascade_delete/
```

**Ответ:**
```json
{
  "message": "Сайт \"Мой сайт\" успешно удален со всеми зависимостями",
  "deleted_stats": {
    "posts": 25,
    "pages": 8,
    "categories": 5,
    "tags": 15,
    "dynamic_models": 2,
    "assigned_users_cleared": 3
  }
}
```

### 2. 💻 Через Management команду

#### Предварительный просмотр:
```bash
python3 manage.py delete_site_cascade 1 --dry-run
```

**Вывод:**
```
📋 ИНФОРМАЦИЯ О САЙТЕ:
   Название: Мой сайт
   Домен: example.com
   Владелец: admin

🗑️  БУДЕТ УДАЛЕНО:
   📝 Постов: 25
   📄 Страниц: 8
   📂 Категорий: 5
   🏷️  Тегов: 15
   🔧 Динамических моделей: 2
   👥 Будет очищено связей с пользователями: 3

   📊 ВСЕГО ОБЪЕКТОВ: 55

✅ Dry-run режим: ничего не удалено
```

#### Удаление с подтверждением:
```bash
python3 manage.py delete_site_cascade 1
```

#### Удаление без подтверждения:
```bash
python3 manage.py delete_site_cascade 1 --force
```

### 3. 🐍 Программно через Python

```python
from apps.sites.signals import cascade_delete_site_with_transaction

# Безопасное удаление в транзакции
result = cascade_delete_site_with_transaction(site_id=1)

if result['success']:
    print(f"Удален сайт: {result['site_name']}")
    print(f"Удалено постов: {result['posts_deleted']}")
    print(f"Удалено страниц: {result['pages_deleted']}")
else:
    print(f"Ошибка: {result['error']}")
```

### 4. 🔧 Обычное удаление через Django ORM

```python
# Простое удаление (также работает каскадно благодаря настройкам)
site = Site.objects.get(id=1)
site.delete()  # Автоматически удалит все связанные объекты
```

---

## 🔒 Безопасность и разрешения

### Кто может удалять сайты:

- ✅ **Суперпользователь** - может удалить любой сайт
- ✅ **Владелец сайта** - может удалить только свои сайты
- ❌ **Авторы** - НЕ могут удалять сайты
- ❌ **Обычные пользователи** - НЕ могут удалять сайты

### Проверки безопасности:

```python
# API автоматически проверяет права
if user_role not in [Role.SUPERUSER] and site.owner != request.user:
    return Response({'error': 'У вас нет прав для удаления этого сайта'}, 
                   status=403)
```

---

## ⚠️ Предупреждения и ограничения

### 🚨 Автоматические предупреждения:

1. **Большое количество контента** (>50 объектов)
2. **Назначенные пользователи** потеряют доступ
3. **Последний сайт владельца** - владелец останется без сайтов

### 🛡️ Защитные механизмы:

1. **Транзакции** - откат при ошибке
2. **Логирование** - полная история операций
3. **Подтверждение** - требуется ввод 'DELETE'
4. **Dry-run режим** - предварительный просмотр

### ❌ Что НЕ удаляется:

- **Пользователи** - остаются в системе (связь site обнуляется)
- **Роли** - глобальные роли не затрагиваются
- **Логи системы** - сохраняются для аудита

---

## 📊 Мониторинг и логирование

### Просмотр логов:

```bash
# В development
tail -f logs/django.log | grep "удаление сайта"

# В production 
grep "cascade_delete" /var/log/django/app.log
```

### Примеры логов:

```
INFO Начинается удаление сайта: Мой сайт (ID: 1)
INFO Будут удалены связанные объекты: {'posts': 25, 'pages': 8, 'categories': 5, 'tags': 15, 'dynamic_models': 2}
INFO Очищаем связи с 3 назначенными пользователями
WARNING Удаляется последний сайт пользователя admin. Пользователь останется без сайтов.
INFO Сайт удален: Мой сайт (ID: 1)
INFO Удалены файлы: ['/media/sites/icons/icon.jpg', '/media/sites/main/hero.jpg']
INFO Каскадное удаление сайта Мой сайт завершено успешно
```

---

## 🧪 Тестирование

### Запуск тестов:

```bash
# Тесты каскадного удаления
python3 manage.py test apps.sites.tests_cascade_delete -v 2

# Все тесты сайтов
python3 manage.py test apps.sites -v 2
```

### Покрытие тестами:

- ✅ Удаление всех зависимостей
- ✅ Очистка связей M2M с пользователями  
- ✅ Сохранение пользователей (SET_NULL)
- ✅ Обработка ошибок и откат транзакций
- ✅ Удаление пустых сайтов
- ✅ Сравнение с обычным удалением

---

## 🚀 Frontend интеграция

### React/TypeScript пример:

```typescript
import { sitesStore } from '../store/sitesStore';

// Предварительный просмотр
const previewDelete = async (siteId: number) => {
  const preview = await sitesStore.getDeletePreview(siteId);
  
  // Показываем предупреждения пользователю
  if (preview.warnings.length > 0) {
    setWarnings(preview.warnings);
  }
  
  setDeleteStats(preview.to_be_deleted);
  setAffectedUsers(preview.users_affected.assigned_users_list);
};

// Каскадное удаление
const cascadeDelete = async (siteId: number) => {
  try {
    const result = await sitesStore.cascadeDelete(siteId);
    
    showSuccess(`Сайт удален. Удалено объектов: ${
      Object.values(result.deleted_stats).reduce((a, b) => a + b, 0)
    }`);
    
    // Обновляем список сайтов
    await sitesStore.fetchSites();
    
  } catch (error) {
    showError('Ошибка при удалении сайта');
  }
};
```

### Компонент подтверждения:

```tsx
const DeleteSiteModal = ({ site, onConfirm, onCancel }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (site) {
      loadPreview();
    }
  }, [site]);

  const loadPreview = async () => {
    const data = await sitesStore.getDeletePreview(site.id);
    setPreview(data);
  };

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(site.id);
    setLoading(false);
  };

  if (!preview) return <Spinner />;

  return (
    <Modal>
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          ⚠️ Каскадное удаление сайта
        </h2>
        
        <div className="mb-4">
          <p><strong>Сайт:</strong> {preview.site_info.name}</p>
          <p><strong>Домен:</strong> {preview.site_info.domain}</p>
        </div>

        <div className="bg-red-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Будет удалено:</h3>
          <ul className="space-y-1">
            <li>📝 Постов: {preview.to_be_deleted.posts}</li>
            <li>📄 Страниц: {preview.to_be_deleted.pages}</li>
            <li>📂 Категорий: {preview.to_be_deleted.categories}</li>
            <li>🏷️ Тегов: {preview.to_be_deleted.tags}</li>
            <li>🔧 Динамических моделей: {preview.to_be_deleted.dynamic_models}</li>
          </ul>
        </div>

        {preview.warnings.length > 0 && (
          <div className="bg-yellow-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">⚠️ Предупреждения:</h3>
            <ul className="space-y-1">
              {preview.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-800">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            {loading ? 'Удаление...' : 'Подтвердить удаление'}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Отмена
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 📚 Дополнительные ресурсы

### Файлы системы:

- `backend/apps/sites/signals.py` - Сигналы и основная логика
- `backend/apps/sites/views.py` - API endpoints
- `backend/apps/sites/management/commands/delete_site_cascade.py` - Management команда
- `backend/apps/sites/tests_cascade_delete.py` - Тесты

### Связанная документация:

- `COMPONENTS.md` - Описание моделей и связей
- `API_SUMMARY.md` - Полный список API endpoints  
- `TROUBLESHOOTING.md` - Устранение проблем

---

## ❓ FAQ

**Q: Можно ли восстановить удаленный сайт?**
A: Нет, каскадное удаление необратимо. Используйте dry-run для предварительного просмотра.

**Q: Что происходит с файлами пользователей?**
A: Все файлы сайта (изображения, uploads) удаляются автоматически через сигналы.

**Q: Можно ли удалить сайт частично?**
A: Нет, система удаляет сайт полностью. Для частичного удаления используйте стандартные CRUD операции.

**Q: Что если операция удаления прервется?**
A: Транзакция автоматически откатится, данные останутся нетронутыми.

**Q: Как удалить несколько сайтов сразу?**
A: Используйте цикл с `cascade_delete_site_with_transaction()` или создайте bulk операцию.

---

> ⚠️ **ВАЖНО:** Каскадное удаление необратимо! Всегда используйте `--dry-run` или API предварительного просмотра перед реальным удалением. 