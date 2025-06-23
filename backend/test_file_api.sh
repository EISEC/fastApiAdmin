#!/bin/bash

# Тест загрузки файла в динамическую модель через API

echo "=== Тест загрузки файла в динамическую модель ==="

# Создаем тестовый файл
echo "Создаем тестовый файл..."
echo "Test file content for dynamic model" > test_file.txt

# Получаем токен авторизации (замените на актуальный)
# TOKEN="your_jwt_token_here"

echo "Отправляем файл через API..."

# Отправляем запрос с файлом
curl -X POST "http://localhost:8000/api/v1/dynamic-models/data/" \
  -H "Content-Type: multipart/form-data" \
  -F "dynamic_model=11" \
  -F "is_published=true" \
  -F "data.test_file=@test_file.txt" \
  -v

echo ""
echo "=== Результат теста ==="

# Удаляем тестовый файл
rm -f test_file.txt

echo "Тест завершен." 