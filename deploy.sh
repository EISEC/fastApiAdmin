#!/bin/bash

# Скрипт деплоя на Beget хостинг
echo "🚀 Начинаем деплой на Beget..."

# 1. Собираем frontend
echo "📦 Сборка frontend..."
cd frontend
yarn install --frozen-lockfile
yarn build
cd ..

# 2. Собираем статические файлы Django
echo "📦 Сборка статических файлов backend..."
cd backend
python3 -m pip install -r requirements/production.txt
python3 manage.py collectstatic --noinput --settings=core.settings.production

# 3. Применяем миграции
echo "🗄️ Применение миграций..."
python3 manage.py migrate --settings=core.settings.production

# 4. Создаем суперпользователя (если нужно)
echo "👤 Проверка суперпользователя..."
python3 manage.py createsuperuser --noinput --settings=core.settings.production || echo "Суперпользователь уже существует"

# 5. Проверяем готовность к деплою
echo "🔍 Проверка готовности к деплою..."
python3 manage.py check --deploy --settings=core.settings.production

echo "✅ Деплой подготовлен! Теперь загрузите файлы на Beget."
echo ""
echo "📋 Файлы для загрузки:"
echo "   - backend/* (код Django)"
echo "   - frontend/dist/* (собранный frontend)"
echo "   - .htaccess"
echo "   - cgi-bin/main.fcgi"
echo ""
echo "⚠️  Не забудьте:"
echo "   1. Настроить переменные окружения на сервере"
echo "   2. Обновить пути в .htaccess и main.fcgi"
echo "   3. Установить права 755 на main.fcgi"
echo "   4. Создать папки staticfiles и media"

cd .. 