from django.core.management.base import BaseCommand
from django.db import models
from django.apps import apps
import os
import re


class Command(BaseCommand):
    help = 'Проверка потенциальных проблем в коде'

    def handle(self, *args, **options):
        self.stdout.write('🔍 Проверка потенциальных проблем...\n')
        
        issues = []
        
        # 1. Проверяем использование несуществующих полей
        self.check_field_usage(issues)
        
        # 2. Проверяем импорты DjangoFilterBackend
        self.check_filter_backend_usage(issues)
        
        # 3. Проверяем модели на отсутствие обязательных полей
        self.check_model_fields(issues)
        
        # 4. Проверяем API endpoints на правильность
        self.check_api_consistency(issues)
        
        # Выводим результаты
        if not issues:
            self.stdout.write(
                self.style.SUCCESS('✅ Проблем не найдено!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Найдено {len(issues)} потенциальных проблем:')
            )
            for i, issue in enumerate(issues, 1):
                self.stdout.write(f'   {i}. {issue}')

    def check_field_usage(self, issues):
        """Проверяем использование полей в коде"""
        self.stdout.write('🔸 Проверка использования полей...')
        
        # Проверяем использование is_published в Post модели
        post_model = apps.get_model('posts', 'Post')
        post_fields = [f.name for f in post_model._meta.fields]
        
        if 'is_published' not in post_fields:
            # Ищем использование is_published в коде
            search_paths = [
                'backend/apps/posts/',
                'backend/apps/sites/',
            ]
            
            for path in search_paths:
                if os.path.exists(path):
                    for root, dirs, files in os.walk(path):
                        for file in files:
                            if file.endswith('.py'):
                                filepath = os.path.join(root, file)
                                try:
                                    with open(filepath, 'r', encoding='utf-8') as f:
                                        content = f.read()
                                        if 'is_published' in content and 'posts' in content:
                                            issues.append(f'Использование is_published в {filepath} для Post модели')
                                except Exception:
                                    pass

    def check_filter_backend_usage(self, issues):
        """Проверяем импорты DjangoFilterBackend"""
        self.stdout.write('🔸 Проверка DjangoFilterBackend...')
        
        search_paths = ['apps/']
        
        for path in search_paths:
            if os.path.exists(path):
                for root, dirs, files in os.walk(path):
                    for file in files:
                        if file.endswith('.py'):
                            filepath = os.path.join(root, file)
                            try:
                                with open(filepath, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                    if 'django_filters.rest_framework' in content:
                                        issues.append(f'Импорт DjangoFilterBackend в {filepath}')
                                    if 'filterset_fields' in content:
                                        issues.append(f'Использование filterset_fields в {filepath}')
                            except Exception:
                                pass

    def check_model_fields(self, issues):
        """Проверяем модели на обязательные поля"""
        self.stdout.write('🔸 Проверка полей моделей...')
        
        # Получаем все модели из наших приложений
        our_apps = ['accounts', 'sites', 'posts', 'pages', 'settings', 'dynamic_models']
        
        for app_name in our_apps:
            try:
                app = apps.get_app_config(app_name)
                for model in app.get_models():
                    field_names = [f.name for f in model._meta.fields]
                    
                    # Проверяем обязательные поля
                    if 'created_at' not in field_names and hasattr(model, '_meta'):
                        if not model._meta.abstract:
                            issues.append(f'Модель {model.__name__} не имеет поля created_at')
                    
                    if 'updated_at' not in field_names and hasattr(model, '_meta'):
                        if not model._meta.abstract:
                            issues.append(f'Модель {model.__name__} не имеет поля updated_at')
                            
            except Exception as e:
                issues.append(f'Ошибка проверки приложения {app_name}: {str(e)}')

    def check_api_consistency(self, issues):
        """Проверяем консистентность API"""
        self.stdout.write('🔸 Проверка API консистентности...')
        
        # Проверяем что все модели имеют соответствующие сериализаторы
        our_apps = ['sites', 'posts', 'pages', 'settings']
        
        for app_name in our_apps:
            try:
                app = apps.get_app_config(app_name)
                
                # Проверяем наличие serializers.py
                serializers_path = os.path.join('apps', app_name, 'serializers.py')
                if not os.path.exists(serializers_path):
                    issues.append(f'Отсутствует файл serializers.py в приложении {app_name}')
                
                # Проверяем наличие views.py  
                views_path = os.path.join('apps', app_name, 'views.py')
                if not os.path.exists(views_path):
                    issues.append(f'Отсутствует файл views.py в приложении {app_name}')
                    
                # Проверяем наличие urls.py
                urls_path = os.path.join('apps', app_name, 'urls.py')
                if not os.path.exists(urls_path):
                    issues.append(f'Отсутствует файл urls.py в приложении {app_name}')
                    
            except Exception as e:
                issues.append(f'Ошибка проверки API для {app_name}: {str(e)}')
                
        self.stdout.write('✓ Проверка завершена')

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Попытаться автоматически исправить найденные проблемы',
        ) 