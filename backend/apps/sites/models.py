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


class SiteRequest(models.Model):
    """Модель запроса пользователя на доступ к сайту"""
    
    STATUS_CHOICES = [
        ('pending', 'Ожидает рассмотрения'),
        ('approved', 'Одобрен'),
        ('rejected', 'Отклонен'),
    ]
    
    ROLE_CHOICES = [
        ('author', 'Автор'),
        ('editor', 'Редактор'),
    ]
    
    # Основная информация
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='site_requests',
        verbose_name='Пользователь',
        help_text='Пользователь, запрашивающий доступ'
    )
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE,
        related_name='access_requests',
        verbose_name='Сайт',
        help_text='Сайт, к которому запрашивается доступ'
    )
    requested_role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='author',
        verbose_name='Запрашиваемая роль',
        help_text='Роль, которую пользователь хочет получить'
    )
    
    # Сообщения
    message = models.TextField(
        blank=True,
        verbose_name='Сообщение от пользователя',
        help_text='Дополнительная информация о запросе'
    )
    admin_response = models.TextField(
        blank=True,
        verbose_name='Ответ администратора',
        help_text='Комментарий администратора к решению'
    )
    
    # Статус и даты
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус',
        help_text='Текущий статус запроса'
    )
    
    # Мета информация
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата рассмотрения'
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_site_requests',
        verbose_name='Рассмотрел',
        help_text='Администратор, рассмотревший запрос'
    )
    
    class Meta:
        verbose_name = 'Запрос на доступ к сайту'
        verbose_name_plural = 'Запросы на доступ к сайтам'
        ordering = ['-created_at']
        
        # Уникальность: один пользователь может иметь только один активный запрос на конкретный сайт
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'site'],
                condition=models.Q(status='pending'),
                name='unique_pending_site_request'
            )
        ]
        
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['site', 'status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self) -> str:
        return f"{self.user.username} -> {self.site.name} ({self.get_status_display()})"
    
    def can_be_reviewed_by(self, user) -> bool:
        """Проверяет, может ли пользователь рассматривать этот запрос"""
        if not user.is_authenticated:
            return False
            
        # Суперпользователь может рассматривать любые запросы
        if hasattr(user, 'role') and user.role.name == 'superuser':
            return True
            
        # Админ может рассматривать запросы только к своим сайтам
        if hasattr(user, 'role') and user.role.name == 'admin':
            return self.site.owner == user
            
        return False
    
    def approve(self, admin_user, response_message=""):
        """Одобряет запрос и назначает пользователя к сайту"""
        from django.utils import timezone
        
        if not self.can_be_reviewed_by(admin_user):
            raise PermissionError("У вас нет прав для рассмотрения этого запроса")
        
        if self.status != 'pending':
            raise ValueError("Можно одобрить только ожидающие запросы")
        
        # Обновляем статус запроса
        self.status = 'approved'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_response = response_message
        self.save()
        
        # Назначаем пользователя к сайту (через M2M поле)
        # Предполагаем, что у Site модели есть assigned_users поле
        if hasattr(self.site, 'assigned_users'):
            self.site.assigned_users.add(self.user)
        
        # Можно добавить отправку уведомления пользователю
        return True
    
    def reject(self, admin_user, response_message=""):
        """Отклоняет запрос"""
        from django.utils import timezone
        
        if not self.can_be_reviewed_by(admin_user):
            raise PermissionError("У вас нет прав для рассмотрения этого запроса")
        
        if self.status != 'pending':
            raise ValueError("Можно отклонить только ожидающие запросы")
        
        # Обновляем статус запроса
        self.status = 'rejected'
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_response = response_message
        self.save()
        
        return True
    
    @property
    def is_pending(self) -> bool:
        """Проверяет, ожидает ли запрос рассмотрения"""
        return self.status == 'pending'
    
    @property
    def is_approved(self) -> bool:
        """Проверяет, одобрен ли запрос"""
        return self.status == 'approved'
    
    @property
    def is_rejected(self) -> bool:
        """Проверяет, отклонен ли запрос"""
        return self.status == 'rejected'


class SiteStorageSettings(models.Model):
    site = models.OneToOneField(Site, on_delete=models.CASCADE, related_name='storage_settings')
    access_key = models.CharField(max_length=128, verbose_name='Access Key')
    secret_key = models.CharField(max_length=128, verbose_name='Secret Key')
    bucket_name = models.CharField(max_length=128, verbose_name='Bucket Name')
    endpoint = models.CharField(max_length=256, default='https://storage.yandexcloud.net', verbose_name='Endpoint')
    region = models.CharField(max_length=64, default='ru-central1', verbose_name='Регион')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        verbose_name = 'Настройки Object Storage'
        verbose_name_plural = 'Object Storage для сайтов'

    def __str__(self):
        return f"Object Storage для {self.site.name}"
