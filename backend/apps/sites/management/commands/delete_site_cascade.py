from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.sites.models import Site
from apps.sites.signals import cascade_delete_site_with_transaction
import sys


class Command(BaseCommand):
    help = 'Безопасное каскадное удаление сайта со всеми зависимостями'

    def add_arguments(self, parser):
        parser.add_argument(
            'site_id',
            type=int,
            help='ID сайта для удаления'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Пропустить подтверждение удаления'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показать что будет удалено, но не удалять'
        )

    def handle(self, *args, **options):
        site_id = options['site_id']
        force = options['force']
        dry_run = options['dry_run']

        try:
            site = Site.objects.get(id=site_id)
        except Site.DoesNotExist:
            raise CommandError(f'Сайт с ID {site_id} не найден')

        # Собираем статистику
        stats = {
            'site_name': site.name,
            'site_domain': site.domain,
            'owner': site.owner.username,
            'posts': site.posts.count(),
            'pages': site.pages.count(),
            'categories': site.categories.count(),
            'tags': site.tags.count(),
            'dynamic_models': site.dynamic_models.count(),
            'assigned_users': site.assigned_users.count(),
        }

        # Показываем информацию о том, что будет удалено
        self.stdout.write(
            self.style.WARNING(f"\n📋 ИНФОРМАЦИЯ О САЙТЕ:")
        )
        self.stdout.write(f"   Название: {stats['site_name']}")
        self.stdout.write(f"   Домен: {stats['site_domain']}")
        self.stdout.write(f"   Владелец: {stats['owner']}")
        
        self.stdout.write(
            self.style.WARNING(f"\n🗑️  БУДЕТ УДАЛЕНО:")
        )
        self.stdout.write(f"   📝 Постов: {stats['posts']}")
        self.stdout.write(f"   📄 Страниц: {stats['pages']}")
        self.stdout.write(f"   📂 Категорий: {stats['categories']}")
        self.stdout.write(f"   🏷️  Тегов: {stats['tags']}")
        self.stdout.write(f"   🔧 Динамических моделей: {stats['dynamic_models']}")
        
        if stats['assigned_users'] > 0:
            self.stdout.write(f"   👥 Будет очищено связей с пользователями: {stats['assigned_users']}")

        total_objects = sum([
            stats['posts'], stats['pages'], stats['categories'], 
            stats['tags'], stats['dynamic_models']
        ])
        
        self.stdout.write(f"\n   📊 ВСЕГО ОБЪЕКТОВ: {total_objects}")

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS("\n✅ Dry-run режим: ничего не удалено")
            )
            return

        # Предупреждения
        if total_objects > 50:
            self.stdout.write(
                self.style.ERROR(
                    f"\n⚠️  ВНИМАНИЕ: Большое количество объектов ({total_objects})!"
                )
            )

        if stats['assigned_users'] > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"\n⚠️  ВНИМАНИЕ: {stats['assigned_users']} пользователей потеряют доступ к сайту!"
                )
            )

        # Проверяем, последний ли это сайт владельца
        owner_sites_count = Site.objects.filter(owner=site.owner).count()
        if owner_sites_count == 1:
            self.stdout.write(
                self.style.ERROR(
                    f"\n⚠️  КРИТИЧНО: Это последний сайт пользователя {stats['owner']}!"
                )
            )

        # Запрашиваем подтверждение
        if not force:
            self.stdout.write(
                self.style.ERROR(f"\n❌ ОПАСНАЯ ОПЕРАЦИЯ: Каскадное удаление сайта!")
            )
            
            confirm = input("\nВы уверены? Введите 'DELETE' для подтверждения: ")
            if confirm != 'DELETE':
                self.stdout.write(
                    self.style.SUCCESS("❌ Удаление отменено")
                )
                return

        # Выполняем удаление
        self.stdout.write(
            self.style.WARNING("\n🔄 Выполняется каскадное удаление...")
        )
        
        result = cascade_delete_site_with_transaction(site_id)
        
        if result['success']:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ УСПЕШНО: Сайт '{result['site_name']}' удален со всеми зависимостями"
                )
            )
            self.stdout.write(f"   📝 Удалено постов: {result['posts_deleted']}")
            self.stdout.write(f"   📄 Удалено страниц: {result['pages_deleted']}")
            self.stdout.write(f"   📂 Удалено категорий: {result['categories_deleted']}")
            self.stdout.write(f"   🏷️  Удалено тегов: {result['tags_deleted']}")
            self.stdout.write(f"   🔧 Удалено динамических моделей: {result['dynamic_models_deleted']}")
            
            if result['assigned_users_cleared'] > 0:
                self.stdout.write(f"   👥 Очищено связей с пользователями: {result['assigned_users_cleared']}")
        else:
            self.stdout.write(
                self.style.ERROR(f"\n❌ ОШИБКА: {result['error']}")
            )
            sys.exit(1) 