#!/usr/bin/env python
"""
Тестирование API динамических моделей
"""
import os
import sys
import django
import json

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

# Добавляем testserver в ALLOWED_HOSTS для тестирования
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

# После настройки Django импортируем остальные модули
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.dynamic_models.models import DynamicModel, DynamicModelData, DynamicFieldType
from apps.sites.models import Site
from apps.accounts.models import CustomUser, Role


def get_jwt_token(user):
    """Получает JWT токен для пользователя"""
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


def test_dynamic_models_api():
    """Тестирует основные API endpoints"""
    
    print("🧪 Начинаем тестирование API динамических моделей...\n")
    
    # Получаем или создаем тестового пользователя
    try:
        superuser_role = Role.objects.get(name='superuser')
        user = CustomUser.objects.filter(role=superuser_role).first()
        if not user:
            print("❌ Суперпользователь не найден. Создайте пользователя с ролью superuser")
            return
    except Role.DoesNotExist:
        print("❌ Роль superuser не найдена. Проверьте инициализацию ролей")
        return
    
    # Создаем API клиент с JWT аутентификацией
    client = APIClient()
    token = get_jwt_token(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    print(f"✅ Авторизовались как {user.email} (роль: {user.role.name})")
    
    # Инициализируем переменные
    models = {'results': []}
    
    # 1. Тестируем получение типов полей
    print("\n📋 Тестируем endpoint field-types...")
    try:
        response = client.get('/api/v1/dynamic-models/field-types/')
        if response.status_code == 200:
            field_types = response.json()
            print(f"✅ Получено {len(field_types['results'])} типов полей")
            for ft in field_types['results'][:3]:
                print(f"   • {ft['label']} ({ft['name']}) - категория: {ft['category']}")
        else:
            print(f"❌ Ошибка получения типов полей: {response.status_code}")
            print(f"   Детали: {response.content.decode()[:200]}")
    except Exception as e:
        print(f"❌ Исключение при тестировании field-types: {e}")
    
    # 2. Тестируем получение моделей
    print("\n🏗️  Тестируем endpoint models...")
    try:
        response = client.get('/api/v1/dynamic-models/models/')
        if response.status_code == 200:
            models = response.json()
            print(f"✅ Получено {len(models['results'])} динамических моделей")
            for model in models['results']:
                print(f"   • {model['name']} ({model['model_type']}) - полей: {model['fields_count']}, записей: {model['data_entries_count']}")
        else:
            print(f"❌ Ошибка получения моделей: {response.status_code}")
            if response.content:
                print(f"   Детали: {response.content.decode()[:200]}")
    except Exception as e:
        print(f"❌ Исключение при тестировании models: {e}")
    
    # 3. Тестируем preview модели
    if models.get('results'):
        model_id = models['results'][0]['id']
        print(f"\n👀 Тестируем preview для модели ID {model_id}...")
        try:
            response = client.post(f'/api/v1/dynamic-models/models/{model_id}/preview/')
            if response.status_code == 200:
                preview = response.json()
                print(f"✅ Preview создан:")
                print(f"   • Модель: {preview['model_info']['name']}")
                print(f"   • Полей в форме: {len(preview['form_preview'])}")
                print(f"   • Колонок в таблице: {len(preview['table_preview']['columns'])}")
                
                # Показываем пример полей формы
                print(f"   • Примеры полей:")
                for field in preview['form_preview'][:3]:
                    required = "обязательное" if field['required'] else "опциональное"
                    print(f"     - {field['label']} ({field['type']}) - {required}")
                    
            else:
                print(f"❌ Ошибка создания preview: {response.status_code}")
        except Exception as e:
            print(f"❌ Исключение при тестировании preview: {e}")
    
    # 4. Тестируем получение данных
    print("\n📊 Тестируем endpoint data...")
    try:
        response = client.get('/api/v1/dynamic-models/data/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Получено {len(data['results'])} записей данных")
            for entry in data['results'][:3]:
                print(f"   • {entry['dynamic_model_name']}: {entry['display_value']}")
        else:
            print(f"❌ Ошибка получения данных: {response.status_code}")
    except Exception as e:
        print(f"❌ Исключение при тестировании data: {e}")
    
    # 5. Тестируем создание новой записи данных
    if models.get('results'):
        advantages_model = None
        for model in models['results']:
            if model['name'] == 'Преимущества':
                advantages_model = model
                break
        
        if advantages_model:
            print(f"\n➕ Тестируем создание новой записи для модели 'Преимущества'...")
            new_data = {
                'dynamic_model': advantages_model['id'],
                'data': {
                    'title': 'Тестовое преимущество',
                    'description': 'Это тестовое описание преимущества для проверки API',
                    'icon': 'fas fa-test',
                    'order': 99,
                    'is_featured': False
                },
                'is_published': True
            }
            
            try:
                response = client.post('/api/v1/dynamic-models/data/', new_data, format='json')
                if response.status_code == 201:
                    created_entry = response.json()
                    print(f"✅ Создана новая запись: {created_entry['display_value']}")
                else:
                    print(f"❌ Ошибка создания записи: {response.status_code}")
                    if response.content:
                        print(f"   Детали: {response.json()}")
            except Exception as e:
                print(f"❌ Исключение при создании записи: {e}")
    
    # 6. Тестируем экспорт конфигурации
    if models.get('results'):
        model_id = models['results'][0]['id']
        print(f"\n📤 Тестируем экспорт конфигурации модели ID {model_id}...")
        try:
            response = client.get(f'/api/v1/dynamic-models/models/{model_id}/export_config/')
            if response.status_code == 200:
                config = response.json()
                print(f"✅ Конфигурация экспортирована:")
                print(f"   • Название: {config['name']}")
                print(f"   • Полей: {len(config['fields_config']['fields'])}")
                print(f"   • Тип: {config['model_type']}")
                
                # Показываем первые поля
                fields = config['fields_config']['fields'][:2]
                for field in fields:
                    print(f"     - {field['label']} ({field['type']})")
                    
            else:
                print(f"❌ Ошибка экспорта: {response.status_code}")
        except Exception as e:
            print(f"❌ Исключение при экспорте: {e}")
    
    # 7. Тестируем получение схемы
    if models.get('results'):
        model_id = models['results'][0]['id']
        print(f"\n📋 Тестируем получение схемы для модели ID {model_id}...")
        try:
            response = client.get(f'/api/v1/dynamic-models/data/schema/?dynamic_model={model_id}')
            if response.status_code == 200:
                schema = response.json()
                print(f"✅ Схема получена:")
                print(f"   • Модель: {schema['model_info']['name']}")
                print(f"   • Полей: {len(schema['fields'])}")
                print(f"   • Тип модели: {schema['model_info']['model_type']}")
            else:
                print(f"❌ Ошибка получения схемы: {response.status_code}")
        except Exception as e:
            print(f"❌ Исключение при получении схемы: {e}")
    
    # 8. Тестируем bulk создание данных
    if models.get('results'):
        team_model = None
        for model in models['results']:
            if model['name'] == 'Команда':
                team_model = model
                break
        
        if team_model:
            print(f"\n📦 Тестируем bulk создание записей для модели 'Команда'...")
            bulk_data = {
                'dynamic_model': team_model['id'],
                'entries': [
                    {
                        'name': 'Сергей Тестов',
                        'position': 'QA Engineer',
                        'bio': 'Специалист по тестированию с опытом работы 5 лет',
                        'email': 'sergey@company.com',
                        'department': 'development'
                    },
                    {
                        'name': 'Анна Кодович',
                        'position': 'Backend Developer',
                        'bio': 'Python разработчик, специализируется на Django',
                        'email': 'anna@company.com', 
                        'department': 'development'
                    }
                ],
                'is_published': True
            }
            
            try:
                response = client.post('/api/v1/dynamic-models/data/bulk_create/', bulk_data, format='json')
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Bulk создание успешно: создано {result['created_count']} записей")
                else:
                    print(f"❌ Ошибка bulk создания: {response.status_code}")
                    if response.content:
                        print(f"   Детали: {response.json()}")
            except Exception as e:
                print(f"❌ Исключение при bulk создании: {e}")
    
    print("\n🎉 Тестирование API завершено!")


def show_statistics():
    """Показывает статистику созданных объектов"""
    print("\n📊 СТАТИСТИКА СИСТЕМЫ ДИНАМИЧЕСКИХ МОДЕЛЕЙ:")
    print("=" * 50)
    
    # Типы полей
    field_types_count = DynamicFieldType.objects.count()
    print(f"🔧 Типов полей: {field_types_count}")
    
    # Модели
    models_count = DynamicModel.objects.count()
    standalone_count = DynamicModel.objects.filter(model_type='standalone').count()
    extension_count = DynamicModel.objects.filter(model_type='extension').count()
    print(f"🏗️  Динамических моделей: {models_count}")
    print(f"   • Standalone: {standalone_count}")
    print(f"   • Extensions: {extension_count}")
    
    # Данные
    data_count = DynamicModelData.objects.count()
    published_count = DynamicModelData.objects.filter(is_published=True).count()
    print(f"📊 Записей данных: {data_count}")
    print(f"   • Опубликованных: {published_count}")
    
    # Модели по сайтам
    sites_with_models = Site.objects.filter(dynamic_models__isnull=False).distinct().count()
    print(f"🌐 Сайтов с моделями: {sites_with_models}")
    
    print("\n📋 ДЕТАЛИ МОДЕЛЕЙ:")
    for model in DynamicModel.objects.all():
        data_count = model.data_entries.filter(is_published=True).count()
        fields_count = len(model.fields_config.get('fields', []))
        print(f"   • {model.name} ({model.model_type}): {fields_count} полей, {data_count} записей")


if __name__ == '__main__':
    show_statistics()
    test_dynamic_models_api() 