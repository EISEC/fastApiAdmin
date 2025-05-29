#!/usr/bin/env python3
"""
Тест основных API endpoints
"""

import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test_swagger():
    """Тест доступности Swagger документации"""
    print("🔍 Тестируем Swagger документацию...")
    try:
        response = requests.get(f'{BASE_URL}/swagger/')
        if response.status_code == 200:
            print("✅ Swagger документация доступна")
            return True
        else:
            print(f"❌ Swagger недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к Swagger: {e}")
        return False

def test_auth_endpoints():
    """Тест endpoints авторизации"""
    print("\n🔐 Тестируем API авторизации...")
    
    # Тест авторизации
    login_data = {
        'email': 'admin@example.com',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/token/', json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Авторизация успешна!")
            print(f"   Пользователь: {data.get('username', 'N/A')}")
            print(f"   Роль: {data.get('role_display', 'N/A')}")
            return data.get('access')
        else:
            print(f"❌ Ошибка авторизации: {response.status_code}")
            print(f"   Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def test_sites_endpoint(token):
    """Тест endpoints сайтов"""
    print("\n🌐 Тестируем API сайтов...")
    
    if not token:
        print("❌ Нет токена для авторизации")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f'{BASE_URL}/sites/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API сайтов работает!")
            print(f"   Найдено сайтов: {data.get('count', 0)}")
        else:
            print(f"❌ Ошибка API сайтов: {response.status_code}")
            print(f"   Ответ: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")

def main():
    """Основная функция тестирования"""
    print("🚀 Запуск тестирования API...")
    
    # Тест Swagger
    swagger_ok = test_swagger()
    
    # Тест авторизации
    token = test_auth_endpoints()
    
    # Тест API сайтов
    if token:
        test_sites_endpoint(token)
    
    print("\n" + "="*50)
    if swagger_ok and token:
        print("🎉 Все основные тесты прошли успешно!")
    else:
        print("⚠️  Некоторые тесты не прошли. Проверьте сервер.")
    print("="*50)

if __name__ == '__main__':
    main() 