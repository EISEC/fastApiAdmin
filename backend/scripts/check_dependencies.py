import subprocess
import sys

def install_package(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

required_packages = [
    'pymysql',
    'gunicorn',
    'django',
    'django-cors-headers',
    'django-filter',
    'djangorestframework',
    'djangorestframework-simplejwt',
    'Pillow',
    'python-decouple',
    'mysqlclient'
]

def main():
    print("Проверка и установка необходимых пакетов...")
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package} уже установлен")
        except ImportError:
            print(f"Установка {package}...")
            install_package(package)
            print(f"✓ {package} установлен")

if __name__ == '__main__':
    main() 