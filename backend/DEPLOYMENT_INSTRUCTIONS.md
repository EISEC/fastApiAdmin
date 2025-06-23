# 🚀 Инструкция по развертыванию на продакшн сервере (Passenger)

## ❌ Проблема
```bash
ModuleNotFoundError: No module named 'requests'
```

## ✅ Решение для Passenger

### 1. Перейдите в директорию проекта на сервере:
```bash
cd /home/e/eisec/admin.ifuw.ru/public_html/
```

### 2. Установите все зависимости:
```bash
# Используйте --user если нет root прав
pip install --user -r requirements/production.txt

# Или без --user если есть права
pip install -r requirements/production.txt
```

### 3. Проверьте установленные зависимости:
```bash
python3 check_deps.py
```

### 4. После установки зависимостей выполните миграции:
```bash
python manage.py migrate --settings=core.settings.production
```

### 5. Соберите статические файлы:
```bash
python manage.py collectstatic --settings=core.settings.production --noinput
```

### 6. Перезапустите Passenger:
```bash
# Создайте/обновите файл для перезапуска Passenger
touch tmp/restart.txt

# Или если папка tmp не существует
mkdir -p tmp && touch tmp/restart.txt
```

## 📦 Обновленные зависимости

В `requirements/base.txt` добавлены:
- `requests==2.31.0` - для работы с HTTP API
- `python-dateutil==2.8.2` - для работы с датами

## 🔍 Проверка системы

Перед запуском проекта всегда выполняйте:
```bash
# Проверка зависимостей
python3 check_deps.py

# Проверка Django настроек
python manage.py check --settings=core.settings.production

# Миграции БД
python manage.py migrate --settings=core.settings.production
```

## 🛠️ Возможные проблемы

### 1. Ошибка с MySQL
```bash
# Установите MySQL клиент
pip install mysqlclient
```

### 2. Ошибка с Pillow
```bash
# Установите системные зависимости (Ubuntu/Debian)
sudo apt-get install libjpeg-dev zlib1g-dev
pip install Pillow
```

### 3. Проблемы с boto3/storages
```bash
pip install boto3 django-storages
```

## ✅ После успешного развертывания

1. Создайте суперпользователя (если нужно):
```bash
python manage.py createsuperuser --settings=core.settings.production
```

2. Проверьте работу приложения:
```bash
python manage.py check --settings=core.settings.production
```

## 🔄 Перезапуск Passenger

После любых изменений в коде или настройках:
```bash
cd /home/e/eisec/admin.ifuw.ru/public_html/
touch tmp/restart.txt
```

## 📁 Структура файлов для Passenger

Убедитесь, что файлы расположены правильно:
```
/home/e/eisec/admin.ifuw.ru/public_html/
├── passenger_wsgi.py          # ✅ Уже настроен
├── manage.py
├── core/
├── apps/
├── requirements/
├── tmp/                       # Папка для restart.txt
└── static/                    # Для статических файлов
```

## 🚨 Важно для Passenger

- **НЕ запускайте** `python manage.py runserver` на продакшне
- **Passenger автоматически** управляет процессами Django
- **Для перезапуска** используйте только `touch tmp/restart.txt`
- **Логи приложения** смотрите в панели хостинга или passenger.log 