"""
Django management команда для тестирования CORS настроек
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import requests
from urllib.parse import urljoin


class Command(BaseCommand):
    help = 'Тестирует CORS настройки для различных доменов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-url',
            type=str,
            default='https://admin.ifuw.ru/api/v1/',
            help='URL API для тестирования (по умолчанию: https://admin.ifuw.ru/api/v1/)'
        )
        parser.add_argument(
            '--domains',
            type=str,
            nargs='+',
            default=['https://ifuw.ru', 'https://www.ifuw.ru', 'https://admin.ifuw.ru'],
            help='Список доменов для тестирования'
        )
        parser.add_argument(
            '--endpoint',
            type=str,
            default='sites/',
            help='Endpoint для тестирования (по умолчанию: sites/)'
        )

    def handle(self, *args, **options):
        api_url = options['api_url']
        domains = options['domains']
        endpoint = options['endpoint']
        
        self.stdout.write(
            self.style.SUCCESS('🚀 Тестирование CORS настроек')
        )
        self.stdout.write(f"API URL: {api_url}")
        self.stdout.write(f"Endpoint: {endpoint}")
        self.stdout.write(f"Тестируемые домены: {', '.join(domains)}")
        self.stdout.write("=" * 60)
        
        # Показываем текущие настройки CORS
        self.show_cors_settings()
        
        # Тестируем каждый домен
        results = {}
        for domain in domains:
            results[domain] = self.test_domain_cors(api_url, endpoint, domain)
        
        # Выводим итоговый отчет
        self.show_results(results)

    def show_cors_settings(self):
        """Показывает текущие настройки CORS"""
        self.stdout.write("\n📋 Текущие настройки CORS:")
        self.stdout.write("-" * 40)
        
        cors_settings = {
            'CORS_ALLOW_ALL_ORIGINS': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', None),
            'CORS_ALLOWED_ORIGINS': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
            'CORS_ALLOWED_ORIGIN_REGEXES': getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', []),
            'CORS_ALLOW_CREDENTIALS': getattr(settings, 'CORS_ALLOW_CREDENTIALS', None),
            'CORS_ALLOW_METHODS': getattr(settings, 'CORS_ALLOW_METHODS', []),
            'CORS_ALLOW_HEADERS': getattr(settings, 'CORS_ALLOW_HEADERS', []),
            'ALLOWED_HOSTS': getattr(settings, 'ALLOWED_HOSTS', []),
        }
        
        for key, value in cors_settings.items():
            if isinstance(value, list) and len(value) > 3:
                # Сокращаем длинные списки
                display_value = f"[{', '.join(value[:3])}, ... (+{len(value)-3} еще)]"
            else:
                display_value = str(value)
            self.stdout.write(f"  {key}: {display_value}")

    def test_domain_cors(self, api_url, endpoint, domain):
        """Тестирует CORS для конкретного домена"""
        self.stdout.write(f"\n🌐 Тестирование домена: {domain}")
        self.stdout.write("-" * 40)
        
        url = urljoin(api_url, endpoint)
        results = {'preflight': False, 'request': False, 'errors': []}
        
        # Тест preflight запроса
        try:
            self.stdout.write("🔍 Тестирование preflight запроса...")
            response = requests.options(
                url,
                headers={
                    'Origin': domain,
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'authorization,content-type',
                },
                timeout=10
            )
            
            self.stdout.write(f"   Status: {response.status_code}")
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
                'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
            }
            
            for header, value in cors_headers.items():
                if value:
                    self.stdout.write(f"   {header}: {value}")
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS("   ✅ Preflight успешен"))
                results['preflight'] = True
            else:
                self.stdout.write(self.style.ERROR(f"   ❌ Preflight неуспешен: {response.status_code}"))
                results['errors'].append(f"Preflight: {response.status_code}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Ошибка preflight: {e}"))
            results['errors'].append(f"Preflight error: {e}")
        
        # Тест реального запроса
        try:
            self.stdout.write("📡 Тестирование реального запроса...")
            response = requests.get(
                url,
                headers={
                    'Origin': domain,
                    'Content-Type': 'application/json',
                },
                timeout=10
            )
            
            self.stdout.write(f"   Status: {response.status_code}")
            cors_origin = response.headers.get('Access-Control-Allow-Origin')
            if cors_origin:
                self.stdout.write(f"   Access-Control-Allow-Origin: {cors_origin}")
            
            if response.status_code in [200, 401]:  # 401 ожидаем без авторизации
                self.stdout.write(self.style.SUCCESS("   ✅ Запрос успешен"))
                results['request'] = True
            else:
                self.stdout.write(self.style.ERROR(f"   ❌ Запрос неуспешен: {response.status_code}"))
                results['errors'].append(f"Request: {response.status_code}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Ошибка запроса: {e}"))
            results['errors'].append(f"Request error: {e}")
        
        return results

    def show_results(self, results):
        """Показывает итоговые результаты"""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📊 ИТОГОВЫЙ ОТЧЕТ")
        self.stdout.write("=" * 60)
        
        success_count = 0
        total_count = len(results)
        
        for domain, result in results.items():
            overall_success = result['preflight'] and result['request']
            if overall_success:
                status = self.style.SUCCESS("✅ OK")
                success_count += 1
            else:
                status = self.style.ERROR("❌ FAIL")
            
            self.stdout.write(f"{domain}: {status}")
            
            if result['errors']:
                for error in result['errors']:
                    self.stdout.write(f"   - {error}")
        
        # Статистика
        self.stdout.write(f"\n📈 Статистика: {success_count}/{total_count} доменов работают корректно")
        
        # Рекомендации
        if success_count < total_count:
            self.stdout.write(f"\n⚠️  РЕКОМЕНДАЦИИ:")
            self.stdout.write(f"   1. Проверьте CORS_ALLOWED_ORIGINS в settings")
            self.stdout.write(f"   2. Проверьте ALLOWED_HOSTS в settings") 
            self.stdout.write(f"   3. Убедитесь что corsheaders.middleware.CorsMiddleware первый в MIDDLEWARE")
            self.stdout.write(f"   4. Перезапустите Django сервер после изменений")
            self.stdout.write(f"   5. Проверьте nginx/apache конфигурацию")
        else:
            self.stdout.write(self.style.SUCCESS(f"\n🎉 Все домены работают корректно!")) 