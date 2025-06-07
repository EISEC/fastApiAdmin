# 🔧 Интеграция системы настроек

## 📋 Обзор

Система настроек полностью интегрирована между **backend** (Django) и **frontend** (React), обеспечивая:

- 🔐 **Доступ только для суперадминистраторов**
- 📊 **Реальные данные** из базы MySQL  
- 🔄 **Автоматическая синхронизация** изменений
- 💾 **Экспорт/Импорт** конфигураций
- 📝 **Шаблоны настроек**

---

## 🚨 ВАЖНО: Права доступа

### ✅ Доступ разрешен:
- **Только пользователям с ролью `superuser`**
- Проверка на backend через `SuperAdminOnlyPermission`
- Проверка на frontend через `user.role.name === 'superuser'`

### ❌ Доступ запрещен:
- Пользователи с ролями: `admin`, `author`, `user`
- Неавторизованные пользователи
- При отсутствии роли

---

## 🏗️ Архитектура

### Backend (Django)
```
backend/apps/settings/
├── models.py              # SettingCategory, SettingGroup, Setting, SettingTemplate
├── serializers.py         # Сериализаторы для API
├── views.py               # ViewSets с SuperAdminOnlyPermission
├── permissions.py         # Проверка прав суперадминистратора
├── urls.py                # API маршруты
└── management/commands/   # Команды для создания настроек
```

### Frontend (React)
```
frontend/src/
├── pages/Settings.tsx           # Главная страница настроек
├── store/settingsStore.ts       # Zustand store
├── services/settings.service.ts # API клиент
├── types/settings.types.ts      # TypeScript типы
└── components/settings/         # UI компоненты
```

---

## 📊 Модель данных

### Категории настроек (SettingCategory)
- **general** - Общие настройки
- **email** - Почтовые настройки  
- **seo** - SEO настройки
- **social** - Социальные сети
- **integrations** - Интеграции
- **security** - Безопасность
- **performance** - Производительность
- **appearance** - Внешний вид

### Группы настроек (SettingGroup)
Логические группы внутри категорий (например: "SMTP настройки", "Google Analytics")

### Настройки (Setting)
Конкретные параметры с типами:
- `string`, `text`, `number`, `boolean`
- `email`, `url`, `color`, `file`
- `select`, `multiselect`, `json`

---

## 🔌 API Endpoints

### Основные операции
```http
GET  /api/v1/settings/list_all/          # Получить все настройки
GET  /api/v1/settings/categories/        # Получить категории
PUT  /api/v1/settings/bulk_update/       # Массовое обновление
POST /api/v1/settings/export/            # Экспорт настроек
PUT  /api/v1/settings/import_data/       # Импорт настроек
```

### Шаблоны
```http
GET  /api/v1/settings/templates/         # Список шаблонов
POST /api/v1/settings/templates/         # Создать шаблон
POST /api/v1/settings/templates/{id}/apply/ # Применить шаблон
```

### Проверка прав доступа
Все endpoints проверяют права через `SuperAdminOnlyPermission`:
```python
def has_permission(self, request, view):
    return request.user.role.name == 'superuser'
```

---

## 🔄 Синхронизация данных

### Загрузка настроек
```typescript
// frontend/src/store/settingsStore.ts
fetchSettings: async () => {
  const backendSettings = await settingsService.getSettings();
  const settings = settingsService.transformBackendToFrontend(backendSettings);
  set({ settings });
}
```

### Сохранение изменений
```typescript
saveAllSettings: async () => {
  const updates = settingsService.transformFrontendToBackend(changedSettings);
  const result = await settingsService.updateSettings(updates);
  // Обновляем локальное состояние
}
```

### Преобразование данных
```typescript
// Backend → Frontend
transformBackendToFrontend(backendSettings: any[]): Setting[]

// Frontend → Backend  
transformFrontendToBackend(frontendUpdates: Record<string, any>): Array<{ key: string; value: any }>
```

---

## 🎨 UI/UX особенности

### Защита от случайного удаления
- Предупреждение при уходе со страницы с несохраненными изменениями
- Двухступенчатое подтверждение для критических операций
- Валидация данных перед сохранением

### Состояния загрузки
- Skeleton loader при первичной загрузке
- Индикаторы сохранения для каждой настройки
- Toast уведомления об успехе/ошибках

### Навигация по категориям
- Табы с индикаторами изменений
- Поиск и фильтрация настроек
- Быстрый переход между группами

---

## 🛠️ Настройка и развертывание

### 1. Backend настройки
```bash
# Создание базовых настроек
cd backend
python3 manage.py create_default_settings

# Проверка API endpoints
python3 manage.py check_api_urls | grep settings
```

### 2. Создание суперадминистратора
```bash
# Если нет пользователя с ролью superuser
python3 manage.py shell -c "
from apps.accounts.models import CustomUser, Role;
superuser_role = Role.objects.get(name='superuser');
user = CustomUser.objects.create_user(
  username='admin',
  email='admin@example.com', 
  password='admin123',
  role=superuser_role
);
print(f'Создан суперадминистратор: {user.username}')
"
```

### 3. Frontend интеграция
```typescript
// Проверка доступа в компоненте
if (!user || user.role.name !== 'superuser') {
  return <AccessDenied />;
}

// Загрузка данных
useEffect(() => {
  if (user?.role.name === 'superuser') {
    fetchSettings();
    fetchCategories();
  }
}, [user]);
```

---

## 🔧 Примеры использования

### Создание новой настройки
```python
# backend/apps/settings/management/commands/add_custom_setting.py
Setting.objects.create(
    key='site.custom_feature',
    label='Включить кастомную функцию',
    description='Описание функции',
    type='boolean',
    value='false',
    group=general_group,
    is_required=False,
    is_readonly=False
)
```

### Получение настройки в коде
```python
# В Django views/models
from apps.settings.models import Setting

def get_site_setting(key):
    try:
        setting = Setting.objects.get(key=key)
        return setting.get_value()
    except Setting.DoesNotExist:
        return None

# Использование
is_feature_enabled = get_site_setting('site.custom_feature')
```

### Использование в React
```typescript
// В компонентах
const { settings } = useSettingsStore();
const customFeature = settings.find(s => s.key === 'site.custom_feature');
const isEnabled = customFeature?.value === 'true';
```

---

## 📋 Checklist развертывания

### Backend
- [ ] Настройки созданы (`create_default_settings`)
- [ ] Права доступа настроены (`SuperAdminOnlyPermission`)
- [ ] API endpoints работают (`/api/v1/settings/`)
- [ ] Есть суперадминистратор в системе

### Frontend  
- [ ] Проверка роли пользователя работает
- [ ] Загрузка данных из API
- [ ] Сохранение изменений
- [ ] Экспорт/импорт функционирует
- [ ] UI отображается корректно

### Тестирование
- [ ] Авторизация работает для суперадминистратора
- [ ] Блокировка доступа для других ролей
- [ ] CRUD операции с настройками
- [ ] Валидация данных
- [ ] Обработка ошибок

---

## 🆘 Устранение проблем

### Проблема: "403 Forbidden" при доступе к настройкам
**Решение**: Проверить роль пользователя
```bash
python3 -c "
import django; django.setup()
from apps.accounts.models import CustomUser
user = CustomUser.objects.get(username='your_username')
print(f'Роль: {user.role.name}')
"
```

### Проблема: Настройки не загружаются
**Решение**: 
1. Проверить права доступа в `permissions.py`
2. Убедиться что настройки созданы в БД
3. Проверить URL endpoints

### Проблема: Ошибки валидации
**Решение**:
1. Проверить соответствие типов данных
2. Убедиться в корректности validation rules
3. Проверить трансформацию данных между frontend/backend

---

## 🎯 Результат

✅ **Полная интеграция настроек:**
- Backend API с Django + DRF  
- Frontend UI с React + TypeScript
- Права доступа только для суперадминистраторов
- Реальные данные из MySQL
- Экспорт/импорт конфигураций
- Система шаблонов
- Валидация и обработка ошибок

**Страница настроек доступна по адресу `/settings` только для пользователей с ролью `superuser`.** 