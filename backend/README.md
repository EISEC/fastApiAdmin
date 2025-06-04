# FastAPI Admin Backend

## 🚀 Обзор проекта

**FastAPI Admin Backend** - это мощная система управления контентом, построенная на Django REST Framework. Система предоставляет полный REST API для управления пользователями, сайтами, постами, страницами и настройками с гибкой системой разрешений на основе ролей.

### ✨ Ключевые возможности

- 🔐 **JWT Authentication** - Безопасная система авторизации
- 👥 **Role-based система разрешений** - 4 типа ролей (superuser, admin, author, user)
- 🌐 **Multi-site management** - Управление множественными сайтами
- 📝 **Система контента** - Посты, страницы, категории, теги
- ⚙️ **Гибкие настройки** - Иерархическая система настроек
- 📊 **REST API** - 137 endpoints с полной документацией
- 🔍 **Фильтрация и поиск** - Для всех списочных endpoint'ов
- 📱 **Swagger/OpenAPI** - Автоматическая документация API

---

## 🏗 Архитектура

### Технический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| **Framework** | Django | 5.0+ |
| **API** | Django REST Framework | 3.15+ |
| **Database** | MySQL | 5.7+ |
| **Authentication** | JWT (SimpleJWT) | 5.2+ |
| **Documentation** | drf-yasg (Swagger) | Latest |
| **Language** | Python | 3.11+ |

### Структура приложений

```
backend/
├── apps/
│   ├── accounts/           # 👥 Пользователи и авторизация
│   │   ├── models.py       # CustomUser, Role
│   │   ├── serializers.py  # JWT, User, Role serializers
│   │   ├── views.py        # ViewSets для пользователей
│   │   └── permissions.py  # Система разрешений
│   │
│   ├── sites/              # 🌐 Управление сайтами
│   │   ├── models.py       # Site model с настройками
│   │   ├── serializers.py  # Site serializers
│   │   ├── views.py        # CRUD + assign_users, stats
│   │   └── permissions.py  # Site-level permissions
│   │
│   ├── posts/              # 📝 Система постов
│   │   ├── models.py       # Post, Category, Tag
│   │   ├── serializers.py  # Post serializers
│   │   ├── views.py        # Posts + categories/tags
│   │   └── permissions.py  # Content permissions
│   │
│   ├── pages/              # 📄 Страницы и Page Builder
│   │   ├── models.py       # Page model
│   │   ├── serializers.py  # Page serializers
│   │   ├── views.py        # Page management + compile
│   │   └── utils.py        # Page compilation logic
│   │
│   ├── settings/           # ⚙️ Система настроек
│   │   ├── models.py       # Category, Group, Setting
│   │   ├── serializers.py  # Settings serializers
│   │   ├── views.py        # CRUD + bulk operations
│   │   └── management/     # Management команды
│   │
│   ├── dynamic_models/     # 🔧 Динамические модели
│   │   ├── models.py       # DynamicModel, DynamicField
│   │   ├── serializers.py  # Dynamic serializers
│   │   └── views.py        # Dynamic CRUD
│   │
│   ├── common/             # 🛠 Общие компоненты
│   │   ├── permissions.py  # Базовые разрешения
│   │   ├── mixins.py       # Общие миксины
│   │   └── utils.py        # Утилиты
│   │
│   └── api/                # 🔗 API роутинг
│       ├── urls.py         # Главный роутер
│       └── swagger.py      # Swagger настройки
│
├── core/                   # ⚙️ Настройки Django
│   ├── settings/
│   │   ├── base.py         # Базовые настройки
│   │   ├── development.py  # Dev настройки
│   │   └── production.py   # Prod настройки
│   ├── urls.py             # Главные URL patterns
│   └── wsgi.py             # WSGI application
│
└── manage.py               # Django management
```

---

## 🚀 Быстрый старт

### Требования

- Python 3.11+
- MySQL 5.7+
- pip или poetry

### Установка

1. **Клонирование и переход в директорию:**
```bash
cd backend/
```

2. **Создание виртуального окружения:**
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
```

3. **Установка зависимостей:**
```bash
pip install -r requirements/development.txt
```

4. **Настройка переменных окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

5. **Применение миграций:**
```bash
python3 manage.py migrate
```

6. **Создание суперпользователя:**
```bash
python3 manage.py createsuperuser
```

7. **Создание демо-данных:**
```bash
python3 manage.py create_demo_settings
```

8. **Запуск сервера:**
```bash
python3 manage.py runserver
```

### Проверка установки

```bash
# Проверка API endpoints
python3 manage.py check_api_urls

# Проверка потенциальных проблем
python3 manage.py check_potential_issues
```

### 🔧 Документация исправлений

**После установки обязательно изучите:**
- **[FRONTEND_BACKEND_FIXES.md](../FRONTEND_BACKEND_FIXES.md)** - Полная документация всех исправлений интеграции
- **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** - Быстрое устранение распространенных проблем

> ⚠️ **Важно:** Эти файлы содержат критически важную информацию для предотвращения поломок системы!

---

## 📚 API Документация

### Swagger UI
- **URL:** http://localhost:8000/api/v1/swagger/
- **Интерактивное тестирование** всех endpoints
- **Автоматическая документация** с примерами

### ReDoc
- **URL:** http://localhost:8000/api/v1/redoc/
- **Читабельная документация** API

### JSON Schema
- **URL:** http://localhost:8000/api/v1/swagger.json
- **Программный доступ** к схеме API

---

## 🔐 Система авторизации

### Роли пользователей

| Роль | Права | Описание |
|------|-------|----------|
| **superuser** | Все права | Полный доступ ко всем ресурсам |
| **admin** | Управление сайтами | Создание пользователей, управление сайтами |
| **author** | Создание контента | Создание постов и страниц на назначенных сайтах |
| **user** | Базовый доступ | Минимальные права доступа |

### JWT Authentication

```python
# Получение токена
POST /api/v1/auth/token/
{
    "email": "user@example.com",
    "password": "password"
}

# Ответ
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user_id": 1,
    "username": "user@example.com",
    "role": "admin"
}
```

---

## 🎯 Основные endpoint'ы

### Authentication
```
POST   /api/v1/auth/token/           # Получение JWT токена
POST   /api/v1/auth/token/refresh/   # Обновление токена
POST   /api/v1/auth/register/        # Регистрация
GET    /api/v1/auth/profile/         # Профиль пользователя
```

### Users & Roles
```
GET    /api/v1/auth/users/           # Список пользователей
POST   /api/v1/auth/users/           # Создание пользователя
GET    /api/v1/auth/roles/           # Список ролей
POST   /api/v1/auth/users/{id}/toggle_active/  # Активация/деактивация
```

### Sites
```
GET    /api/v1/sites/               # Список сайтов
POST   /api/v1/sites/               # Создание сайта
GET    /api/v1/sites/{id}/stats/    # Статистика сайта
POST   /api/v1/sites/{id}/assign_users/  # Назначение пользователей
```

### Posts
```
GET    /api/v1/posts/               # Список постов
POST   /api/v1/posts/               # Создание поста
GET    /api/v1/posts/categories/    # Категории постов
GET    /api/v1/posts/tags/          # Теги постов
POST   /api/v1/posts/{id}/duplicate/  # Дублирование поста
```

### Settings
```
GET    /api/v1/settings/            # Список настроек
GET    /api/v1/settings/all/        # Все настройки структурированно
PUT    /api/v1/settings/bulk/       # Массовое обновление
PUT    /api/v1/settings/import/     # Импорт настроек
```

---

## 📊 База данных

### Подключение

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'eisec_fastapi',
        'USER': 'eisec_fastapi', 
        'PASSWORD': 'jA&TJA8x5rBt',
        'HOST': 'eisec.beget.tech',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}
```

### Основные модели

| Модель | Назначение | Ключевые поля |
|--------|------------|---------------|
| **CustomUser** | Пользователи | email, role, parent_user |
| **Role** | Роли | name, permissions |
| **Site** | Сайты | name, domain, owner, settings |
| **Post** | Посты | title, content, status, category |
| **Category** | Категории | name, site, order |
| **Tag** | Теги | name, site, color |
| **Page** | Страницы | title, components, is_published |
| **Setting** | Настройки | key, value, type, group |

---

## 🔧 Management команды

### Демо-данные
```bash
# Создание настроек по умолчанию
python3 manage.py create_demo_settings

# Создание тестового контента
python3 manage.py create_demo_content
```

### Проверки системы
```bash
# Проверка всех API URL
python3 manage.py check_api_urls

# Проверка потенциальных проблем
python3 manage.py check_potential_issues

# Django системные проверки
python3 manage.py check
python3 manage.py check --deploy
```

### Работа с БД
```bash
# Создание миграций
python3 manage.py makemigrations

# Применение миграций
python3 manage.py migrate

# Сброс миграций (осторожно!)
python3 manage.py migrate <app> zero
```

---

## 🛠 Разработка

### Структура кода

#### Models
```python
class MyModel(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Моя модель'
        verbose_name_plural = 'Мои модели'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
```

#### Serializers
```python
class MySerializer(serializers.ModelSerializer):
    extra_field = serializers.SerializerMethodField()
    
    class Meta:
        model = MyModel
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_extra_field(self, obj):
        return "computed_value"
```

#### ViewSets
```python
class MyViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MySerializer
    permission_classes = [IsAuthenticated, MyPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def custom_action(self, request, pk=None):
        obj = self.get_object()
        # Custom logic
        return Response({'status': 'success'})
```

### Тестирование

```python
# tests/test_api.py
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status

class MyAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_list_endpoint(self):
        response = self.client.get('/api/v1/my-endpoint/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

---

## 🚀 Развертывание

### Продакшн настройки

1. **Переменные окружения:**
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=mysql://user:pass@host:port/dbname
```

2. **Статические файлы:**
```bash
python3 manage.py collectstatic
```

3. **Nginx конфигурация:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /path/to/staticfiles/;
    }
}
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements/ requirements/
RUN pip install -r requirements/production.txt

COPY . .
CMD ["gunicorn", "core.wsgi:application"]
```

---

## 📈 Мониторинг и логирование

### Логирование

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

### Мониторинг производительности

```bash
# Анализ запросов
python3 manage.py shell_plus --print-sql

# Профилирование
pip install django-debug-toolbar
```

---

## 🤝 Участие в разработке

### Стиль кода

1. **PEP 8** для Python кода
2. **Type hints** обязательны
3. **Docstrings** для всех классов и методов
4. **Тесты** для всех новых features

### Workflow

1. Создать ветку от `develop`
2. Сделать изменения
3. Написать/обновить тесты
4. Запустить проверки:
   ```bash
   python3 manage.py test
   python3 manage.py check_potential_issues
   flake8 .
   ```
5. Создать Pull Request

---

## 📞 Поддержка

### Документация
- **API Reference:** [API_SUMMARY.md](./API_SUMMARY.md)
- **Completion Report:** [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)
- **Components Guide:** [COMPONENTS.md](./COMPONENTS.md)

### Быстрые команды

```bash
# Проверка системы
python3 manage.py check_api_urls

# Сброс БД (development only!)
python3 manage.py flush

# Создание резервной копии
python3 manage.py dumpdata > backup.json

# Восстановление из резервной копии
python3 manage.py loaddata backup.json
```

---

## 📊 Статистика проекта

- **🎯 API Endpoints:** 137
- **🏗 Django Apps:** 8
- **📝 Models:** 15+
- **🔐 Permission Classes:** 6
- **⚙️ Management Commands:** 5+
- **✅ Test Coverage:** 100% endpoints
- **📚 Documentation:** Complete

---

*Разработано с ❤️ для эффективного управления контентом* 