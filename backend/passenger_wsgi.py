import os
import sys

# Добавляем путь к проекту в PYTHONPATH
INTERP = os.path.expanduser("/home/e/eisec/.local/bin/python3")
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Устанавливаем переменные окружения
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.production'
os.environ['DJANGO_ENV'] = 'production'

# Добавляем путь к проекту
sys.path.insert(0, '/home/e/eisec/admin.ifuw.ru/public_html')

# Импортируем WSGI приложение
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application() 