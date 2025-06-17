import os
from pathlib import Path
from dotenv import load_dotenv

# Загружаем .env файл
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def get_env_value(key, default=None):
    """Безопасное получение значения из переменных окружения"""
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f"Required environment variable {key} is not set")
    return value

# Базовые настройки
SECRET_KEY = get_env_value('SECRET_KEY')
DEBUG = get_env_value('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = get_env_value('ALLOWED_HOSTS').split(',')

# Настройки базы данных
DB_NAME = get_env_value('DB_NAME')
DB_USER = get_env_value('DB_USER')
DB_PASSWORD = get_env_value('DB_PASSWORD')
DB_HOST = get_env_value('DB_HOST')
DB_PORT = get_env_value('DB_PORT', '3306')

# Настройки email
EMAIL_HOST = get_env_value('EMAIL_HOST')
EMAIL_PORT = int(get_env_value('EMAIL_PORT', '465'))
EMAIL_USE_TLS = get_env_value('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = get_env_value('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = get_env_value('EMAIL_HOST_PASSWORD')

# Настройки Redis
REDIS_URL = get_env_value('REDIS_URL', 'redis://localhost:6379/1') 