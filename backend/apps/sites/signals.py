from django.db.models.signals import pre_delete, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import Site
import logging
import os

logger = logging.getLogger(__name__)


@receiver(pre_delete, sender=Site)
def site_pre_delete_handler(sender, instance, **kwargs):
    """
    Обработчик перед удалением сайта.
    Выполняет предварительную очистку и логирование.
    """
    logger.info(f"Начинается удаление сайта: {instance.name} (ID: {instance.id})")
    
    # Логируем статистику удаляемых объектов
    stats = {
        'posts': instance.posts.count(),
        'pages': instance.pages.count(),
        'categories': instance.categories.count(),
        'tags': instance.tags.count(),
        'dynamic_models': instance.dynamic_models.count(),
    }
    
    logger.info(f"Будут удалены связанные объекты: {stats}")
    
    # Очищаем связи many-to-many с пользователями
    # (assigned_sites автоматически очистится, но лучше сделать это явно)
    assigned_users_count = instance.assigned_users.count()
    if assigned_users_count > 0:
        logger.info(f"Очищаем связи с {assigned_users_count} назначенными пользователями")
        instance.assigned_users.clear()


@receiver(post_delete, sender=Site)
def site_post_delete_handler(sender, instance, **kwargs):
    """
    Обработчик после удаления сайта.
    Выполняет финальную очистку файлов и логирование.
    """
    logger.info(f"Сайт удален: {instance.name} (ID: {instance.id})")
    
    # Очищаем файлы изображений сайта
    image_fields = [
        'icon', 'default_image', 'main_screen_image', 
        'error_403_image', 'error_404_image', 'error_4xx_image', 'error_5xx_image'
    ]
    
    deleted_files = []
    for field_name in image_fields:
        field_value = getattr(instance, field_name, None)
        if field_value and hasattr(field_value, 'path'):
            try:
                if os.path.exists(field_value.path):
                    os.remove(field_value.path)
                    deleted_files.append(field_value.path)
            except Exception as e:
                logger.error(f"Ошибка при удалении файла {field_value.path}: {e}")
    
    if deleted_files:
        logger.info(f"Удалены файлы: {deleted_files}")
    
    # Логируем успешное завершение
    logger.info(f"Каскадное удаление сайта {instance.name} завершено успешно")


@receiver(pre_delete, sender=Site)
def check_site_dependencies(sender, instance, **kwargs):
    """
    Дополнительная проверка зависимостей перед удалением.
    Можно использовать для предотвращения удаления в критических случаях.
    """
    # Проверяем, не является ли это единственным сайтом владельца
    owner_sites_count = Site.objects.filter(owner=instance.owner).count()
    
    if owner_sites_count == 1:
        logger.warning(
            f"Удаляется последний сайт пользователя {instance.owner.username}. "
            f"Пользователь останется без сайтов."
        )
    
    # Проверяем количество контента
    total_content = (
        instance.posts.count() + 
        instance.pages.count() + 
        instance.dynamic_models.count()
    )
    
    if total_content > 100:
        logger.warning(
            f"Удаляется сайт с большим количеством контента ({total_content} объектов). "
            f"Убедитесь, что это действительно необходимо."
        )


def cascade_delete_site_with_transaction(site_id: int) -> dict:
    """
    Безопасное удаление сайта в транзакции с подробной статистикой.
    
    Args:
        site_id: ID сайта для удаления
        
    Returns:
        dict: Статистика удаленных объектов
    """
    try:
        with transaction.atomic():
            site = Site.objects.get(id=site_id)
            
            # Собираем статистику перед удалением
            stats = {
                'site_name': site.name,
                'site_domain': site.domain,
                'posts_deleted': site.posts.count(),
                'pages_deleted': site.pages.count(),
                'categories_deleted': site.categories.count(),
                'tags_deleted': site.tags.count(),
                'dynamic_models_deleted': site.dynamic_models.count(),
                'assigned_users_cleared': site.assigned_users.count(),
                'success': True,
                'error': None
            }
            
            # Удаляем сайт (каскадно удалятся все связанные объекты)
            site.delete()
            
            logger.info(f"Сайт {stats['site_name']} успешно удален со всеми зависимостями")
            return stats
            
    except Site.DoesNotExist:
        error_msg = f"Сайт с ID {site_id} не найден"
        logger.error(error_msg)
        return {
            'success': False,
            'error': error_msg
        }
    except Exception as e:
        error_msg = f"Ошибка при удалении сайта {site_id}: {str(e)}"
        logger.error(error_msg)
        return {
            'success': False,
            'error': error_msg
        } 