#!/usr/bin/env python3
"""
Скрипт для проверки установленных зависимостей
"""

import sys
import importlib

# Список критически важных модулей для работы Django проекта
REQUIRED_MODULES = [
    'django',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'django_filters',
    'MySQLdb',  # mysqlclient
    'drf_yasg',
    'PIL',      # Pillow
    'celery',
    'redis',
    'django_extensions',
    'mptt',
    'taggit',
    'decouple',
    'requests',
    'dateutil', # python-dateutil
    'storages',
    'boto3',
    'whitenoise',
    # 'gunicorn',  # Не нужен при использовании Passenger
]

def check_module(module_name):
    """Проверяет, установлен ли модуль"""
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False

def main():
    """Основная функция проверки"""
    print("🔍 Проверка установленных зависимостей...")
    print("=" * 50)
    
    missing_modules = []
    
    for module in REQUIRED_MODULES:
        if check_module(module):
            print(f"✅ {module}")
        else:
            print(f"❌ {module} - НЕ УСТАНОВЛЕН")
            missing_modules.append(module)
    
    print("=" * 50)
    
    if missing_modules:
        print(f"🚨 Отсутствует {len(missing_modules)} модулей:")
        for module in missing_modules:
            print(f"   - {module}")
        print("\n📦 Для установки выполните:")
        print("   pip install -r requirements/production.txt")
        return False
    else:
        print("🎉 Все зависимости установлены!")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 