#!/usr/bin/env python3
"""
Тест кэширования API с авторизацией
"""
import os
import sys
import requests
import json

# Добавляем путь к Django проекту
sys.path.append('/Users/eisec/fastApiAdmin/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

import django
django.setup()

from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def get_auth_token():
    """Получаем токен авторизации для тестов"""
    try:
        # Получаем первого суперпользователя
        user = User.objects.filter(is_superuser=True).first()
        if not user:
            print("❌ No superuser found. Creating one...")
            user = User.objects.create_superuser(
                username='testadmin',
                email='test@example.com',
                password='testpass123'
            )
            print("✅ Test superuser created")
        
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    except Exception as e:
        print(f"❌ Failed to get auth token: {e}")
        return None

def test_cache_api():
    """Тестируем кэширование API с авторизацией"""
    print("=== Testing API Cache with Authentication ===")
    
    base_url = "http://localhost:8000"
    token = get_auth_token()
    
    if not token:
        print("❌ Cannot proceed without auth token")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Тестируем cache stats endpoint
    print("\n1. Testing /api/v1/cache/stats/")
    try:
        url = f"{base_url}/api/v1/cache/stats/"
        
        # Первый запрос
        print("   First request...")
        response1 = requests.get(url, headers=headers, timeout=10)
        print(f"   Status: {response1.status_code}")
        print(f"   X-Cache: {response1.headers.get('X-Cache', 'Not set')}")
        
        if response1.status_code == 200:
            data = response1.json()
            print(f"   Hit Rate: {data['cache_stats']['hit_rate']}%")
            print(f"   Total Requests: {data['cache_stats']['total_requests']}")
        
        # Второй запрос (должен быть из кэша)
        print("   Second request...")
        response2 = requests.get(url, headers=headers, timeout=10)
        print(f"   Status: {response2.status_code}")
        print(f"   X-Cache: {response2.headers.get('X-Cache', 'Not set')}")
        
        if response1.status_code == 200 and response2.status_code == 200:
            print("   ✅ API requests successful")
        else:
            print("   ❌ API requests failed")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
    
    # Тестируем sites API для проверки кэширования
    print("\n2. Testing /api/v1/sites/")
    try:
        url = f"{base_url}/api/v1/sites/"
        
        # Несколько запросов подряд
        for i in range(3):
            response = requests.get(url, headers=headers, timeout=10)
            cache_status = response.headers.get('X-Cache', 'Not set')
            print(f"   Request {i+1}: Status {response.status_code}, Cache: {cache_status}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
    
    # Тестируем очистку кэша
    print("\n3. Testing cache clear")
    try:
        url = f"{base_url}/api/v1/cache/clear/"
        data = {"pattern": "api_cache:*"}
        
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Cache cleared: {result.get('cleared_keys', 0)} keys")
        else:
            print("   ❌ Cache clear failed")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")

def test_direct_cache():
    """Тестируем прямое обращение к кэшу Django"""
    print("\n=== Testing Direct Cache Access ===")
    
    # Получаем статистику кэша
    stats = cache.get('cache_stats', {})
    print(f"Current cache stats: {stats}")
    
    # Проверяем ключи кэша
    try:
        keys = cache.keys('api_cache:*')
        print(f"Cache keys found: {len(keys)}")
        for key in keys[:5]:  # Показываем первые 5
            print(f"  - {key}")
    except Exception as e:
        print(f"Failed to get cache keys: {e}")

def main():
    print("🚀 Testing Cache System with Authentication")
    print("=" * 60)
    
    test_direct_cache()
    test_cache_api()
    
    print("\n" + "=" * 60)
    print("✅ Cache authentication tests completed!")

if __name__ == "__main__":
    main() 