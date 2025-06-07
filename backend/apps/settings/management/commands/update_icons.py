from django.core.management.base import BaseCommand
from apps.settings.models import SettingCategory, SettingGroup


class Command(BaseCommand):
    help = 'Обновляет эмодзи иконки на названия HugeIcons в настройках'

    def handle(self, *args, **options):
        self.stdout.write('🔄 Обновление иконок настроек...')
        
        # Маппинг эмодзи на HugeIcons
        category_icons = {
            '⚙️': 'settings',
            '🎨': 'palette', 
            '🔍': 'search',
            '📧': 'mail',
            '🔒': 'lock',
            '🔗': 'link',
            '⚡': 'fire',
            '💻': 'code'
        }
        
        group_icons = {
            '✉️': 'mail',
            '🏷️': 'tag',
            '🔑': 'key',
            '🏠': 'home',
            '🚀': 'fire',
            '🐛': 'bug',
            '📱': 'mobile',
            '🎭': 'mask',
            '🔌': 'api',
            '🔔': 'notification'
        }
        
        # Обновляем категории
        updated_categories = 0
        for category in SettingCategory.objects.all():
            if category.icon in category_icons:
                old_icon = category.icon
                category.icon = category_icons[category.icon]
                category.save()
                updated_categories += 1
                self.stdout.write(f'✅ {category.name}: {old_icon} → {category.icon}')
        
        # Обновляем группы
        updated_groups = 0
        for group in SettingGroup.objects.all():
            if group.icon in group_icons:
                old_icon = group.icon
                group.icon = group_icons[group.icon]
                group.save()
                updated_groups += 1
                self.stdout.write(f'✅ {group.name}: {old_icon} → {group.icon}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🎉 Обновлено иконок: {updated_categories} категорий, {updated_groups} групп'
            )
        ) 