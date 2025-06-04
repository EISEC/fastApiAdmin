from django.core.management.base import BaseCommand
from apps.settings.models import SettingCategory, SettingGroup, Setting


class Command(BaseCommand):
    help = 'Создание базовых настроек системы'

    def handle(self, *args, **options):
        self.stdout.write('Создание базовых настроек...')
        
        # Создаем категории
        categories_data = [
            {
                'id': 'general',
                'name': 'Основные',
                'description': 'Основные настройки системы',
                'icon': '⚙️',
                'order': 1
            },
            {
                'id': 'appearance',
                'name': 'Внешний вид',
                'description': 'Настройки оформления и темы',
                'icon': '🎨',
                'order': 2
            },
            {
                'id': 'seo',
                'name': 'SEO',
                'description': 'Настройки поисковой оптимизации',
                'icon': '🔍',
                'order': 3
            },
            {
                'id': 'notifications',
                'name': 'Уведомления',
                'description': 'Настройки уведомлений и рассылок',
                'icon': '📧',
                'order': 4
            },
            {
                'id': 'security',
                'name': 'Безопасность',
                'description': 'Настройки безопасности и доступа',
                'icon': '🔒',
                'order': 5
            },
            {
                'id': 'integrations',
                'name': 'Интеграции',
                'description': 'Настройки внешних сервисов',
                'icon': '🔗',
                'order': 6
            },
            {
                'id': 'performance',
                'name': 'Производительность',
                'description': 'Настройки кэширования и оптимизации',
                'icon': '⚡',
                'order': 7
            },
            {
                'id': 'developer',
                'name': 'Разработчик',
                'description': 'Настройки для разработчиков',
                'icon': '💻',
                'order': 8
            }
        ]
        
        for cat_data in categories_data:
            category, created = SettingCategory.objects.get_or_create(
                id=cat_data['id'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'✓ Создана категория: {category.name}')
        
        # Создаем группы настроек
        groups_data = [
            # General
            {'id': 'site_info', 'name': 'Информация о сайте', 'category': 'general', 'icon': '🏠', 'order': 1},
            {'id': 'contact_info', 'name': 'Контактная информация', 'category': 'general', 'icon': '📞', 'order': 2},
            {'id': 'regional', 'name': 'Региональные настройки', 'category': 'general', 'icon': '🌍', 'order': 3},
            
            # Appearance
            {'id': 'theme', 'name': 'Тема оформления', 'category': 'appearance', 'icon': '🎭', 'order': 1},
            {'id': 'colors', 'name': 'Цветовая схема', 'category': 'appearance', 'icon': '🌈', 'order': 2},
            {'id': 'typography', 'name': 'Типографика', 'category': 'appearance', 'icon': '📝', 'order': 3},
            
            # SEO
            {'id': 'meta', 'name': 'Meta теги', 'category': 'seo', 'icon': '🏷️', 'order': 1},
            {'id': 'analytics', 'name': 'Аналитика', 'category': 'seo', 'icon': '📊', 'order': 2},
            
            # Notifications
            {'id': 'email', 'name': 'Email уведомления', 'category': 'notifications', 'icon': '✉️', 'order': 1},
            {'id': 'push', 'name': 'Push уведомления', 'category': 'notifications', 'icon': '🔔', 'order': 2},
            
            # Security
            {'id': 'auth', 'name': 'Аутентификация', 'category': 'security', 'icon': '🔑', 'order': 1},
            {'id': 'access', 'name': 'Контроль доступа', 'category': 'security', 'icon': '🛡️', 'order': 2},
            
            # Integrations
            {'id': 'social', 'name': 'Социальные сети', 'category': 'integrations', 'icon': '📱', 'order': 1},
            {'id': 'payment', 'name': 'Платежи', 'category': 'integrations', 'icon': '💳', 'order': 2},
            
            # Performance
            {'id': 'cache', 'name': 'Кэширование', 'category': 'performance', 'icon': '🚀', 'order': 1},
            {'id': 'optimization', 'name': 'Оптимизация', 'category': 'performance', 'icon': '⚡', 'order': 2},
            
            # Developer
            {'id': 'debug', 'name': 'Отладка', 'category': 'developer', 'icon': '🐛', 'order': 1},
            {'id': 'api', 'name': 'API настройки', 'category': 'developer', 'icon': '🔌', 'order': 2},
        ]
        
        for group_data in groups_data:
            category = SettingCategory.objects.get(id=group_data['category'])
            group, created = SettingGroup.objects.get_or_create(
                id=group_data['id'],
                defaults={
                    'name': group_data['name'],
                    'category': category,
                    'icon': group_data['icon'],
                    'order': group_data['order']
                }
            )
            if created:
                self.stdout.write(f'✓ Создана группа: {group.name}')
        
        # Создаем базовые настройки
        settings_data = [
            # Site info
            {
                'key': 'site_name',
                'label': 'Название сайта',
                'type': 'text',
                'group': 'site_info',
                'default_value': 'FastAPI Admin',
                'is_required': True,
                'order': 1
            },
            {
                'key': 'site_description',
                'label': 'Описание сайта',
                'type': 'textarea',
                'group': 'site_info',
                'default_value': 'Система управления контентом',
                'order': 2
            },
            {
                'key': 'site_logo',
                'label': 'Логотип сайта',
                'type': 'image',
                'group': 'site_info',
                'order': 3
            },
            
            # Contact info
            {
                'key': 'contact_email',
                'label': 'Email для связи',
                'type': 'email',
                'group': 'contact_info',
                'default_value': 'admin@example.com',
                'order': 1
            },
            {
                'key': 'contact_phone',
                'label': 'Телефон',
                'type': 'text',
                'group': 'contact_info',
                'placeholder': '+7 (000) 000-00-00',
                'order': 2
            },
            
            # Regional
            {
                'key': 'timezone',
                'label': 'Часовой пояс',
                'type': 'select',
                'group': 'regional',
                'default_value': 'Europe/Moscow',
                'options': [
                    {'value': 'Europe/Moscow', 'label': 'Москва (UTC+3)'},
                    {'value': 'UTC', 'label': 'UTC'},
                    {'value': 'America/New_York', 'label': 'Нью-Йорк (UTC-5)'}
                ],
                'order': 1
            },
            {
                'key': 'language',
                'label': 'Язык по умолчанию',
                'type': 'select',
                'group': 'regional',
                'default_value': 'ru',
                'options': [
                    {'value': 'ru', 'label': 'Русский'},
                    {'value': 'en', 'label': 'English'}
                ],
                'order': 2
            },
            
            # Theme
            {
                'key': 'theme_mode',
                'label': 'Режим темы',
                'type': 'select',
                'group': 'theme',
                'default_value': 'light',
                'options': [
                    {'value': 'light', 'label': 'Светлая'},
                    {'value': 'dark', 'label': 'Тёмная'},
                    {'value': 'auto', 'label': 'Автоматически'}
                ],
                'order': 1
            },
            
            # Colors
            {
                'key': 'primary_color',
                'label': 'Основной цвет',
                'type': 'color',
                'group': 'colors',
                'default_value': '#3B82F6',
                'order': 1
            },
            {
                'key': 'secondary_color',
                'label': 'Дополнительный цвет',
                'type': 'color',
                'group': 'colors',
                'default_value': '#6B7280',
                'order': 2
            },
            
            # Meta
            {
                'key': 'seo_title',
                'label': 'SEO заголовок',
                'type': 'text',
                'group': 'meta',
                'placeholder': 'SEO заголовок для главной страницы',
                'order': 1
            },
            {
                'key': 'seo_description',
                'label': 'SEO описание',
                'type': 'textarea',
                'group': 'meta',
                'placeholder': 'Описание для поисковых систем',
                'order': 2
            },
            
            # Analytics
            {
                'key': 'google_analytics_id',
                'label': 'Google Analytics ID',
                'type': 'text',
                'group': 'analytics',
                'placeholder': 'G-XXXXXXXXXX',
                'order': 1
            },
            {
                'key': 'yandex_metrika_id',
                'label': 'Яндекс.Метрика ID',
                'type': 'text',
                'group': 'analytics',
                'placeholder': '12345678',
                'order': 2
            },
            
            # Email notifications
            {
                'key': 'email_notifications_enabled',
                'label': 'Включить email уведомления',
                'type': 'boolean',
                'group': 'email',
                'default_value': True,
                'order': 1
            },
            {
                'key': 'admin_email',
                'label': 'Email администратора',
                'type': 'email',
                'group': 'email',
                'default_value': 'admin@example.com',
                'order': 2
            },
            
            # Security
            {
                'key': 'password_min_length',
                'label': 'Минимальная длина пароля',
                'type': 'number',
                'group': 'auth',
                'default_value': 8,
                'order': 1
            },
            {
                'key': 'session_timeout',
                'label': 'Время жизни сессии (минуты)',
                'type': 'number',
                'group': 'auth',
                'default_value': 60,
                'order': 2
            },
            
            # Cache
            {
                'key': 'cache_enabled',
                'label': 'Включить кэширование',
                'type': 'boolean',
                'group': 'cache',
                'default_value': True,
                'order': 1
            },
            {
                'key': 'cache_timeout',
                'label': 'Время жизни кэша (секунды)',
                'type': 'number',
                'group': 'cache',
                'default_value': 3600,
                'order': 2
            },
            
            # Debug
            {
                'key': 'debug_mode',
                'label': 'Режим отладки',
                'type': 'boolean',
                'group': 'debug',
                'default_value': False,
                'order': 1
            }
        ]
        
        for setting_data in settings_data:
            group = SettingGroup.objects.get(id=setting_data['group'])
            setting, created = Setting.objects.get_or_create(
                key=setting_data['key'],
                defaults={
                    'label': setting_data['label'],
                    'type': setting_data['type'],
                    'group': group,
                    'default_value': setting_data.get('default_value'),
                    'value': setting_data.get('default_value'),
                    'is_required': setting_data.get('is_required', False),
                    'options': setting_data.get('options'),
                    'placeholder': setting_data.get('placeholder', ''),
                    'order': setting_data['order']
                }
            )
            if created:
                self.stdout.write(f'✓ Создана настройка: {setting.label}')
        
        self.stdout.write(
            self.style.SUCCESS('✅ Базовые настройки созданы успешно!')
        ) 