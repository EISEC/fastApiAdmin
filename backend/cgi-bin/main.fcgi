#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os

# Добавляем путь к проекту
sys.path.insert(0, '/path/to/your/project')
sys.path.insert(0, '/path/to/your/project/backend')

# Устанавливаем переменную окружения для Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.production')

# Импортируем Django WSGI приложение
from django.core.wsgi import get_wsgi_application
from flup.server.fcgi import WSGIServer

# Создаем WSGI приложение
application = get_wsgi_application()

if __name__ == '__main__':
    WSGIServer(application).run() 