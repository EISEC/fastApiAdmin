#!/usr/bin/env python3
import os
import sys
import django

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.conf import settings

print("🔍 Проверка настроек Yandex Object Storage:")
print("=" * 50)

# Проверяем основные настройки
aws_key = getattr(settings, 'AWS_ACCESS_KEY_ID', None)
aws_secret = getattr(settings, 'AWS_SECRET_ACCESS_KEY', None)
bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
endpoint_url = getattr(settings, 'AWS_S3_ENDPOINT_URL', None)
region = getattr(settings, 'AWS_S3_REGION_NAME', None)
storage_backend = getattr(settings, 'DEFAULT_FILE_STORAGE', None)
media_url = getattr(settings, 'MEDIA_URL', None)

print(f"AWS_ACCESS_KEY_ID: {'✅ Есть (' + aws_key[:10] + '...)' if aws_key else '❌ Отсутствует'}")
print(f"AWS_SECRET_ACCESS_KEY: {'✅ Есть (' + aws_secret[:10] + '...)' if aws_secret else '❌ Отсутствует'}")
print(f"AWS_STORAGE_BUCKET_NAME: {bucket_name or '❌ Отсутствует'}")
print(f"AWS_S3_ENDPOINT_URL: {endpoint_url or '❌ Отсутствует'}")
print(f"AWS_S3_REGION_NAME: {region or '❌ Отсутствует'}")
print(f"DEFAULT_FILE_STORAGE: {storage_backend or '❌ Отсутствует'}")
print(f"MEDIA_URL: {media_url or '❌ Отсутствует'}")

print("\n" + "=" * 50)

if aws_key and aws_secret:
    print("✅ Ключи Yandex Object Storage настроены")
    print("🌐 Файлы будут загружаться в облако")
    
    # Проверяем импорт boto3
    try:
        import boto3
        print("✅ boto3 установлен")
    except ImportError:
        print("❌ boto3 не установлен! Выполните: pip3 install boto3")
        
else:
    print("⚠️ Ключи не настроены")
    print("📁 Файлы будут сохраняться локально в /media/")

print("\n🧪 Готово к тестированию!") 