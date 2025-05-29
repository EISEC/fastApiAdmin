from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
import json


class DynamicModel(models.Model):
    """Модель для создания динамических моделей данных"""
    
    # Типы полей, которые можно создавать
    FIELD_TYPES = [
        ('text', 'Текст'),
        ('textarea', 'Многострочный текст'),
        ('number', 'Число'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('date', 'Дата'),
        ('datetime', 'Дата и время'),
        ('boolean', 'Да/Нет'),
        ('select', 'Выпадающий список'),
        ('multiselect', 'Множественный выбор'),
        ('file', 'Файл'),
        ('image', 'Изображение'),
        ('json', 'JSON'),
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
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна',
        help_text='Определяет, активна ли модель'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Динамическая модель'
        verbose_name_plural = 'Динамические модели'
        unique_together = ['site', 'name']
        ordering = ['-created_at']
        
    def __str__(self) -> str:
        return f"{self.name} - {self.site.name}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save для генерации table_name"""
        if not self.table_name:
            # Генерируем безопасное название таблицы
            safe_name = self.name.lower().replace(' ', '_').replace('-', '_')
            site_prefix = f"site_{self.site.id}"
            self.table_name = f"dynamic_{site_prefix}_{safe_name}"
            
        # Валидируем конфигурацию полей
        self.validate_fields_config()
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
