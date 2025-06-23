#!/usr/bin/env python3
"""
Скрипт для тестирования CORS настроек
Проверяет доступность API с различных доменов
"""

import requests
import json
from urllib.parse import urljoin

# Конфигурация для тестирования
API_BASE_URL = "https://admin.ifuw.ru/api/v1/"
TEST_DOMAINS = [
    "https://ifuw.ru",
    "https://www.ifuw.ru", 
    "https://admin.ifuw.ru",
    "https://www.admin.ifuw.ru"
]

def test_cors_preflight(origin_domain):
    """Тестирует preflight CORS запрос"""
    print(f"\n🔍 Тестирование CORS preflight для {origin_domain}")
    
    try:
        # OPTIONS запрос для preflight
        response = requests.options(
            urljoin(API_BASE_URL, "sites/"),
            headers={
                'Origin': origin_domain,
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'authorization,content-type',
            },
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        # Проверяем CORS заголовки
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        }
        
        print(f"   CORS Headers: {cors_headers}")
        
        if response.status_code == 200:
            print("   ✅ CORS preflight успешен")
            return True
        else:
            print(f"   ❌ CORS preflight неуспешен: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка при тестировании: {e}")
        return False

def test_actual_request(origin_domain):
    """Тестирует реальный API запрос"""
    print(f"\n📡 Тестирование реального запроса для {origin_domain}")
    
    try:
        # GET запрос к API
        response = requests.get(
            urljoin(API_BASE_URL, "sites/"),
            headers={
                'Origin': origin_domain,
                'Content-Type': 'application/json',
            },
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        # Проверяем CORS заголовки в ответе
        cors_origin = response.headers.get('Access-Control-Allow-Origin')
        print(f"   Access-Control-Allow-Origin: {cors_origin}")
        
        if response.status_code in [200, 401]:  # 401 ожидаем без авторизации
            print("   ✅ Запрос успешен (CORS работает)")
            return True
        else:
            print(f"   ❌ Запрос неуспешен: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
            return False
            
    except Exception as e:
        print(f"   ❌ Ошибка при тестировании: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование CORS настроек для домена ifuw.ru")
    print(f"API URL: {API_BASE_URL}")
    print("=" * 60)
    
    results = {}
    
    for domain in TEST_DOMAINS:
        print(f"\n🌐 Тестирование домена: {domain}")
        print("-" * 40)
        
        # Тестируем preflight
        preflight_ok = test_cors_preflight(domain)
        
        # Тестируем реальный запрос
        request_ok = test_actual_request(domain)
        
        results[domain] = {
            'preflight': preflight_ok,
            'request': request_ok,
            'overall': preflight_ok and request_ok
        }
    
    # Выводим итоговый отчет
    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЙ ОТЧЕТ")
    print("=" * 60)
    
    for domain, result in results.items():
        status = "✅ OK" if result['overall'] else "❌ FAIL"
        print(f"{domain}: {status}")
        if not result['overall']:
            issues = []
            if not result['preflight']:
                issues.append("preflight")
            if not result['request']:
                issues.append("request")
            print(f"   Проблемы: {', '.join(issues)}")
    
    # Рекомендации
    failed_domains = [d for d, r in results.items() if not r['overall']]
    if failed_domains:
        print(f"\n⚠️  РЕКОМЕНДАЦИИ:")
        print(f"   Проблемы с доменами: {', '.join(failed_domains)}")
        print(f"   1. Проверьте CORS_ALLOWED_ORIGINS в settings/production.py")
        print(f"   2. Проверьте ALLOWED_HOSTS в settings/production.py") 
        print(f"   3. Убедитесь что corsheaders.middleware.CorsMiddleware первый в MIDDLEWARE")
        print(f"   4. Перезапустите Django сервер после изменений")
    else:
        print(f"\n🎉 Все домены работают корректно!")

if __name__ == "__main__":
    main() 