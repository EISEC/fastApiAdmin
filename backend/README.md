# FastAPI Admin

FastAPI Admin - это административная панель, построенная на FastAPI, которая предоставляет удобный интерфейс для управления сайтами, страницами, постами и динамическими моделями.

## Особенности

- Аутентификация и авторизация пользователей
- Управление ролями и правами доступа
- Управление сайтами и их настройками
- Управление страницами и постами
- Динамические модели для создания пользовательских типов данных
- RESTful API для всех операций
- Документация API с использованием Swagger UI

## Требования

- Python 3.8+
- MySQL 5.7+
- Node.js 14+ (для фронтенда)

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/fastapi-admin.git
cd fastapi-admin
```

2. Создайте виртуальное окружение и активируйте его:
```bash
python -m venv venv
source venv/bin/activate  # для Linux/Mac
venv\Scripts\activate  # для Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте файл `.env` на основе `.env.example` и настройте переменные окружения.

5. Создайте базу данных MySQL и примените миграции:
```bash
alembic upgrade head
```

6. Запустите сервер разработки:
```bash
uvicorn app.main:app --reload
```

## Использование

После запуска сервера, вы можете получить доступ к:

- API документации: http://localhost:8000/docs
- Альтернативной документации: http://localhost:8000/redoc
- API: http://localhost:8000/api/v1

## Разработка

### Структура проекта

```
backend/
├── alembic/              # Миграции базы данных
├── app/
│   ├── api/             # API endpoints
│   ├── core/            # Основные настройки
│   ├── crud/            # CRUD операции
│   ├── db/              # Настройки базы данных
│   ├── models/          # SQLAlchemy модели
│   └── schemas/         # Pydantic схемы
├── tests/               # Тесты
├── .env                 # Переменные окружения
├── .env.example         # Пример переменных окружения
├── requirements.txt     # Зависимости
└── README.md           # Документация
```

### Тестирование

Для запуска тестов:
```bash
pytest
```

## Лицензия

MIT 