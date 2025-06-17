from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import Role
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Создает суперпользователя с автоматическим назначением роли superuser'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True, help='Имя пользователя')
        parser.add_argument('--email', required=True, help='Email пользователя')
        parser.add_argument('--noinput', action='store_true', help='Не запрашивать ввод')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        noinput = options['noinput']

        # Получаем пароль из переменной окружения
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        if not password and not noinput:
            password = input('Password: ')
            password_confirm = input('Password (again): ')
            if password != password_confirm:
                self.stdout.write(
                    self.style.ERROR('Error: Your passwords didn\'t match.')
                )
                return

        if not password:
            self.stdout.write(
                self.style.ERROR('Error: Password is required. Set DJANGO_SUPERUSER_PASSWORD environment variable or use interactive mode.')
            )
            return

        # Получаем или создаем роль superuser
        role, created = Role.objects.get_or_create(
            name=Role.SUPERUSER,
            defaults={
                'permissions': {
                    'can_manage_users': True,
                    'can_manage_roles': True,
                    'can_manage_sites': True,
                    'can_manage_content': True,
                    'can_view_analytics': True,
                    'can_manage_settings': True
                }
            }
        )

        # Создаем суперпользователя
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_superuser=True,
                is_staff=True,
                role=role
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created superuser "{username}"')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Superuser "{username}" already exists')
            ) 