import os
from decouple import config

# Определяем, какие настройки использовать
if os.environ.get('DJANGO_ENV') == 'production':
    from .production import *
else:
    from .development import *
