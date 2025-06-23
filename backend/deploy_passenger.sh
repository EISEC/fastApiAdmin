#!/bin/bash

# 🚀 Скрипт развертывания Django на Passenger
# Автор: FastAPI Admin Team

echo "🚀 Начинаем развертывание Django приложения на Passenger..."

# Переходим в папку проекта
PROJECT_DIR="/home/e/eisec/admin.ifuw.ru/public_html"
cd "$PROJECT_DIR" || exit 1

echo "📂 Текущая директория: $(pwd)"

# Проверяем Python
echo "🐍 Проверяем Python..."
python3 --version

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
pip install --user -r requirements/production.txt

# Проверяем установленные зависимости
echo "🔍 Проверяем зависимости..."
python3 check_deps.py

# Выполняем миграции
echo "💾 Выполняем миграции БД..."
python manage.py migrate --settings=core.settings.production

# Проверяем настройки Django
echo "⚙️ Проверяем настройки Django..."
python manage.py check --settings=core.settings.production

# Собираем статические файлы
echo "📁 Собираем статические файлы..."
python manage.py collectstatic --settings=core.settings.production --noinput

# Создаем папку для restart.txt если не существует
echo "📂 Создаем папку tmp..."
mkdir -p tmp

# Перезапускаем Passenger
echo "🔄 Перезапускаем Passenger..."
touch tmp/restart.txt

echo "✅ Развертывание завершено!"
echo ""
echo "📋 Что дальше:"
echo "   1. Проверьте сайт в браузере"
echo "   2. Если есть ошибки, проверьте логи хостинга"
echo "   3. При необходимости создайте суперпользователя:"
echo "      python manage.py createsuperuser --settings=core.settings.production"
echo ""
echo "🔄 Для перезапуска в будущем используйте:"
echo "   touch tmp/restart.txt" 