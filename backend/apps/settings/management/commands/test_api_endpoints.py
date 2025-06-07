from django.core.management.base import BaseCommand
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.settings.views import SettingViewSet, SocialNetworkSettingViewSet
from apps.settings.models import Setting, SocialNetworkSetting
from apps.accounts.models import Role
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Тестирует API endpoints для настроек'

    def handle(self, *args, **options):
        self.stdout.write('🧪 Тестирование API endpoints для настроек...\n')
        
        # Создаем фабрику запросов
        factory = RequestFactory()
        
        # Получаем роль для пользователя
        try:
            # Пытаемся найти роль author, если нет - создаем базовую роль
            try:
                role = Role.objects.get(name='author')
            except Role.DoesNotExist:
                role = Role.objects.first()  # Берем любую доступную роль
                
            if not role:
                self.stdout.write('❌ Нет доступных ролей в системе')
                return
                
        except Exception as e:
            self.stdout.write(f'❌ Ошибка получения роли: {e}')
            return
        
        # Создаем тестового пользователя
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': role
            }
        )
        
        self.stdout.write(f'👤 Использую пользователя: {user.username} (роль: {user.role.name})')
        
        # Тест 1: Настройки list_all
        self.stdout.write('\n1️⃣ Тестирую /settings/settings/list_all/')
        try:
            request = factory.get('/settings/settings/list_all/')
            request.user = user
            
            viewset = SettingViewSet()
            viewset.format_kwarg = None
            viewset.request = request
            viewset.action = 'list_all'
            response = viewset.list_all(request)
            
            self.stdout.write(f'   ✅ Статус: {response.status_code}')
            self.stdout.write(f'   📊 Количество настроек: {len(response.data)}')
            
            if response.data:
                sample = response.data[0]
                self.stdout.write(f'   📝 Пример настройки: {sample.get("key", "N/A")} = {sample.get("value", "N/A")}')
                
        except Exception as e:
            self.stdout.write(f'   ❌ Ошибка: {str(e)}')
        
        # Тест 2: Социальные сети public_list  
        self.stdout.write('\n2️⃣ Тестирую /settings/social-networks/public_list/')
        try:
            request = factory.get('/settings/social-networks/public_list/')
            request.user = user
            
            viewset = SocialNetworkSettingViewSet()
            viewset.format_kwarg = None
            viewset.request = request
            viewset.action = 'public_list'
            response = viewset.public_list(request)
            
            self.stdout.write(f'   ✅ Статус: {response.status_code}')
            self.stdout.write(f'   📊 Количество соцсетей: {len(response.data)}')
            
            if response.data:
                for network in response.data:
                    name = network.get('social_name', 'N/A')
                    url = network.get('url', 'N/A')
                    enabled = network.get('is_enabled', False)
                    icon = network.get('icon_name', 'N/A')
                    self.stdout.write(f'   🌐 {name}: {url} (иконка: {icon}, активна: {enabled})')
                    
        except Exception as e:
            self.stdout.write(f'   ❌ Ошибка: {str(e)}')
        
        # Тест 3: Проверка данных в БД
        self.stdout.write('\n3️⃣ Проверяю данные в базе данных')
        
        settings_count = Setting.objects.count()
        social_count = SocialNetworkSetting.objects.count()
        social_enabled_count = SocialNetworkSetting.objects.filter(is_enabled=True).count()
        
        self.stdout.write(f'   📊 Настроек в БД: {settings_count}')
        self.stdout.write(f'   📊 Соцсетей в БД: {social_count}')
        self.stdout.write(f'   📊 Активных соцсетей: {social_enabled_count}')
        
        # Показываем детали соцсетей
        for network in SocialNetworkSetting.objects.all():
            self.stdout.write(f'   🌐 {network.get_name_display()}: {network.url} (порядок: {network.order}, активна: {network.is_enabled})')
        
        self.stdout.write('\n✨ Тестирование завершено!') 