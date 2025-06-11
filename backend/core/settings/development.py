from .base import *

# Development specific settings
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Use SQLite for development instead of MySQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Временно отключаем Django Debug Toolbar для устранения ошибок
# if DEBUG:
#     INSTALLED_APPS += ['debug_toolbar']
#     MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
#     
#     # Internal IPs for debug toolbar
#     INTERNAL_IPS = [
#         '127.0.0.1',
#         'localhost',
#     ]
#     
#     # Debug Toolbar configuration
#     DEBUG_TOOLBAR_CONFIG = {
#         'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
#     }

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable SSL requirement for development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# CORS - allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Cache configuration for development - Redis
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'fastapi_admin_dev',
    }
}

# Logging configuration for development
# LOGGING['handlers']['console']['level'] = 'DEBUG'
# LOGGING['loggers']['django']['level'] = 'DEBUG'
# LOGGING['loggers']['apps']['level'] = 'DEBUG'
