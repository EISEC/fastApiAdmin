#!/usr/bin/env python3
"""
Скрипт для тестирования кэширования API
"""
import os
import sys
import time
import requests
import json

# Добавляем путь к Django проекту
sys.path.append('/Users/eisec/fastApiAdmin/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

import django
django.setup()

from django.core.cache import cache
from apps.settings.utils import get_cache_enabled, get_cache_timeout

def test_cache_settings():
    """Тестируем настройки кэша"""
    print("=== Testing Cache Settings ===")
    print(f"Cache enabled: {get_cache_enabled()}")
    print(f"Cache timeout: {get_cache_timeout()}")
    
    # Тестируем прямое обращение к кэшу
    test_key = "test_cache_key"
    test_value = {"message": "Hello Cache!", "timestamp": time.time()}
    
    cache.set(test_key, test_value, 60)
    retrieved = cache.get(test_key)
    
    print(f"Cache test - Set: {test_value}")
    print(f"Cache test - Get: {retrieved}")
    print(f"Cache working: {'✅' if retrieved == test_value else '❌'}")
    
    # Очищаем тестовый ключ
    cache.delete(test_key)
    print()

def test_api_cache():
    """Тестируем кэширование API через HTTP запросы"""
    print("=== Testing API Cache ===")
    
    base_url = "http://localhost:8000"
    
    # Сначала получим токен авторизации (если нужен)
    # Для упрощения будем тестировать публичные endpoints
    
    # Тестируем несколько запросов к API
    test_endpoints = [
        "/api/cache/stats/",  # Наш новый endpoint
    ]
    
    for endpoint in test_endpoints:
        url = base_url + endpoint
        print(f"\nTesting endpoint: {endpoint}")
        
        try:
            # Первый запрос (должен быть MISS)
            print("First request (expecting MISS)...")
            response1 = requests.get(url, timeout=5)
            print(f"Status: {response1.status_code}")
            print(f"X-Cache header: {response1.headers.get('X-Cache', 'Not set')}")
            
            # Второй запрос сразу после первого (должен быть HIT)
            print("Second request (expecting HIT)...")
            response2 = requests.get(url, timeout=5)
            print(f"Status: {response2.status_code}")
            print(f"X-Cache header: {response2.headers.get('X-Cache', 'Not set')}")
            
            if response1.status_code == 200 and response2.status_code == 200:
                print("✅ API requests successful")
            else:
                print("❌ API requests failed")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")

def test_cache_stats():
    """Тестируем получение статистики кэша"""
    print("=== Testing Cache Stats ===")
    
    try:
        # Получаем статистику напрямую через Django
        stats = cache.get('cache_stats', {})
        print(f"Current cache stats: {stats}")
        
        # Тестируем методы инвалидации
        print("\nTesting cache invalidation patterns...")
        
        # Создаем тестовые ключи
        test_keys = [
            "api_cache:_api_sites_",
            "api_cache:_api_posts_",
            "api_cache:_api_dashboard_",
        ]
        
        for key in test_keys:
            cache.set(key, {"test": "data"}, 300)
            print(f"Set test key: {key}")
        
        # Проверяем, что ключи созданы
        print("\nChecking test keys...")
        for key in test_keys:
            value = cache.get(key)
            print(f"Key {key}: {'exists' if value else 'missing'}")
        
        # Тестируем поиск по паттерну
        pattern = "api_cache:*"
        try:
            keys = cache.keys(pattern)
            print(f"\nKeys matching pattern '{pattern}': {len(keys)} found")
            for key in keys[:5]:  # Показываем первые 5
                print(f"  - {key}")
        except Exception as e:
            print(f"Pattern search failed: {e}")
        
        # Очищаем тестовые ключи
        cache.delete_many(test_keys)
        print("\nCleaned up test keys")
        
    except Exception as e:
        print(f"❌ Cache stats test failed: {e}")

def main():
    """Основная функция тестирования"""
    print("🚀 Starting Cache System Tests")
    print("=" * 50)
    
    test_cache_settings()
    test_cache_stats()
    test_api_cache()
    
    print("\n" + "=" * 50)
    print("✅ Cache tests completed!")

if __name__ == "__main__":
    main() 