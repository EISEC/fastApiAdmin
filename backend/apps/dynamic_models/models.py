from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.apps import apps
import json


class DynamicModel(models.Model):
    """Модель для создания динамических моделей данных"""
    
    # Типы полей, которые можно создавать
    FIELD_TYPES = [
        ('text', 'Текст'),
        ('textarea', 'Многострочный текст'),
        ('rich_text', 'Форматированный текст'),
        ('number', 'Число'),
        ('decimal', 'Десятичное число'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('phone', 'Телефон'),
        ('date', 'Дата'),
        ('datetime', 'Дата и время'),
        ('time', 'Время'),
        ('boolean', 'Да/Нет'),
        ('select', 'Выпадающий список'),
        ('multiselect', 'Множественный выбор'),
        ('radio', 'Радиокнопки'),
        ('checkbox', 'Флажки'),
        ('file', 'Файл'),
        ('image', 'Изображение'),
        ('gallery', 'Галерея изображений'),
        ('json', 'JSON'),
        ('color', 'Цвет'),
        ('range', 'Диапазон'),
        ('rating', 'Рейтинг'),
        ('relation', 'Связь с другой моделью'),
    ]
    
    # Типы моделей
    MODEL_TYPES = [
        ('standalone', 'Отдельная модель'),
        ('extension', 'Расширение существующей модели'),
    ]
    
    name = models.CharField(
        max_length=255,
        verbose_name='Название модели',
        help_text='Название динамической модели'
    )
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.CASCADE,
        related_name='dynamic_models',
        verbose_name='Сайт',
        help_text='Сайт, к которому принадлежит модель'
    )
    model_type = models.CharField(
        max_length=20,
        choices=MODEL_TYPES,
        default='standalone',
        verbose_name='Тип модели',
        help_text='Определяет, является ли модель отдельной или расширением существующей'
    )
    target_model = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Целевая модель',
        help_text='Модель для расширения (например: posts.Post)'
    )
    fields_config = models.JSONField(
        default=dict,
        verbose_name='Конфигурация полей',
        help_text='JSON конфигурация полей модели'
    )
    table_name = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Название таблицы',
        help_text='Уникальное название таблицы в БД'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание',
        help_text='Описание назначения модели'
    )
    version = models.PositiveIntegerField(
        default=1,
        verbose_name='Версия',
        help_text='Версия модели для отслеживания изменений'
    )
    parent_model = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='versions',
        verbose_name='Родительская модель',
        help_text='Ссылка на предыдущую версию модели'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна',
        help_text='Определяет, активна ли модель'
    )
    validation_rules = models.JSONField(
        default=dict,
        verbose_name='Правила валидации',
        help_text='Дополнительные правила валидации для полей'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Динамическая модель'
        verbose_name_plural = 'Динамические модели'
        unique_together = ['site', 'name', 'version']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['site', 'is_active']),
            models.Index(fields=['model_type']),
            models.Index(fields=['target_model']),
        ]
        
    def __str__(self) -> str:
        version_str = f" v{self.version}" if self.version > 1 else ""
        return f"{self.name}{version_str} - {self.site.name}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save для генерации table_name"""
        if not self.table_name:
            # Генерируем безопасное название таблицы
            safe_name = self.name.lower().replace(' ', '_').replace('-', '_')
            site_prefix = f"site_{self.site.id}"
            if self.model_type == 'extension':
                self.table_name = f"ext_{site_prefix}_{safe_name}"
            else:
                self.table_name = f"dynamic_{site_prefix}_{safe_name}"
            
        # Валидируем конфигурацию полей
        self.validate_fields_config()
        
        # Дополнительная валидация для расширений
        if self.model_type == 'extension':
            self.validate_extension_config()
        
        super().save(*args, **kwargs)
    
    def validate_fields_config(self):
        """Валидирует конфигурацию полей"""
        if not isinstance(self.fields_config, dict):
            raise ValidationError("fields_config должен быть словарем")
            
        if 'fields' not in self.fields_config:
            raise ValidationError("fields_config должен содержать ключ 'fields'")
            
        fields = self.fields_config['fields']
        if not isinstance(fields, list):
            raise ValidationError("fields должен быть списком")
            
        for field in fields:
            if not isinstance(field, dict):
                raise ValidationError("Каждое поле должно быть словарем")
                
            required_keys = ['name', 'type', 'label']
            for key in required_keys:
                if key not in field:
                    raise ValidationError(f"Поле должно содержать ключ '{key}'")
                    
            # Проверяем, что тип поля поддерживается
            field_type = field['type']
            valid_types = [choice[0] for choice in self.FIELD_TYPES]
            if field_type not in valid_types:
                raise ValidationError(f"Неподдерживаемый тип поля: {field_type}")
    
    def validate_extension_config(self):
        """Валидирует конфигурацию для расширения модели"""
        if not self.target_model:
            raise ValidationError("Для расширения модели необходимо указать целевую модель")
        
        # Проверяем, что целевая модель существует
        try:
            app_label, model_name = self.target_model.split('.')
            apps.get_model(app_label, model_name)
        except (ValueError, LookupError):
            raise ValidationError(f"Модель '{self.target_model}' не найдена")
    
    def get_target_model_class(self):
        """Возвращает класс целевой модели"""
        if not self.target_model:
            return None
        
        try:
            app_label, model_name = self.target_model.split('.')
            return apps.get_model(app_label, model_name)
        except (ValueError, LookupError):
            return None
    
    def create_extension_fields(self):
        """Создает поля расширения для существующей модели"""
        if self.model_type != 'extension':
            return False
        
        target_model_class = self.get_target_model_class()
        if not target_model_class:
            return False
        
        # Здесь можно добавить логику создания полей расширения
        # Например, через миграции или динамическое создание полей
        return True
    
    def get_latest_version(self):
        """Возвращает последнюю версию модели"""
        return DynamicModel.objects.filter(
            site=self.site,
            name=self.name,
            is_active=True
        ).order_by('-version').first()
    
    def create_new_version(self, user=None):
        """Создает новую версию модели"""
        new_version = DynamicModel.objects.create(
            name=self.name,
            site=self.site,
            model_type=self.model_type,
            target_model=self.target_model,
            fields_config=self.fields_config.copy(),
            description=self.description,
            version=self.version + 1,
            parent_model=self,
            validation_rules=self.validation_rules.copy()
        )
        
        # Создаем запись в истории версий
        DynamicModelVersion.objects.create(
            dynamic_model=new_version,
            parent_version=self,
            created_by=user,
            changes_description="Новая версия модели"
        )
        
        return new_version
    
    def export_config(self):
        """Экспортирует конфигурацию модели"""
        return {
            'name': self.name,
            'model_type': self.model_type,
            'target_model': self.target_model,
            'description': self.description,
            'fields_config': self.fields_config,
            'validation_rules': self.validation_rules,
            'version': self.version,
            'export_timestamp': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def import_config(cls, config_data, site, user=None):
        """Импортирует конфигурацию модели"""
        # Проверяем обязательные поля
        required_fields = ['name', 'fields_config']
        for field in required_fields:
            if field not in config_data:
                raise ValidationError(f"Отсутствует обязательное поле: {field}")
        
        # Создаем новую модель
        dynamic_model = cls.objects.create(
            name=config_data['name'],
            site=site,
            model_type=config_data.get('model_type', 'standalone'),
            target_model=config_data.get('target_model'),
            description=config_data.get('description', ''),
            fields_config=config_data['fields_config'],
            validation_rules=config_data.get('validation_rules', {}),
        )
        
        return dynamic_model
    
    def get_field_names(self) -> list:
        """Возвращает список названий полей"""
        if not self.fields_config or 'fields' not in self.fields_config:
            return []
        return [field['name'] for field in self.fields_config['fields']]
    
    def get_field_by_name(self, field_name: str) -> dict:
        """Возвращает конфигурацию поля по имени"""
        if not self.fields_config or 'fields' not in self.fields_config:
            return {}
            
        for field in self.fields_config['fields']:
            if field['name'] == field_name:
                return field
        return {}
    
    def get_display_fields(self) -> list:
        """Возвращает поля для отображения в списке"""
        if not self.fields_config or 'fields' not in self.fields_config:
            return []
            
        display_fields = []
        for field in self.fields_config['fields']:
            if field.get('show_in_list', False):
                display_fields.append(field)
        
        # Если нет полей для отображения, берем первые 3
        if not display_fields:
            display_fields = self.fields_config['fields'][:3]
            
        return display_fields


class DynamicModelData(models.Model):
    """Базовая модель для хранения данных динамических моделей"""
    
    dynamic_model = models.ForeignKey(
        DynamicModel,
        on_delete=models.CASCADE,
        related_name='data_entries',
        verbose_name='Динамическая модель'
    )
    data = models.JSONField(
        default=dict,
        verbose_name='Данные',
        help_text='JSON данные записи'
    )
    is_published = models.BooleanField(
        default=True,
        verbose_name='Опубликовано',
        help_text='Определяет, опубликована ли запись'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Данные динамической модели'
        verbose_name_plural = 'Данные динамических моделей'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['dynamic_model', 'is_published']),
            models.Index(fields=['-created_at']),
        ]
        
    def __str__(self) -> str:
        # Пытаемся найти подходящее поле для отображения
        display_field = self.get_display_value()
        return f"{self.dynamic_model.name} - {display_field}"
    
    def get_display_value(self) -> str:
        """Возвращает значение для отображения записи"""
        if not self.data:
            return f"Запись #{self.id}"
            
        # Ищем поле title, name или первое текстовое поле
        priority_fields = ['title', 'name', 'название', 'заголовок']
        
        for field_name in priority_fields:
            if field_name in self.data and self.data[field_name]:
                return str(self.data[field_name])[:50]
        
        # Если ничего не найдено, берем первое непустое значение
        for key, value in self.data.items():
            if value and isinstance(value, (str, int, float)):
                return f"{key}: {str(value)[:30]}"
                
        return f"Запись #{self.id}"
    
    def validate_data(self):
        """Валидирует данные в соответствии с конфигурацией модели"""
        fields_config = self.dynamic_model.fields_config
        if not fields_config or 'fields' not in fields_config:
            return
            
        errors = []
        
        for field_config in fields_config['fields']:
            field_name = field_config['name']
            field_type = field_config['type']
            is_required = field_config.get('required', False)
            
            # Проверка обязательности
            if is_required and (field_name not in self.data or not self.data[field_name]):
                errors.append(f"Поле '{field_config['label']}' обязательно для заполнения")
                continue
            
            # Проверка типов данных
            if field_name in self.data and self.data[field_name]:
                value = self.data[field_name]
                
                if field_type == 'number':
                    try:
                        float(value)
                    except (ValueError, TypeError):
                        errors.append(f"Поле '{field_config['label']}' должно быть числом")
                
                elif field_type == 'email':
                    import re
                    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                    if not re.match(email_pattern, str(value)):
                        errors.append(f"Поле '{field_config['label']}' должно содержать корректный email")
                
                elif field_type == 'url':
                    import re
                    url_pattern = r'^https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$'
                    if not re.match(url_pattern, str(value)):
                        errors.append(f"Поле '{field_config['label']}' должно содержать корректный URL")
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """Переопределяем save для валидации данных"""
        self.validate_data()
        super().save(*args, **kwargs)
    
    def get_field_value(self, field_name: str, default=None):
        """Безопасно получает значение поля"""
        return self.data.get(field_name, default)
    
    def set_field_value(self, field_name: str, value):
        """Устанавливает значение поля"""
        if not isinstance(self.data, dict):
            self.data = {}
        self.data[field_name] = value
    
    def to_dict(self) -> dict:
        """Возвращает данные в виде словаря с метаинформацией"""
        return {
            'id': self.id,
            'dynamic_model': self.dynamic_model.name,
            'data': self.data,
            'is_published': self.is_published,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class DynamicModelVersion(models.Model):
    """Модель для отслеживания версий динамических моделей"""
    
    dynamic_model = models.ForeignKey(
        DynamicModel,
        on_delete=models.CASCADE,
        related_name='version_history',
        verbose_name='Динамическая модель'
    )
    parent_version = models.ForeignKey(
        DynamicModel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_versions',
        verbose_name='Родительская версия'
    )
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Создано пользователем'
    )
    changes_description = models.TextField(
        blank=True,
        verbose_name='Описание изменений',
        help_text='Описание изменений в этой версии'
    )
    is_rollback = models.BooleanField(
        default=False,
        verbose_name='Откат',
        help_text='Является ли эта версия откатом к предыдущей'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Версия динамической модели'
        verbose_name_plural = 'Версии динамических моделей'
        ordering = ['-created_at']
        
    def __str__(self) -> str:
        return f"{self.dynamic_model.name} v{self.dynamic_model.version}"


class DynamicFieldType(models.Model):
    """Расширенная конфигурация типов полей"""
    
    FIELD_CATEGORIES = [
        ('text', 'Текстовые'),
        ('number', 'Числовые'),
        ('date', 'Дата и время'),
        ('media', 'Медиа'),
        ('select', 'Выбор'),
        ('relation', 'Связи'),
        ('special', 'Специальные'),
    ]
    
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Название типа',
        help_text='Уникальное название типа поля'
    )
    label = models.CharField(
        max_length=255,
        verbose_name='Отображаемое название'
    )
    category = models.CharField(
        max_length=20,
        choices=FIELD_CATEGORIES,
        verbose_name='Категория'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание',
        help_text='Описание назначения типа поля'
    )
    default_config = models.JSONField(
        default=dict,
        verbose_name='Конфигурация по умолчанию',
        help_text='JSON конфигурация по умолчанию для этого типа поля'
    )
    validation_rules = models.JSONField(
        default=dict,
        verbose_name='Правила валидации',
        help_text='Правила валидации для этого типа поля'
    )
    ui_component = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='UI компонент',
        help_text='Название React компонента для отображения'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Тип поля'
        verbose_name_plural = 'Типы полей'
        ordering = ['category', 'label']
        
    def __str__(self) -> str:
        return f"{self.label} ({self.name})"


class DynamicModelExtension(models.Model):
    """Модель для управления расширениями существующих моделей"""
    
    EXTENSION_TYPES = [
        ('field_addition', 'Добавление полей'),
        ('field_modification', 'Модификация полей'),
        ('method_addition', 'Добавление методов'),
        ('validation_rules', 'Дополнительная валидация'),
    ]
    
    dynamic_model = models.OneToOneField(
        DynamicModel,
        on_delete=models.CASCADE,
        related_name='extension_config',
        verbose_name='Динамическая модель'
    )
    target_model = models.CharField(
        max_length=255,
        verbose_name='Целевая модель',
        help_text='Полное название модели (app.Model)'
    )
    extension_type = models.CharField(
        max_length=20,
        choices=EXTENSION_TYPES,
        default='field_addition',
        verbose_name='Тип расширения'
    )
    field_mappings = models.JSONField(
        default=dict,
        verbose_name='Маппинг полей',
        help_text='Соответствие полей динамической модели полям целевой модели'
    )
    relation_config = models.JSONField(
        default=dict,
        verbose_name='Конфигурация связей',
        help_text='Настройки связей с целевой моделью'
    )
    migration_applied = models.BooleanField(
        default=False,
        verbose_name='Миграция применена',
        help_text='Были ли применены изменения в базе данных'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активно'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Расширение модели'
        verbose_name_plural = 'Расширения моделей'
        unique_together = ['dynamic_model', 'target_model']
        
    def __str__(self) -> str:
        return f"{self.dynamic_model.name} -> {self.target_model}"
    
    def get_target_model_class(self):
        """Возвращает класс целевой модели"""
        try:
            app_label, model_name = self.target_model.split('.')
            return apps.get_model(app_label, model_name)
        except (ValueError, LookupError):
            return None
    
    def apply_extension(self):
        """Применяет расширение к целевой модели"""
        target_model_class = self.get_target_model_class()
        if not target_model_class:
            raise ValidationError(f"Модель {self.target_model} не найдена")
        
        # Здесь будет логика применения расширения
        # В зависимости от типа расширения
        if self.extension_type == 'field_addition':
            return self._apply_field_addition(target_model_class)
        elif self.extension_type == 'validation_rules':
            return self._apply_validation_rules(target_model_class)
        
        return False
    
    def _apply_field_addition(self, target_model_class):
        """Применяет добавление полей"""
        # Логика добавления полей через миграции
        # или динамическое создание полей
        self.migration_applied = True
        self.save()
        return True
    
    def _apply_validation_rules(self, target_model_class):
        """Применяет дополнительные правила валидации"""
        # Логика добавления валидационных правил
        return True


class DynamicModelPermission(models.Model):
    """Модель для управления правами доступа к динамическим моделям"""
    
    PERMISSION_TYPES = [
        ('view', 'Просмотр'),
        ('add', 'Добавление'),
        ('change', 'Изменение'),
        ('delete', 'Удаление'),
        ('manage', 'Управление моделью'),
    ]
    
    dynamic_model = models.ForeignKey(
        DynamicModel,
        on_delete=models.CASCADE,
        related_name='custom_permissions',
        verbose_name='Динамическая модель'
    )
    user = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        verbose_name='Пользователь'
    )
    role = models.ForeignKey(
        'accounts.Role',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        verbose_name='Роль'
    )
    permission_type = models.CharField(
        max_length=20,
        choices=PERMISSION_TYPES,
        verbose_name='Тип разрешения'
    )
    field_restrictions = models.JSONField(
        default=dict,
        verbose_name='Ограничения на поля',
        help_text='Ограничения доступа к конкретным полям'
    )
    conditions = models.JSONField(
        default=dict,
        verbose_name='Условия',
        help_text='Дополнительные условия для применения разрешения'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активно'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Разрешение для динамической модели'
        verbose_name_plural = 'Разрешения для динамических моделей'
        unique_together = ['dynamic_model', 'user', 'role', 'permission_type']
        
    def __str__(self) -> str:
        target = self.user.email if self.user else self.role.name
        return f"{self.dynamic_model.name} - {target} - {self.get_permission_type_display()}"
    
    def check_permission(self, user, field_name=None):
        """Проверяет разрешение для пользователя"""
        # Проверяем основное разрешение
        if self.user and self.user != user:
            return False
        
        if self.role and user.role != self.role:
            return False
        
        # Проверяем ограничения на поля
        if field_name and self.field_restrictions:
            restricted_fields = self.field_restrictions.get('restricted', [])
            if field_name in restricted_fields:
                return False
        
        # Проверяем дополнительные условия
        if self.conditions:
            # Здесь может быть более сложная логика проверки условий
            pass
        
        return self.is_active
