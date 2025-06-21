from .base import *
import logging

# Development specific settings
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# 🚀 Подключение к продакшн MySQL базе данных для локальной разработки
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'eisec_fastapi',
        'USER': 'eisec_fastapi',
        'PASSWORD': 'jA&TJA8x5rBt',
        'HOST': 'eisec.beget.tech',
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'use_unicode': True,
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'connect_timeout': 60,
        },
        'TEST': {
            'CHARSET': 'utf8mb4',
            'COLLATION': 'utf8mb4_unicode_ci',
        }
    }
}

# ⚠️ ВАЖНО: При работе с продакшн базой будьте осторожны!
# Рекомендуется создать отдельную development копию для безопасности

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

# Дополнительные настройки безопасности для разработки
SESSION_COOKIE_SECURE = False  # Отключаем HTTPS для cookies
CSRF_COOKIE_SECURE = False     # Отключаем HTTPS для CSRF
SESSION_COOKIE_SAMESITE = None # Разрешаем cross-site cookies

# 🌐 CORS настройки для локальной разработки
CORS_ALLOW_ALL_ORIGINS = True

# Дополнительно разрешаем конкретные origins для безопасности
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite frontend
    "http://127.0.0.1:5173",  # Vite frontend альтернативный
    "http://localhost:3000",  # React frontend (если нужен)
    "http://127.0.0.1:3000",  # React frontend альтернативный
]

# Разрешаем все headers для разработки
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Разрешаем все методы для разработки
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Разрешаем cookies и credentials
CORS_ALLOW_CREDENTIALS = True

# Префлайт запросы кэшируем на 1 час
CORS_PREFLIGHT_MAX_AGE = 3600

# Дополнительные настройки CORS для отладки
CORS_EXPOSE_HEADERS = [
    'content-type',
    'authorization',
]

# Разрешаем заголовки Origin
CORS_ALLOW_ORIGIN_WHITELIST = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

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

# 🔍 Детальное логирование для отладки CORS
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'corsheaders': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Logging configuration for development
# LOGGING['handlers']['console']['level'] = 'DEBUG'
# LOGGING['loggers']['django']['level'] = 'DEBUG'
# LOGGING['loggers']['apps']['level'] = 'DEBUG'
