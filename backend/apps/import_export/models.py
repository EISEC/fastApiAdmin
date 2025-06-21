from django.db import models
from django.contrib.auth import get_user_model
from apps.sites.models import Site
import json

User = get_user_model()


class ImportSource(models.Model):
    """Источники импорта"""
    PLATFORM_CHOICES = [
        ('wordpress', 'WordPress'),
        ('drupal', 'Drupal'),
        ('joomla', 'Joomla'),
        ('csv', 'CSV файл'),
        ('json', 'JSON файл'),
        ('xml', 'XML файл'),
    ]
    
    name = models.CharField(max_length=255, verbose_name='Название источника')
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES, verbose_name='Платформа')
    description = models.TextField(blank=True, verbose_name='Описание')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Источник импорта'
        verbose_name_plural = 'Источники импорта'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_platform_display()})"


class ImportJob(models.Model):
    """Задача импорта"""
    STATUS_CHOICES = [
        ('pending', 'Ожидает'),
        ('processing', 'Обрабатывается'),
        ('completed', 'Завершен'),
        ('failed', 'Ошибка'),
        ('cancelled', 'Отменен'),
    ]
    
    CONTENT_TYPE_CHOICES = [
        ('posts', 'Посты'),
        ('pages', 'Страницы'),
        ('categories', 'Категории'),
        ('tags', 'Теги'),
        ('users', 'Пользователи'),
        ('media', 'Медиафайлы'),
        ('all', 'Все данные'),
    ]
    
    name = models.CharField(max_length=255, verbose_name='Название задачи')
    source = models.ForeignKey(ImportSource, on_delete=models.CASCADE, 
                              related_name='import_jobs', verbose_name='Источник')
    target_site = models.ForeignKey(Site, on_delete=models.CASCADE, 
                                   related_name='import_jobs', verbose_name='Целевой сайт')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, 
                                  related_name='import_jobs', verbose_name='Создано пользователем')
    
    # Настройки импорта
    content_types = models.JSONField(default=list, verbose_name='Типы контента для импорта')
    import_settings = models.JSONField(default=dict, verbose_name='Настройки импорта')
    
    # Файлы
    source_file = models.FileField(upload_to='imports/', blank=True, null=True, 
                                  verbose_name='Файл источника')
    
    # Статус и результаты
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', 
                             verbose_name='Статус')
    progress = models.PositiveIntegerField(default=0, verbose_name='Прогресс (%)')
    
    # Статистика
    total_items = models.PositiveIntegerField(default=0, verbose_name='Всего элементов')
    processed_items = models.PositiveIntegerField(default=0, verbose_name='Обработано элементов')
    imported_items = models.PositiveIntegerField(default=0, verbose_name='Импортировано элементов')
    failed_items = models.PositiveIntegerField(default=0, verbose_name='Ошибок импорта')
    
    # Результаты и ошибки
    results = models.JSONField(default=dict, verbose_name='Результаты импорта')
    errors = models.JSONField(default=list, verbose_name='Ошибки импорта')
    
    # Даты
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='Время начала')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Время завершения')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        verbose_name = 'Задача импорта'
        verbose_name_plural = 'Задачи импорта'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"
    
    def get_progress_percentage(self):
        """Возвращает прогресс в процентах"""
        if self.total_items == 0:
            return 0
        return min(100, (self.processed_items / self.total_items) * 100)
    
    def get_success_rate(self):
        """Возвращает процент успешного импорта"""
        if self.processed_items == 0:
            return 0
        return (self.imported_items / self.processed_items) * 100


class ImportMapping(models.Model):
    """Маппинг полей при импорте"""
    job = models.ForeignKey(ImportJob, on_delete=models.CASCADE, 
                           related_name='field_mappings', verbose_name='Задача импорта')
    source_field = models.CharField(max_length=255, verbose_name='Поле источника')
    target_field = models.CharField(max_length=255, verbose_name='Целевое поле')
    field_type = models.CharField(max_length=50, verbose_name='Тип поля')
    transformation_rules = models.JSONField(default=dict, verbose_name='Правила трансформации')
    is_required = models.BooleanField(default=False, verbose_name='Обязательное поле')
    default_value = models.TextField(blank=True, verbose_name='Значение по умолчанию')
    
    class Meta:
        verbose_name = 'Маппинг полей'
        verbose_name_plural = 'Маппинги полей'
        unique_together = ['job', 'source_field']
    
    def __str__(self):
        return f"{self.source_field} → {self.target_field}"


class ImportLog(models.Model):
    """Лог импорта"""
    LEVEL_CHOICES = [
        ('info', 'Информация'),
        ('warning', 'Предупреждение'),
        ('error', 'Ошибка'),
        ('success', 'Успех'),
    ]
    
    job = models.ForeignKey(ImportJob, on_delete=models.CASCADE, 
                           related_name='logs', verbose_name='Задача импорта')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name='Уровень')
    message = models.TextField(verbose_name='Сообщение')
    details = models.JSONField(default=dict, blank=True, verbose_name='Детали')
    item_id = models.CharField(max_length=255, blank=True, verbose_name='ID элемента')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Время создания')
    
    class Meta:
        verbose_name = 'Лог импорта'
        verbose_name_plural = 'Логи импорта'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_level_display()}: {self.message[:50]}"
