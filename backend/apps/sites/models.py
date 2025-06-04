from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Site(models.Model):
    """Модель сайта"""
    
    name = models.CharField(
        max_length=255,
        verbose_name='Название сайта',
        help_text='Отображаемое название сайта'
    )
    domain = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Домен',
        help_text='Уникальный домен сайта (например: example.com)'
    )
    header_scripts = models.TextField(
        blank=True,
        verbose_name='Скрипты в header',
        help_text='HTML код скриптов для вставки в head секцию'
    )
    footer_scripts = models.TextField(
        blank=True,
        verbose_name='Скрипты в footer',
        help_text='HTML код скриптов для вставки в footer секцию'
    )
    main_screen_settings = models.JSONField(
        default=dict,
        verbose_name='Настройки главного экрана',
        help_text='JSON с настройками главной страницы'
    )
    seo_settings = models.JSONField(
        default=dict,
        verbose_name='SEO настройки',
        help_text='JSON с SEO настройками сайта'
    )
    
    # Изображения
    icon = models.ImageField(
        upload_to='sites/icons/',
        null=True,
        blank=True,
        verbose_name='Иконка сайта',
        help_text='Favicon сайта'
    )
    default_image = models.ImageField(
        upload_to='sites/defaults/',
        null=True,
        blank=True,
        verbose_name='Изображение по умолчанию',
        help_text='Изображение, используемое по умолчанию'
    )
    main_screen_image = models.ImageField(
        upload_to='sites/main/',
        null=True,
        blank=True,
        verbose_name='Изображение главного экрана',
        help_text='Основное изображение для главной страницы'
    )
    error_403_image = models.ImageField(
        upload_to='sites/errors/',
        null=True,
        blank=True,
        verbose_name='Изображение ошибки 403',
        help_text='Изображение для страницы ошибки 403'
    )
    error_404_image = models.ImageField(
        upload_to='sites/errors/',
        null=True,
        blank=True,
        verbose_name='Изображение ошибки 404',
        help_text='Изображение для страницы ошибки 404'
    )
    error_4xx_image = models.ImageField(
        upload_to='sites/errors/',
        null=True,
        blank=True,
        verbose_name='Изображение ошибки 4xx',
        help_text='Изображение для страниц ошибок 4xx'
    )
    error_5xx_image = models.ImageField(
        upload_to='sites/errors/',
        null=True,
        blank=True,
        verbose_name='Изображение ошибки 5xx',
        help_text='Изображение для страниц ошибок 5xx'
    )
    
    # Мета информация
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_sites',
        verbose_name='Владелец',
        help_text='Пользователь-владелец сайта'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен',
        help_text='Определяет, активен ли сайт'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Сайт'
        verbose_name_plural = 'Сайты'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['owner', 'is_active']),
            models.Index(fields=['-created_at']),
        ]
        
    def __str__(self) -> str:
        return f"{self.name} ({self.domain})"
    
    def get_absolute_url(self) -> str:
        """Возвращает абсолютный URL сайта"""
        return f"https://{self.domain}"
    
    def get_posts_count(self):
        """Получить количество опубликованных постов"""
        return self.posts.filter(status='published').count()
    
    def get_pages_count(self) -> int:
        """Возвращает количество страниц на сайте"""
        return self.pages.filter(is_published=True).count()
    
    def get_authors(self):
        """Возвращает всех авторов, назначенных на сайт"""
        return self.assigned_users.filter(role__name='author')
    
    def can_user_access(self, user) -> bool:
        """Проверяет, может ли пользователь получить доступ к сайту"""
        if not user.is_authenticated:
            return False
            
        if user.has_role('superuser'):
            return True
        elif user.has_role('admin'):
            return self.owner == user
        elif user.has_role('author'):
            return user in self.assigned_users.all()
        
        return False
