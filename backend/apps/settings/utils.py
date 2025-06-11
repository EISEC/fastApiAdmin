from django.core.cache import cache
from django.conf import settings as django_settings
from .models import Setting, SocialNetworkSetting
import logging

logger = logging.getLogger(__name__)

# Время кэширования настроек (в секундах)
SETTINGS_CACHE_TIMEOUT = getattr(django_settings, 'SETTINGS_CACHE_TIMEOUT', 3600)


def get_setting(key: str, default=None, use_cache: bool = True):
    """
    Получить значение настройки по ключу
    
    Args:
        key: Ключ настройки
        default: Значение по умолчанию если настройка не найдена
        use_cache: Использовать кэширование
    
    Returns:
        Значение настройки или default
    """
    cache_key = f'setting_{key}'
    
    if use_cache:
        cached_value = cache.get(cache_key)
        if cached_value is not None:
            return cached_value
    
    try:
        setting = Setting.objects.get(key=key)
        value = setting.get_value()
        
        if use_cache:
            cache.set(cache_key, value, SETTINGS_CACHE_TIMEOUT)
        
        return value
    except Setting.DoesNotExist:
        logger.warning(f"Setting '{key}' not found, using default: {default}")
        return default
    except Exception as e:
        logger.error(f"Error getting setting '{key}': {e}")
        return default


def set_setting(key: str, value, user=None):
    """
    Установить значение настройки
    
    Args:
        key: Ключ настройки
        value: Новое значение
        user: Пользователь, который изменяет настройку
    
    Returns:
        bool: True если настройка была обновлена
    """
    try:
        setting = Setting.objects.get(key=key)
        setting.set_value(value, user)
        
        # Очищаем кэш
        cache_key = f'setting_{key}'
        cache.delete(cache_key)
        
        return True
    except Setting.DoesNotExist:
        logger.error(f"Setting '{key}' not found")
        return False
    except Exception as e:
        logger.error(f"Error setting '{key}': {e}")
        return False


def get_settings_dict(keys: list = None, use_cache: bool = True) -> dict:
    """
    Получить словарь настроек
    
    Args:
        keys: Список ключей настроек (если None - все настройки)
        use_cache: Использовать кэширование
    
    Returns:
        dict: Словарь {key: value}
    """
    cache_key = 'settings_dict_all' if keys is None else f'settings_dict_{"_".join(sorted(keys))}'
    
    if use_cache:
        cached_value = cache.get(cache_key)
        if cached_value is not None:
            return cached_value
    
    try:
        queryset = Setting.objects.all()
        if keys:
            queryset = queryset.filter(key__in=keys)
        
        settings_dict = {}
        for setting in queryset:
            settings_dict[setting.key] = setting.get_value()
        
        if use_cache:
            cache.set(cache_key, settings_dict, SETTINGS_CACHE_TIMEOUT)
        
        return settings_dict
    except Exception as e:
        logger.error(f"Error getting settings dict: {e}")
        return {}


def get_social_networks(enabled_only: bool = True) -> list:
    """
    Получить список социальных сетей
    
    Args:
        enabled_only: Только активные соц.сети
    
    Returns:
        list: Список словарей с данными соц.сетей
    """
    cache_key = f'social_networks_{"enabled" if enabled_only else "all"}'
    
    cached_value = cache.get(cache_key)
    if cached_value is not None:
        return cached_value
    
    try:
        queryset = SocialNetworkSetting.objects.all().order_by('order', 'name')
        if enabled_only:
            queryset = queryset.filter(is_enabled=True)
        
        networks = []
        for network in queryset:
            networks.append({
                'name': network.name,
                'social_name': network.get_name_display(),
                'url': network.url,
                'icon_name': network.get_icon_name(),
                'order': network.order
            })
        
        cache.set(cache_key, networks, SETTINGS_CACHE_TIMEOUT)
        return networks
    except Exception as e:
        logger.error(f"Error getting social networks: {e}")
        return []


def invalidate_settings_cache():
    """Очистить весь кэш настроек"""
    try:
        # Получаем все ключи настроек
        settings = Setting.objects.values_list('key', flat=True)
        
        # Очищаем кэш по ключам
        cache_keys = [f'setting_{key}' for key in settings]
        cache_keys.extend([
            'settings_dict_all',
            'social_networks_enabled',
            'social_networks_all'
        ])
        
        cache.delete_many(cache_keys)
        logger.info("Settings cache invalidated")
    except Exception as e:
        logger.error(f"Error invalidating settings cache: {e}")


# Константы для часто используемых настроек
class SettingsKeys:
    """Константы ключей настроек"""
    
    # Основные
    SITE_NAME = 'site_name'
    SITE_DESCRIPTION = 'site_description'
    SITE_LOGO = 'site_logo'
    ADMIN_EMAIL = 'admin_email'
    CONTACT_EMAIL = 'contact_email'
    
    # SEO
    SEO_TITLE = 'seo_title'
    SEO_DESCRIPTION = 'seo_description'
    GOOGLE_ANALYTICS_ID = 'google_analytics_id'
    
    # Внешний вид
    THEME_MODE = 'theme_mode'
    
    # Безопасность
    PASSWORD_MIN_LENGTH = 'password_min_length'
    SESSION_TIMEOUT = 'session_timeout'
    
    # Уведомления
    EMAIL_NOTIFICATIONS_ENABLED = 'email_notifications_enabled'
    
    # Производительность
    CACHE_ENABLED = 'cache_enabled'
    CACHE_TIMEOUT = 'cache_timeout'
    
    # Разработчик
    DEBUG_MODE = 'debug_mode'


# Удобные функции для получения часто используемых настроек
def get_site_name():
    """Получить название сайта"""
    return get_setting(SettingsKeys.SITE_NAME, 'Мой сайт')


def get_site_description():
    """Получить описание сайта"""
    return get_setting(SettingsKeys.SITE_DESCRIPTION, '')


def get_admin_email():
    """Получить email администратора"""
    return get_setting(SettingsKeys.ADMIN_EMAIL, 'admin@example.com')


def get_theme_mode():
    """Получить режим темы"""
    return get_setting(SettingsKeys.THEME_MODE, 'light')


def is_cache_enabled():
    """Проверить включен ли кэш"""
    return get_setting(SettingsKeys.CACHE_ENABLED, True)


def get_cache_enabled():
    """Алиас для is_cache_enabled"""
    return is_cache_enabled()


def get_cache_timeout():
    """Получить таймаут кэша"""
    return get_setting(SettingsKeys.CACHE_TIMEOUT, 3600)


def is_debug_mode():
    """Проверить включен ли режим отладки"""
    return get_setting(SettingsKeys.DEBUG_MODE, False)


def get_password_min_length():
    """Получить минимальную длину пароля"""
    return get_setting(SettingsKeys.PASSWORD_MIN_LENGTH, 8)


def is_email_notifications_enabled():
    """Проверить включены ли email уведомления"""
    return get_setting(SettingsKeys.EMAIL_NOTIFICATIONS_ENABLED, True) 