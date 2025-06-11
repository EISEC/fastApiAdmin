from django.core.management.base import BaseCommand
from apps.settings.models import SocialNetworkSetting


class Command(BaseCommand):
    help = 'Создание демо социальных сетей'

    def handle(self, *args, **options):
        self.stdout.write('🌐 Создание демо социальных сетей...')
        
        # Данные для демо социальных сетей
        social_networks_data = [
            {
                'name': 'facebook',
                'url': 'https://facebook.com/example',
                'is_enabled': True,
                'order': 1
            },
            {
                'name': 'twitter',
                'url': 'https://twitter.com/example',
                'is_enabled': True,
                'order': 2
            },
            {
                'name': 'instagram',
                'url': 'https://instagram.com/example',
                'is_enabled': True,
                'order': 3
            },
            {
                'name': 'youtube',
                'url': 'https://youtube.com/@example',
                'is_enabled': True,
                'order': 4
            },
            {
                'name': 'linkedin',
                'url': 'https://linkedin.com/company/example',
                'is_enabled': False,
                'order': 5
            },
            {
                'name': 'telegram',
                'url': 'https://t.me/example',
                'is_enabled': True,
                'order': 6
            },
            {
                'name': 'whatsapp',
                'url': 'https://wa.me/79001234567',
                'is_enabled': False,
                'order': 7
            },
            {
                'name': 'vk',
                'url': 'https://vk.com/example',
                'is_enabled': True,
                'order': 8
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for social_data in social_networks_data:
            social, created = SocialNetworkSetting.objects.get_or_create(
                name=social_data['name'],
                defaults={
                    'url': social_data['url'],
                    'is_enabled': social_data['is_enabled'],
                    'order': social_data['order']
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(f'✓ Создана соц.сеть: {social.get_name_display()}')
            else:
                # Обновляем существующую если нужно
                updated = False
                if social.url != social_data['url']:
                    social.url = social_data['url']
                    updated = True
                if social.order != social_data['order']:
                    social.order = social_data['order']
                    updated = True
                if updated:
                    social.save()
                    updated_count += 1
                    self.stdout.write(f'↻ Обновлена соц.сеть: {social.get_name_display()}')
                else:
                    self.stdout.write(f'≡ Соц.сеть уже существует: {social.get_name_display()}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Демо социальные сети готовы! '
                f'Создано: {created_count}, Обновлено: {updated_count}'
            )
        )
        
        # Выводим итоговую статистику
        total = SocialNetworkSetting.objects.count()
        enabled = SocialNetworkSetting.objects.filter(is_enabled=True).count()
        self.stdout.write(f'📊 Всего социальных сетей: {total} (активных: {enabled})') 