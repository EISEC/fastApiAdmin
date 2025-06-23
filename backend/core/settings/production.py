from .base import *
from .config import *
import os
from decouple import config

# Production specific settings
DEBUG = False

ALLOWED_HOSTS = ['admin.ifuw.ru', 'eisec.beget.tech', 'www.admin.ifuw.ru', 'ifuw.ru', 'www.ifuw.ru']

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = EMAIL_HOST
EMAIL_PORT = EMAIL_PORT
EMAIL_USE_TLS = EMAIL_USE_TLS
EMAIL_HOST_USER = EMAIL_HOST_USER
EMAIL_HOST_PASSWORD = EMAIL_HOST_PASSWORD

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'RETRY_ON_TIMEOUT': True,
            'MAX_CONNECTIONS': 1000,
            'CONNECTION_POOL_KWARGS': {'max_connections': 100}
        }
    }
}

# AWS S3 Configuration (определяем сначала)
AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='adminifuw')
AWS_S3_ENDPOINT_URL = config('AWS_S3_ENDPOINT_URL', default='https://storage.yandexcloud.net')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='ru-central1')
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.storage.yandexcloud.net'
AWS_DEFAULT_ACL = 'public-read'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}

# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Папка для собранных файлов
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),  # Папка с исходными файлами
]

# Media files configuration (теперь AWS_S3_CUSTOM_DOMAIN уже определена)
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

# Ensure the static directory exists
if not os.path.exists(STATIC_ROOT):
    os.makedirs(STATIC_ROOT)

# Ensure STATICFILES_DIRS exist
for directory in STATICFILES_DIRS:
    if not os.path.exists(directory):
        os.makedirs(directory)

# Static files configuration for production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Logging for production
# Создаем папку для логов если она не существует
LOG_DIR = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

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
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'django.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'ERROR',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['file', 'console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['file', 'console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'z`W.|->fk$~IxBL=HTP?B:8O8D*wuuLdU1Y"%<*LioWt2{BZ*Mz8-OitJ8CK=f&V*nEFCo#;[c.twqZ68K])[W>\\v?6@{UV;aD%`'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': config('DB_NAME', default='eisec_fastapi'),
        'USER': config('DB_USER', default='eisec_fastapi'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='eisec.beget.tech'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        },
    }
}

# Настройки языка и времени
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Настройки кодировки
DEFAULT_CHARSET = 'utf-8'
FILE_CHARSET = 'utf-8'

# CORS settings for production
CORS_ALLOW_ALL_ORIGINS = False  # В продакшене разрешаем только конкретные домены
CORS_ALLOWED_ORIGINS = [
    "https://admin.ifuw.ru",
    "https://www.admin.ifuw.ru",
    "https://ifuw.ru",
    "https://www.ifuw.ru",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://\w+\.ifuw\.ru$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
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
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 часа
CORS_EXPOSE_HEADERS = [
    'content-type',
    'authorization',
]

# Additional security settings
X_FRAME_OPTIONS = 'DENY'
