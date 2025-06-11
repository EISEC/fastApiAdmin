#!/usr/bin/env python3
"""
Простой тест кэша без терминальных команд
"""
import os
import sys
import time
import json

# Настройка Django
sys.path.append('/Users/eisec/fastApiAdmin/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

import django
django.setup()

from django.core.cache import cache
from django.test.client import RequestFactory
from django.contrib.auth import get_user_model
from apps.common.middleware import APICacheMiddleware

User = get_user_model()

def test_cache_key_generation():
    """Тестируем генерацию ключей кэша"""
    print("🔑 Testing Cache Key Generation")
    print("-" * 40)
    
    factory = RequestFactory()
    middleware = APICacheMiddleware(None)
    
    # Создаем тестовые запросы
    requests = [
        factory.get('/api/v1/sites/'),
        factory.get('/api/v1/cache/stats/'),
        factory.get('/api/v1/posts/?page=1'),
    ]
    
    # Создаем тестового пользователя
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.create_superuser('test', 'test@test.com', 'test')
    
    for request in requests:
        request.user = user
        cache_key = middleware._get_cache_key(request)
        print(f"Path: {request.path}")
        print(f"Key:  {cache_key}")
        print()

def test_direct_cache_operations():
    """Тестируем прямые операции с кэшем"""
    print("💾 Testing Direct Cache Operations")
    print("-" * 40)
    
    # Тестируем простое сохранение/получение
    test_key = "test:simple:key"
    test_data = {"message": "Hello Cache", "timestamp": time.time()}
    
    print(f"Setting cache: {test_key}")
    cache.set(test_key, test_data, 60)
    
    print(f"Getting cache: {test_key}")
    result = cache.get(test_key)
    print(f"Result: {result}")
    
    if result == test_data:
        print("✅ Direct cache operations working")
    else:
        print("❌ Direct cache operations failed")
    
    # Очищаем тестовый ключ
    cache.delete(test_key)
    print()

def test_api_cache_keys():
    """Проверяем существующие API ключи кэша"""
    print("🔍 Checking Existing API Cache Keys")
    print("-" * 40)
    
    try:
        # Получаем все ключи
        all_keys = cache.keys('*')
        api_keys = [k for k in all_keys if 'api_cache' in k]
        
        print(f"Total cache keys: {len(all_keys)}")
        print(f"API cache keys: {len(api_keys)}")
        
        for key in api_keys[:10]:  # Показываем первые 10
            print(f"  - {key}")
            
        if api_keys:
            # Проверяем содержимое первого ключа
            first_key = api_keys[0]
            content = cache.get(first_key)
            print(f"\nContent of {first_key}:")
            print(json.dumps(content, indent=2) if content else "None")
            
    except Exception as e:
        print(f"❌ Error checking keys: {e}")
    
    print()

def test_cache_stats():
    """Проверяем статистику кэша"""
    print("📊 Testing Cache Stats")
    print("-" * 40)
    
    stats = cache.get('cache_stats', {})
    print(f"Cache stats: {json.dumps(stats, indent=2)}")
    
    # Обновляем статистику
    new_stats = {
        'hits': stats.get('hits', 0) + 1,
        'misses': stats.get('misses', 0) + 1,
        'total_requests': stats.get('total_requests', 0) + 1,
        'last_reset': time.time()
    }
    
    cache.set('cache_stats', new_stats, 86400)
    print("✅ Updated cache stats")
    print()

def main():
    print("🚀 Simple Cache Test")
    print("=" * 50)
    
    test_cache_key_generation()
    test_direct_cache_operations()
    test_api_cache_keys()
    test_cache_stats()
    
    print("=" * 50)
    print("✅ Simple cache test completed!")

if __name__ == "__main__":
    main() 