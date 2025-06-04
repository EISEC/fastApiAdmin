from django.core.management.base import BaseCommand
from django.urls import reverse
from django.test import Client
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
from apps.settings.models import Setting

User = get_user_model()

class Command(BaseCommand):
    help = 'Тестирование всех API endpoints'

    def handle(self, *args, **options):
        self.stdout.write('🧪 Тестирование API endpoints...')
        
        # Создаем тестового пользователя с ролью superuser
        try:
            superuser_role = Role.objects.get(name='superuser')
            test_user, created = User.objects.get_or_create(
                username='test_api_user',
                defaults={
                    'email': 'test@example.com',
                    'role': superuser_role,
                    'is_active': True
                }
            )
            if created:
                test_user.set_password('testpass123')
                test_user.save()
                self.stdout.write('✓ Создан тестовый пользователь')
        except Exception as e:
            self.stdout.write(f'❌ Ошибка создания пользователя: {e}')
            return

        client = Client()
        
        # Получаем JWT токен
        try:
            response = client.post('/api/v1/auth/token/', {
                'username': 'test_api_user',
                'password': 'testpass123'
            })
            if response.status_code == 200:
                token = response.json()['access']
                headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
                self.stdout.write('✓ Получен JWT токен')
            else:
                self.stdout.write(f'❌ Ошибка получения токена: {response.status_code}')
                return
        except Exception as e:
            self.stdout.write(f'❌ Ошибка авторизации: {e}')
            return

        # Список endpoints для тестирования
        test_endpoints = [
            # Auth endpoints
            ('GET', '/api/v1/auth/users/', 'Список пользователей'),
            ('GET', '/api/v1/auth/roles/', 'Список ролей'),
            
            # Sites endpoints
            ('GET', '/api/v1/sites/', 'Список сайтов'),
            
            # Posts endpoints
            ('GET', '/api/v1/posts/', 'Список постов'),
            ('GET', '/api/v1/posts/categories/', 'Категории постов'),
            ('GET', '/api/v1/posts/tags/', 'Теги постов'),
            
            # Pages endpoints
            ('GET', '/api/v1/pages/', 'Список страниц'),
            
            # Settings endpoints
            ('GET', '/api/v1/settings/', 'Настройки (основной)'),
            ('GET', '/api/v1/settings/all/', 'Все настройки'),
            ('GET', '/api/v1/settings/categories/', 'Категории настроек'),
            ('GET', '/api/v1/settings/groups/', 'Группы настроек'),
            ('GET', '/api/v1/settings/templates/', 'Шаблоны настроек'),
        ]

        results = []
        
        for method, url, description in test_endpoints:
            try:
                if method == 'GET':
                    response = client.get(url, **headers)
                else:
                    response = client.post(url, **headers)
                
                if response.status_code in [200, 201]:
                    self.stdout.write(f'✅ {description}: {response.status_code}')
                    results.append((url, '✅', response.status_code))
                elif response.status_code == 404:
                    self.stdout.write(f'❌ {description}: 404 - Endpoint не найден')
                    results.append((url, '❌', '404 Not Found'))
                else:
                    self.stdout.write(f'⚠️  {description}: {response.status_code}')
                    results.append((url, '⚠️', response.status_code))
                    
            except Exception as e:
                self.stdout.write(f'💥 {description}: Ошибка - {e}')
                results.append((url, '💥', str(e)))

        # Тестируем POST endpoints
        post_tests = [
            # Bulk update settings
            ('PUT', '/api/v1/settings/bulk/', {
                'updates': [
                    {'key': 'site_name', 'value': 'Test Site Updated'}
                ]
            }, 'Массовое обновление настроек'),
        ]

        self.stdout.write('\n🔧 Тестирование POST/PUT endpoints...')
        
        for method, url, data, description in post_tests:
            try:
                if method == 'POST':
                    response = client.post(url, data, content_type='application/json', **headers)
                elif method == 'PUT':
                    response = client.put(url, data, content_type='application/json', **headers)
                
                if response.status_code in [200, 201]:
                    self.stdout.write(f'✅ {description}: {response.status_code}')
                else:
                    self.stdout.write(f'❌ {description}: {response.status_code} - {response.content.decode()[:100]}')
                    
            except Exception as e:
                self.stdout.write(f'💥 {description}: Ошибка - {e}')

        # Проверяем количество настроек в БД
        settings_count = Setting.objects.count()
        self.stdout.write(f'\n📊 Статистика:')
        self.stdout.write(f'   • Настроек в БД: {settings_count}')
        
        success_count = len([r for r in results if r[1] == '✅'])
        total_count = len(results)
        self.stdout.write(f'   • Успешных endpoints: {success_count}/{total_count}')
        
        # Финальная сводка
        self.stdout.write('\n📋 Сводка тестирования:')
        for url, status, code in results:
            self.stdout.write(f'   {status} {url} - {code}')
        
        if success_count == total_count:
            self.stdout.write(
                self.style.SUCCESS('\n🎉 Все endpoints работают корректно!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'\n⚠️  {total_count - success_count} endpoints требуют внимания')
            )
        
        # Удаляем тестового пользователя
        if created:
            test_user.delete()
            self.stdout.write('🗑️  Тестовый пользователь удален') 