from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.common.models import BaseModel

User = get_user_model()


class AnalyticsEvent(BaseModel):
    """
    Модель для хранения событий аналитики
    """
    EVENT_TYPES = [
        ('api_request', 'API Request'),
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('post_view', 'Post View'),
        ('post_create', 'Post Create'),
        ('site_visit', 'Site Visit'),
        ('page_view', 'Page View'),
        ('error_occurred', 'Error Occurred'),
    ]
    
    event_type = models.CharField(
        max_length=50, 
        choices=EVENT_TYPES,
        verbose_name='Тип события'
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Пользователь'
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        verbose_name='IP адрес'
    )
    user_agent = models.TextField(
        null=True, 
        blank=True,
        verbose_name='User Agent'
    )
    url = models.URLField(
        max_length=500,
        null=True, 
        blank=True,
        verbose_name='URL'
    )
    method = models.CharField(
        max_length=10,
        null=True, 
        blank=True,
        verbose_name='HTTP метод'
    )
    status_code = models.IntegerField(
        null=True, 
        blank=True,
        verbose_name='HTTP статус'
    )
    response_time = models.FloatField(
        null=True, 
        blank=True,
        verbose_name='Время ответа (мс)'
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Дополнительные данные'
    )
    
    class Meta:
        verbose_name = 'Событие аналитики'
        verbose_name_plural = 'События аналитики'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.created_at}"


class DailyStats(BaseModel):
    """
    Ежедневная статистика для быстрого доступа
    """
    date = models.DateField(
        unique=True,
        verbose_name='Дата'
    )
    total_requests = models.IntegerField(
        default=0,
        verbose_name='Всего запросов'
    )
    unique_users = models.IntegerField(
        default=0,
        verbose_name='Уникальных пользователей'
    )
    new_users = models.IntegerField(
        default=0,
        verbose_name='Новых пользователей'
    )
    total_posts = models.IntegerField(
        default=0,
        verbose_name='Всего постов'
    )
    new_posts = models.IntegerField(
        default=0,
        verbose_name='Новых постов'
    )
    avg_response_time = models.FloatField(
        default=0,
        verbose_name='Среднее время ответа'
    )
    error_rate = models.FloatField(
        default=0,
        verbose_name='Процент ошибок'
    )
    cache_hit_rate = models.FloatField(
        default=0,
        verbose_name='Cache Hit Rate'
    )
    
    class Meta:
        verbose_name = 'Ежедневная статистика'
        verbose_name_plural = 'Ежедневная статистика'
        ordering = ['-date']
    
    def __str__(self):
        return f"Статистика за {self.date}"


class UserSession(BaseModel):
    """
    Сессии пользователей для аналитики активности
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Пользователь'
    )
    session_id = models.CharField(
        max_length=255,
        verbose_name='ID сессии'
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        verbose_name='IP адрес'
    )
    user_agent = models.TextField(
        null=True, 
        blank=True,
        verbose_name='User Agent'
    )
    started_at = models.DateTimeField(
        default=timezone.now,
        verbose_name='Начало сессии'
    )
    last_activity = models.DateTimeField(
        default=timezone.now,
        verbose_name='Последняя активность'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    duration = models.DurationField(
        null=True, 
        blank=True,
        verbose_name='Длительность'
    )
    
    class Meta:
        verbose_name = 'Пользовательская сессия'
        verbose_name_plural = 'Пользовательские сессии'
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['last_activity']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.started_at}" 