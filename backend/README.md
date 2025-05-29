# FastAPI Admin - Backend (Django)

Это backend часть системы управления сайтами, построенная на Django 5.0 с использованием Django REST Framework.

## Архитектура

### Технологический стек

- **Django 5.0** - основной фреймворк
- **Django REST Framework 3.15** - для создания API
- **MySQL 5.7+** - основная база данных
- **JWT Authentication** - для авторизации
- **Celery + Redis** - для фоновых задач
- **Docker** - для контейнеризации

### Структура проекта

```
backend/
├── core/                   # Основные настройки Django
│   ├── settings/          # Настройки для разных окружений
│   ├── urls.py           # Главные URL маршруты
│   ├── wsgi.py           # WSGI конфигурация
│   └── asgi.py           # ASGI конфигурация
├── apps/                  # Django приложения
│   ├── accounts/         # Пользователи и роли
│   ├── sites/            # Управление сайтами
│   ├── posts/            # Посты
│   ├── pages/            # Страницы
│   ├── dynamic_models/   # Динамические модели
│   ├── common/           # Общие компоненты
│   └── api/              # API endpoints
├── media/                # Загруженные файлы
├── static/               # Статические файлы
├── templates/            # Шаблоны (включая админку)
├── logs/                 # Логи приложения
├── requirements/         # Зависимости по окружениям
└── manage.py             # Django management скрипт
```

## Установка и настройка

### 1. Клонирование и настройка окружения

```bash
# Клонирование репозитория
git clone <repository-url>
cd fastApiAdmin/backend

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# или
venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -r requirements/development.txt
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне backend проекта:

```bash
# Django Environment
DJANGO_ENVIRONMENT=development
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Configuration
DB_NAME=eisec_fastapi
DB_USER=eisec_fastapi
DB_PASSWORD=jA&TJA8x5rBt
DB_HOST=eisec.beget.tech
DB_PORT=3306

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Redis/Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
REDIS_URL=redis://localhost:6379/1

# Email Configuration
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

### 3. Настройка базы данных

Убедитесь, что MySQL сервер запущен и доступна база данных с указанными в .env учетными данными.

```bash
# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Загрузка начальных данных (если есть)
python manage.py loaddata fixtures/initial_data.json
```

### 4. Создание начальных ролей

```bash
# Запуск Django shell
python manage.py shell

# Создание ролей
from apps.accounts.models import Role

# Создание всех ролей
roles_data = [
    {'name': 'superuser', 'permissions': {}},
    {'name': 'admin', 'permissions': {}},
    {'name': 'author', 'permissions': {}},
    {'name': 'user', 'permissions': {}},
]

for role_data in roles_data:
    role, created = Role.objects.get_or_create(name=role_data['name'], defaults=role_data)
    if created:
        print(f"Роль {role.name} создана")
    else:
        print(f"Роль {role.name} уже существует")
```

## Запуск проекта

### Режим разработки

```bash
# Активация виртуального окружения
source venv/bin/activate

# Запуск сервера разработки
python manage.py runserver 8000

# В отдельном терминале - запуск Celery (если нужен)
celery -A core worker -l info

# В третьем терминале - запуск Celery Beat (планировщик задач)
celery -A core beat -l info
```

Сервер будет доступен по адресу: http://localhost:8000

### API Документация

- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/
- **Django Admin**: http://localhost:8000/admin/

## Основные модели

### 1. Пользователи и роли (accounts)

- **Role** - роли пользователей (superuser, admin, author, user)
- **CustomUser** - кастомная модель пользователя с дополнительными полями

### 2. Сайты (sites)

- **Site** - модель сайта с настройками, изображениями и SEO

### 3. Контент (posts, pages)

- **Post** - модель поста с SEO полями и автоматической генерацией slug
- **Page** - модель страницы с поддержкой визуального конструктора

### 4. Динамические модели (dynamic_models)

- **DynamicModel** - конфигурация динамических моделей
- **DynamicModelData** - данные динамических моделей

## Система разрешений

Проект использует роле-ориентированную систему разрешений:

1. **Superuser** - полный доступ ко всему
2. **Admin** - управление своими сайтами и создание авторов
3. **Author** - создание контента на назначенных сайтах
4. **User** - базовые права просмотра

## API Endpoints

### Аутентификация

- `POST /api/auth/login/` - вход в систему
- `POST /api/auth/register/` - регистрация
- `POST /api/auth/refresh/` - обновление токена

### Основные ресурсы

- `GET|POST /api/sites/` - список сайтов / создание сайта
- `GET|PUT|DELETE /api/sites/{id}/` - управление сайтом
- `GET|POST /api/posts/` - список постов / создание поста
- `GET|PUT|DELETE /api/posts/{id}/` - управление постом
- `GET|POST /api/pages/` - список страниц / создание страницы
- `GET|PUT|DELETE /api/pages/{id}/` - управление страницей
- `GET|POST /api/users/` - список пользователей / создание пользователя
- `GET|PUT|DELETE /api/users/{id}/` - управление пользователем

### Динамические модели

- `GET|POST /api/dynamic-models/` - управление динамическими моделями
- `GET|POST /api/dynamic-models/{id}/data/` - данные динамических моделей

## Разработка

### Запуск тестов

```bash
# Все тесты
python manage.py test

# Тесты конкретного приложения
python manage.py test apps.accounts

# С покрытием кода
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Проверка кода

```bash
# Форматирование кода
black .

# Проверка импортов
isort .

# Линтинг
flake8 .

# Проверка безопасности
bandit -r apps/
```

### Создание новых миграций

```bash
# После изменения моделей
python manage.py makemigrations

# Применение миграций
python manage.py migrate

# Создание пустой миграции для data migration
python manage.py makemigrations --empty app_name
```

## Docker

### Сборка и запуск

```bash
# Сборка образа
docker build -t fastapi-admin-backend .

# Запуск с docker-compose
docker-compose up -d

# Просмотр логов
docker-compose logs -f backend
```

## Производство

### Настройки для продакшена

1. Установите `DJANGO_ENVIRONMENT=production` в переменных окружения
2. Настройте SSL сертификаты
3. Используйте gunicorn для запуска
4. Настройте nginx как reverse proxy
5. Настройте мониторинг и логирование

### Запуск с gunicorn

```bash
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

## Устранение проблем

### Ошибки подключения к MySQL

1. Убедитесь, что MySQL сервер запущен
2. Проверьте правильность учетных данных в .env
3. Убедитесь, что база данных существует
4. Проверьте права доступа пользователя MySQL

### Ошибки с Redis

1. Установите и запустите Redis сервер
2. Проверьте URL подключения в настройках Celery

### Проблемы с миграциями

```bash
# Сброс миграций (осторожно!)
python manage.py migrate apps_name zero
python manage.py makemigrations apps_name
python manage.py migrate apps_name

# Показать статус миграций
python manage.py showmigrations
```

## Дополнительные ресурсы

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery Documentation](https://docs.celeryproject.org/)

## Лицензия

[Укажите лицензию проекта] 