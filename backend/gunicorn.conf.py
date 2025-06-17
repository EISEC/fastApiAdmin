import multiprocessing
import os

# Базовые настройки
bind = '127.0.0.1:8001'
workers = 2
worker_class = 'sync'
timeout = 300  # Увеличиваем таймаут
keepalive = 5

# Логирование
accesslog = '/home/e/eisec/admin.ifuw.ru/logs/gunicorn-access.log'
errorlog = '/home/e/eisec/admin.ifuw.ru/logs/gunicorn-error.log'
loglevel = 'debug'

# Настройки приложения
chdir = '/home/e/eisec/admin.ifuw.ru/public_html'
raw_env = ['DJANGO_SETTINGS_MODULE=core.settings.production']

# Отладка
capture_output = True
enable_stdio_inheritance = True

# Настройки буферизации
buffer_size = 32768

# Настройки безопасности
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Настройки перезагрузки
reload = True
reload_extra_files = []

# Настройки graceful shutdown
graceful_timeout = 30

# Настройки максимального количества запросов на воркер
max_requests = 1000
max_requests_jitter = 50

# Настройки перезапуска воркеров
worker_connections = 1000

# Дополнительные настройки для отладки
check_config = True
daemon = False  # Запускаем в foreground режиме для отладки 