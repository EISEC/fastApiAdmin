from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import Role

User = get_user_model()


class Command(BaseCommand):
    help = 'Создает начальные данные для проекта (роли и суперпользователя)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--superuser-email',
            type=str,
            default='admin@example.com',
            help='Email суперпользователя'
        )
        parser.add_argument(
            '--superuser-password',
            type=str,
            default='admin123',
            help='Пароль суперпользователя'
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Начинаем создание начальных данных...')
        )

        # Создание ролей
        self.create_roles()
        
        # Создание суперпользователя
        self.create_superuser(
            options['superuser_email'],
            options['superuser_password']
        )

        self.stdout.write(
            self.style.SUCCESS('Начальные данные успешно созданы!')
        )

    def create_roles(self):
        """Создает все необходимые роли"""
        self.stdout.write('Создание ролей...')
        
        roles_data = [
            {
                'name': Role.SUPERUSER,
                'permissions': {
                    'can_manage_users': True,
                    'can_manage_sites': True,
                    'can_manage_content': True,
                    'can_manage_system': True,
                }
            },
            {
                'name': Role.ADMIN,
                'permissions': {
                    'can_manage_users': False,
                    'can_manage_sites': True,
                    'can_manage_content': True,
                    'can_manage_system': False,
                }
            },
            {
                'name': Role.AUTHOR,
                'permissions': {
                    'can_manage_users': False,
                    'can_manage_sites': False,
                    'can_manage_content': True,
                    'can_manage_system': False,
                }
            },
            {
                'name': Role.USER,
                'permissions': {
                    'can_manage_users': False,
                    'can_manage_sites': False,
                    'can_manage_content': False,
                    'can_manage_system': False,
                }
            },
        ]

        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data['name'],
                defaults={'permissions': role_data['permissions']}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Роль "{role.get_name_display()}" создана')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'  - Роль "{role.get_name_display()}" уже существует')
                )

    def create_superuser(self, email, password):
        """Создает суперпользователя"""
        self.stdout.write('Создание суперпользователя...')
        
        try:
            # Получаем роль суперпользователя
            superuser_role = Role.objects.get(name=Role.SUPERUSER)
            
            # Проверяем, существует ли уже суперпользователь
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'  - Пользователь с email {email} уже существует')
                )
                return
            
            # Создаем суперпользователя
            user = User.objects.create_user(
                username='admin',
                email=email,
                password=password,
                first_name='Администратор',
                last_name='Системы',
                role=superuser_role,
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Суперпользователь создан:')
            )
            self.stdout.write(f'    Email: {email}')
            self.stdout.write(f'    Пароль: {password}')
            self.stdout.write(
                self.style.WARNING(
                    '    ⚠️  Обязательно смените пароль после первого входа!'
                )
            )
            
        except Role.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('  ✗ Ошибка: роль суперпользователя не найдена')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ✗ Ошибка при создании суперпользователя: {e}')
            ) 