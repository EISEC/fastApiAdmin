from django.core.management.base import BaseCommand
from django.db import transaction
from apps.dynamic_models.models import DynamicModel, DynamicModelData, DynamicFieldType
from apps.sites.models import Site
from apps.accounts.models import CustomUser


class Command(BaseCommand):
    help = 'Создает демонстрационные динамические модели'

    def add_arguments(self, parser):
        parser.add_argument(
            '--site-id',
            type=int,
            help='ID сайта для создания моделей (по умолчанию первый доступный)',
        )

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Создаем типы полей по умолчанию
                self.create_default_field_types()
                
                # Получаем сайт
                site_id = options.get('site_id')
                if site_id:
                    site = Site.objects.get(id=site_id)
                else:
                    site = Site.objects.first()
                
                if not site:
                    self.stdout.write(
                        self.style.ERROR('Сайт не найден. Создайте сайт сначала.')
                    )
                    return

                # Создаем демо модели
                models_created = 0
                
                # 1. Модель "Преимущества" (standalone)
                advantages_model = self.create_advantages_model(site)
                if advantages_model:
                    models_created += 1
                    self.create_advantages_data(advantages_model)

                # 2. Модель "Команда" (standalone)
                team_model = self.create_team_model(site)
                if team_model:
                    models_created += 1
                    self.create_team_data(team_model)

                # 3. Расширение модели "Посты" с дополнительными полями
                posts_extension = self.create_posts_extension(site)
                if posts_extension:
                    models_created += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Успешно создано {models_created} демонстрационных моделей для сайта "{site.name}"'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Ошибка при создании демо данных: {str(e)}')
            )

    def create_default_field_types(self):
        """Создает базовые типы полей"""
        field_types_data = [
            {
                'name': 'text',
                'label': 'Текст',
                'category': 'text',
                'description': 'Однострочный текст',
                'ui_component': 'TextInput',
                'default_config': {'max_length': 255},
                'validation_rules': {'type': 'string'}
            },
            {
                'name': 'textarea',
                'label': 'Многострочный текст',
                'category': 'text',
                'description': 'Многострочное текстовое поле',
                'ui_component': 'TextArea',
                'default_config': {'rows': 4},
                'validation_rules': {'type': 'string'}
            },
            {
                'name': 'rich_text',
                'label': 'Форматированный текст',
                'category': 'text',
                'description': 'Редактор с форматированием',
                'ui_component': 'RichTextEditor',
                'default_config': {},
                'validation_rules': {'type': 'string'}
            },
            {
                'name': 'number',
                'label': 'Число',
                'category': 'number',
                'description': 'Числовое поле',
                'ui_component': 'NumberInput',
                'default_config': {'step': 1},
                'validation_rules': {'type': 'number'}
            },
            {
                'name': 'email',
                'label': 'Email',
                'category': 'text',
                'description': 'Email адрес',
                'ui_component': 'EmailInput',
                'default_config': {},
                'validation_rules': {'type': 'email'}
            },
            {
                'name': 'image',
                'label': 'Изображение',
                'category': 'media',
                'description': 'Загрузка изображения',
                'ui_component': 'ImageUpload',
                'default_config': {'accept': 'image/*'},
                'validation_rules': {'type': 'file'}
            },
            {
                'name': 'select',
                'label': 'Выпадающий список',
                'category': 'select',
                'description': 'Выбор из списка вариантов',
                'ui_component': 'Select',
                'default_config': {'options': []},
                'validation_rules': {'type': 'string'}
            },
            {
                'name': 'boolean',
                'label': 'Да/Нет',
                'category': 'select',
                'description': 'Булево значение',
                'ui_component': 'Checkbox',
                'default_config': {},
                'validation_rules': {'type': 'boolean'}
            }
        ]

        for field_data in field_types_data:
            DynamicFieldType.objects.get_or_create(
                name=field_data['name'],
                defaults=field_data
            )

        self.stdout.write(f'✅ Создано {len(field_types_data)} типов полей')

    def create_advantages_model(self, site):
        """Создает модель 'Преимущества'"""
        fields_config = {
            'fields': [
                {
                    'name': 'title',
                    'type': 'text',
                    'label': 'Заголовок',
                    'required': True,
                    'placeholder': 'Введите заголовок преимущества',
                    'max_length': 255,
                    'show_in_list': True
                },
                {
                    'name': 'description',
                    'type': 'textarea',
                    'label': 'Описание',
                    'required': True,
                    'placeholder': 'Опишите преимущество',
                    'rows': 3,
                    'show_in_list': True
                },
                {
                    'name': 'icon',
                    'type': 'text',
                    'label': 'Иконка',
                    'required': False,
                    'placeholder': 'Название иконки (например: fas fa-star)',
                    'help_text': 'CSS класс иконки Font Awesome'
                },
                {
                    'name': 'image',
                    'type': 'image',
                    'label': 'Изображение',
                    'required': False,
                    'help_text': 'Изображение для преимущества'
                },
                {
                    'name': 'order',
                    'type': 'number',
                    'label': 'Порядок отображения',
                    'required': True,
                    'default_value': 1,
                    'min': 1,
                    'max': 100
                },
                {
                    'name': 'is_featured',
                    'type': 'boolean',
                    'label': 'Выделенное',
                    'required': False,
                    'default_value': False,
                    'help_text': 'Отметить как особо важное преимущество'
                }
            ]
        }

        model, created = DynamicModel.objects.get_or_create(
            name='Преимущества',
            site=site,
            defaults={
                'model_type': 'standalone',
                'description': 'Модель для хранения преимуществ компании/продукта',
                'fields_config': fields_config,
                'validation_rules': {
                    'title': {'required': True, 'min_length': 3},
                    'description': {'required': True, 'min_length': 10},
                    'order': {'required': True, 'min': 1}
                }
            }
        )

        if created:
            self.stdout.write(f'✅ Создана модель "Преимущества"')
        else:
            self.stdout.write(f'⚠️  Модель "Преимущества" уже существует')

        return model

    def create_advantages_data(self, model):
        """Создает демо данные для модели Преимущества"""
        demo_data = [
            {
                'title': 'Высокое качество',
                'description': 'Мы гарантируем высочайшее качество всех наших услуг и продуктов',
                'icon': 'fas fa-star',
                'order': 1,
                'is_featured': True
            },
            {
                'title': 'Быстрая доставка',
                'description': 'Доставляем заказы в кратчайшие сроки по всей стране',
                'icon': 'fas fa-shipping-fast',
                'order': 2,
                'is_featured': False
            },
            {
                'title': '24/7 Поддержка',
                'description': 'Наша служба поддержки работает круглосуточно для решения ваших вопросов',
                'icon': 'fas fa-headset',
                'order': 3,
                'is_featured': True
            }
        ]

        created_count = 0
        for data in demo_data:
            entry, created = DynamicModelData.objects.get_or_create(
                dynamic_model=model,
                data__title=data['title'],
                defaults={
                    'data': data,
                    'is_published': True
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'✅ Создано {created_count} записей для модели "Преимущества"')

    def create_team_model(self, site):
        """Создает модель 'Команда'"""
        fields_config = {
            'fields': [
                {
                    'name': 'name',
                    'type': 'text',
                    'label': 'Имя и фамилия',
                    'required': True,
                    'placeholder': 'Введите полное имя',
                    'max_length': 255,
                    'show_in_list': True
                },
                {
                    'name': 'position',
                    'type': 'text',
                    'label': 'Должность',
                    'required': True,
                    'placeholder': 'Укажите должность',
                    'max_length': 255,
                    'show_in_list': True
                },
                {
                    'name': 'bio',
                    'type': 'textarea',
                    'label': 'Биография',
                    'required': False,
                    'placeholder': 'Краткая биография сотрудника',
                    'rows': 4
                },
                {
                    'name': 'photo',
                    'type': 'image',
                    'label': 'Фотография',
                    'required': False,
                    'help_text': 'Фото сотрудника'
                },
                {
                    'name': 'email',
                    'type': 'email',
                    'label': 'Email',
                    'required': False,
                    'placeholder': 'email@company.com'
                },
                {
                    'name': 'department',
                    'type': 'select',
                    'label': 'Отдел',
                    'required': True,
                    'options': [
                        {'value': 'development', 'label': 'Разработка'},
                        {'value': 'design', 'label': 'Дизайн'},
                        {'value': 'marketing', 'label': 'Маркетинг'},
                        {'value': 'management', 'label': 'Руководство'},
                        {'value': 'support', 'label': 'Поддержка'}
                    ]
                }
            ]
        }

        model, created = DynamicModel.objects.get_or_create(
            name='Команда',
            site=site,
            defaults={
                'model_type': 'standalone',
                'description': 'Модель для хранения информации о сотрудниках',
                'fields_config': fields_config,
                'validation_rules': {
                    'name': {'required': True, 'min_length': 2},
                    'position': {'required': True, 'min_length': 3},
                    'email': {'type': 'email'}
                }
            }
        )

        if created:
            self.stdout.write(f'✅ Создана модель "Команда"')
        else:
            self.stdout.write(f'⚠️  Модель "Команда" уже существует')

        return model

    def create_team_data(self, model):
        """Создает демо данные для модели Команда"""
        demo_data = [
            {
                'name': 'Алексей Смирнов',
                'position': 'Ведущий разработчик',
                'bio': 'Опытный fullstack разработчик с 8-летним стажем. Специализируется на Python и React.',
                'email': 'alexey@company.com',
                'department': 'development'
            },
            {
                'name': 'Мария Петрова',
                'position': 'UI/UX Дизайнер',
                'bio': 'Креативный дизайнер с фокусом на пользовательский опыт и современный дизайн.',
                'email': 'maria@company.com',
                'department': 'design'
            }
        ]

        created_count = 0
        for data in demo_data:
            entry, created = DynamicModelData.objects.get_or_create(
                dynamic_model=model,
                data__name=data['name'],
                defaults={
                    'data': data,
                    'is_published': True
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'✅ Создано {created_count} записей для модели "Команда"')

    def create_posts_extension(self, site):
        """Создает расширение для модели Posts"""
        fields_config = {
            'fields': [
                {
                    'name': 'reading_time',
                    'type': 'number',
                    'label': 'Время чтения (мин)',
                    'required': False,
                    'placeholder': '5',
                    'min': 1,
                    'max': 120,
                    'help_text': 'Примерное время чтения статьи в минутах'
                },
                {
                    'name': 'difficulty_level',
                    'type': 'select',
                    'label': 'Уровень сложности',
                    'required': False,
                    'options': [
                        {'value': 'beginner', 'label': 'Начинающий'},
                        {'value': 'intermediate', 'label': 'Средний'},
                        {'value': 'advanced', 'label': 'Продвинутый'},
                        {'value': 'expert', 'label': 'Эксперт'}
                    ]
                },
                {
                    'name': 'is_premium',
                    'type': 'boolean',
                    'label': 'Премиум контент',
                    'required': False,
                    'default_value': False,
                    'help_text': 'Доступен только для премиум пользователей'
                },
                {
                    'name': 'video_url',
                    'type': 'text',
                    'label': 'Ссылка на видео',
                    'required': False,
                    'placeholder': 'https://youtube.com/...',
                    'help_text': 'Ссылка на связанное видео'
                }
            ]
        }

        model, created = DynamicModel.objects.get_or_create(
            name='Расширение постов',
            site=site,
            defaults={
                'model_type': 'extension',
                'target_model': 'posts.Post',
                'description': 'Дополнительные поля для постов',
                'fields_config': fields_config,
                'validation_rules': {
                    'reading_time': {'min': 1, 'max': 120},
                    'video_url': {'type': 'url'}
                }
            }
        )

        if created:
            self.stdout.write(f'✅ Создано расширение для модели Posts')
        else:
            self.stdout.write(f'⚠️  Расширение для Posts уже существует')

        return model 