#!/usr/bin/env python3
"""
Тестовый скрипт для проверки загрузки файлов в Yandex Object Storage
"""

import os
import sys
import django
import requests
import json
from pathlib import Path

# Добавляем путь к Django проекту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

# Инициализируем Django
django.setup()

from django.conf import settings
from django.core.files.storage import default_storage
from django.test import Client
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
import tempfile
from PIL import Image
import io

User = get_user_model()

def create_test_image():
    """Создает тестовое изображение"""
    # Создаем простое изображение 100x100 пикселей
    img = Image.new('RGB', (100, 100), color='red')
    
    # Сохраняем в байты
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes.getvalue(), 'test_image.jpg'

def test_storage_settings():
    """Проверяем настройки хранилища"""
    print("🔍 Проверка настроек хранилища...")
    
    print(f"AWS_ACCESS_KEY_ID: {'✅ Установлен' if getattr(settings, 'AWS_ACCESS_KEY_ID', None) else '❌ Не установлен'}")
    print(f"AWS_SECRET_ACCESS_KEY: {'✅ Установлен' if getattr(settings, 'AWS_SECRET_ACCESS_KEY', None) else '❌ Не установлен'}")
    print(f"AWS_STORAGE_BUCKET_NAME: {getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'Не установлен')}")
    print(f"AWS_S3_ENDPOINT_URL: {getattr(settings, 'AWS_S3_ENDPOINT_URL', 'Не установлен')}")
    print(f"AWS_S3_REGION_NAME: {getattr(settings, 'AWS_S3_REGION_NAME', 'Не установлен')}")
    print(f"DEFAULT_FILE_STORAGE: {getattr(settings, 'DEFAULT_FILE_STORAGE', 'Не установлен')}")
    print(f"MEDIA_URL: {getattr(settings, 'MEDIA_URL', 'Не установлен')}")
    print()

def test_direct_storage():
    """Тестируем прямое сохранение файла через Django storage"""
    print("📁 Тестирование прямого сохранения через Django storage...")
    
    try:
        # Создаем тестовый файл
        img_data, filename = create_test_image()
        
        # Создаем временный файл
        from django.core.files.base import ContentFile
        file_content = ContentFile(img_data, name=filename)
        
        # Сохраняем файл
        saved_path = default_storage.save(f'test/{filename}', file_content)
        file_url = default_storage.url(saved_path)
        
        print(f"✅ Файл сохранен: {saved_path}")
        print(f"✅ URL файла: {file_url}")
        
        # Проверяем существование файла
        if default_storage.exists(saved_path):
            print("✅ Файл существует в хранилище")
            
            # Удаляем тестовый файл
            default_storage.delete(saved_path)
            print("✅ Тестовый файл удален")
        else:
            print("❌ Файл не найден в хранилище")
            
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании storage: {e}")
        return False

def test_api_upload():
    """Тестируем API endpoint для загрузки файлов"""
    print("🌐 Тестирование API endpoint /api/v1/files/upload-to-cloud/...")
    
    try:
        # Создаем тестового пользователя
        role, _ = Role.objects.get_or_create(name='superuser', defaults={'description': 'Superuser role'})
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={
                'email': 'test@example.com',
                'role': role
            }
        )
        
        # Создаем клиента и авторизуемся
        client = Client()
        client.force_login(user)
        
        # Создаем тестовое изображение
        img_data, filename = create_test_image()
        
        # Создаем файл для загрузки
        from django.core.files.uploadedfile import SimpleUploadedFile
        uploaded_file = SimpleUploadedFile(
            filename,
            img_data,
            content_type='image/jpeg'
        )
        
        # Отправляем POST запрос
        response = client.post('/api/v1/files/upload-to-cloud/', {
            'file': uploaded_file,
            'site_id': '1'
        })
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Файл загружен успешно!")
            print(f"   URL: {data.get('url')}")
            print(f"   Path: {data.get('path')}")
            print(f"   Name: {data.get('name')}")
            print(f"   Size: {data.get('size')} bytes")
            
            # Проверяем что файл доступен по URL
            file_url = data.get('url')
            if file_url:
                try:
                    # Для локального хранилища URL может быть относительным
                    if file_url.startswith('/'):
                        print("📝 Локальное хранилище - файл сохранен в /media/")
                    else:
                        # Проверяем доступность файла по URL
                        head_response = requests.head(file_url, timeout=10)
                        if head_response.status_code == 200:
                            print("✅ Файл доступен по URL")
                        else:
                            print(f"⚠️ Файл не доступен по URL (код: {head_response.status_code})")
                except Exception as e:
                    print(f"⚠️ Не удалось проверить доступность файла: {e}")
            
            return True
        else:
            print(f"❌ Ошибка загрузки: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании API: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование системы загрузки файлов в Yandex Object Storage")
    print("=" * 70)
    
    # Проверяем настройки
    test_storage_settings()
    
    # Тестируем прямое сохранение
    storage_test = test_direct_storage()
    print()
    
    # Тестируем API
    api_test = test_api_upload()
    print()
    
    # Итоговый результат
    print("=" * 70)
    if storage_test and api_test:
        print("🎉 Все тесты прошли успешно!")
        print("✅ Система загрузки файлов работает корректно")
    else:
        print("⚠️ Некоторые тесты не прошли")
        if not storage_test:
            print("❌ Проблемы с настройкой хранилища")
        if not api_test:
            print("❌ Проблемы с API endpoint")

if __name__ == '__main__':
    main() 