from django.db import models
from django.contrib.auth import get_user_model
from apps.sites.models import Site

User = get_user_model()


class SettingCategory(models.Model):
    """Модель категории настроек"""
    id = models.CharField(max_length=50, primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=10, default='⚙️', verbose_name='Иконка')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Категория настроек'
        verbose_name_plural = 'Категории настроек'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class SettingGroup(models.Model):
    """Модель группы настроек"""
    id = models.CharField(max_length=50, primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=10, blank=True, verbose_name='Иконка')
    category = models.ForeignKey(
        SettingCategory, 
        on_delete=models.CASCADE, 
        related_name='groups', 
        verbose_name='Категория'
    )
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Группа настроек'
        verbose_name_plural = 'Группы настроек'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Setting(models.Model):
    """Модель настройки"""
    SETTING_TYPES = [
        ('text', 'Текст'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('password', 'Пароль'),
        ('number', 'Число'),
        ('boolean', 'Переключатель'),
        ('select', 'Выпадающий список'),
        ('textarea', 'Многострочный текст'),
        ('color', 'Цвет'),
        ('file', 'Файл'),
        ('image', 'Изображение'),
        ('json', 'JSON'),
        ('rich_text', 'Форматированный текст'),
    ]

    key = models.CharField(max_length=100, unique=True, verbose_name='Ключ')
    label = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    type = models.CharField(max_length=20, choices=SETTING_TYPES, verbose_name='Тип')
    value = models.JSONField(null=True, blank=True, verbose_name='Значение')
    default_value = models.JSONField(null=True, blank=True, verbose_name='Значение по умолчанию')
    
    group = models.ForeignKey(
        SettingGroup, 
        on_delete=models.CASCADE, 
        related_name='settings', 
        verbose_name='Группа'
    )
    site = models.ForeignKey(
        Site, 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='settings',
        verbose_name='Сайт'
    )
    
    # Валидация и ограничения
    is_required = models.BooleanField(default=False, verbose_name='Обязательное')
    is_readonly = models.BooleanField(default=False, verbose_name='Только для чтения')
    validation_rules = models.JSONField(
        null=True, 
        blank=True, 
        verbose_name='Правила валидации',
        help_text='JSON с правилами валидации'
    )
    options = models.JSONField(
        null=True, 
        blank=True, 
        verbose_name='Опции',
        help_text='Опции для select типов'
    )
    
    # Метаданные
    placeholder = models.CharField(max_length=255, blank=True, verbose_name='Placeholder')
    help_text = models.TextField(blank=True, verbose_name='Текст справки')
    help_url = models.URLField(blank=True, verbose_name='Ссылка на справку')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    updated_by = models.ForeignKey(
        User, 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL,
        verbose_name='Изменил'
    )

    class Meta:
        verbose_name = 'Настройка'
        verbose_name_plural = 'Настройки'
        ordering = ['group__order', 'order', 'label']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['group', 'order']),
            models.Index(fields=['site']),
        ]

    def __str__(self):
        return f"{self.key}: {self.label}"

    def get_value(self):
        """Безопасное получение значения настройки"""
        try:
            if self.value is None:
                return self.default_value
            
            # Приведение типов
            if self.type == 'boolean':
                if isinstance(self.value, bool):
                    return self.value
                if isinstance(self.value, str):
                    return self.value.lower() in ('true', '1', 'yes', 'on')
                return bool(self.value)
            elif self.type == 'number':
                try:
                    return int(self.value) if self.value else 0
                except (ValueError, TypeError):
                    return 0
            elif self.type == 'json' and isinstance(self.value, str):
                try:
                    import json
                    return json.loads(self.value)
                except (json.JSONDecodeError, TypeError):
                    return {}
            else:
                return self.value
                
        except Exception:
            return self.default_value

    def set_value(self, value, user=None):
        """Безопасное установление значения настройки"""
        try:
            # Валидация для readonly настроек
            if self.is_readonly:
                raise ValueError(f"Настройка '{self.key}' доступна только для чтения")
            
            # Валидация обязательных полей
            if self.is_required and (value is None or value == ''):
                raise ValueError(f"Настройка '{self.key}' обязательна для заполнения")
            
            # Преобразование типов
            if self.type == 'boolean':
                if isinstance(value, str):
                    value = value.lower() in ('true', '1', 'yes', 'on')
                else:
                    value = bool(value)
            elif self.type == 'number':
                value = int(value) if value else 0
            elif self.type == 'json':
                if isinstance(value, (dict, list)):
                    import json
                    value = json.dumps(value)
            
            self.value = value
            if user:
                self.updated_by = user
            self.save()
            
        except Exception as e:
            raise ValueError(f"Ошибка установки значения для '{self.key}': {str(e)}")


class SettingTemplate(models.Model):
    """Модель шаблона настроек"""
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(blank=True, verbose_name='Описание')
    settings_data = models.JSONField(verbose_name='Данные настроек')
    is_public = models.BooleanField(default=False, verbose_name='Публичный')
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='setting_templates',
        verbose_name='Создал'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Шаблон настроек'
        verbose_name_plural = 'Шаблоны настроек'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
