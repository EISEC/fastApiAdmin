from decouple import config

# Определяем какие настройки использовать
environment = config('DJANGO_ENVIRONMENT', default='development')

if environment == 'production':
    from .production import *
elif environment == 'testing':
    from .testing import *
else:
    from .development import *
