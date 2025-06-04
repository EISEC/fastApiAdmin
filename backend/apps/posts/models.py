from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
import uuid
import re
import time
from apps.sites.models import Site

User = get_user_model()


class Category(models.Model):
    """Модель категории для постов"""
    name = models.CharField(max_length=255, verbose_name='Название')
    slug = models.SlugField(max_length=255, unique=True, verbose_name='Слаг')
    description = models.TextField(blank=True, verbose_name='Описание')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='categories', verbose_name='Сайт')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, 
                             related_name='children', verbose_name='Родительская категория')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['order', 'name']
        unique_together = ['site', 'slug']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    """Модель тега для постов"""
    name = models.CharField(max_length=100, verbose_name='Название')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Слаг')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='tags', verbose_name='Сайт')
    color = models.CharField(max_length=7, default='#3B82F6', verbose_name='Цвет')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        verbose_name = 'Тег'
        verbose_name_plural = 'Теги'
        ordering = ['name']
        unique_together = ['site', 'slug']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Post(models.Model):
    """Модель поста"""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
        ('scheduled', 'Запланирован'),
        ('archived', 'В архиве'),
    ]
    
    VISIBILITY_CHOICES = [
        ('public', 'Публичный'),
        ('private', 'Приватный'),
        ('password', 'Защищенный паролем'),
    ]
    
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    slug = models.SlugField(max_length=255, verbose_name='Слаг')
    content = models.TextField(verbose_name='Содержание')
    excerpt = models.TextField(blank=True, verbose_name='Краткое описание')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Статус')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public', verbose_name='Видимость')
    
    # Отношения
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='posts', verbose_name='Сайт')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts', verbose_name='Автор')
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, 
                               related_name='posts', verbose_name='Категория')
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts', verbose_name='Теги')
    
    # SEO и метаданные
    meta_title = models.CharField(max_length=60, blank=True, verbose_name='SEO заголовок')
    meta_description = models.CharField(max_length=160, blank=True, verbose_name='SEO описание')
    meta_keywords = models.CharField(max_length=255, blank=True, verbose_name='SEO ключевые слова')
    featured_image = models.ImageField(upload_to='posts/featured/', blank=True, null=True, 
                                     verbose_name='Изображение записи')
    
    # Даты
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата публикации')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    # Дополнительные поля
    views_count = models.PositiveIntegerField(default=0, verbose_name='Количество просмотров')
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендуемый')
    allow_comments = models.BooleanField(default=True, verbose_name='Разрешить комментарии')
    
    class Meta:
        verbose_name = 'Пост'
        verbose_name_plural = 'Посты'
        ordering = ['-created_at']
        unique_together = ['site', 'slug']
        indexes = [
            models.Index(fields=['site', 'status']),
            models.Index(fields=['published_at']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self) -> str:
        """Возвращает абсолютный URL поста"""
        return f"{self.site.get_absolute_url()}/posts/{self.slug}/"
    
    def calculate_reading_time(self) -> int:
        """Вычисляет примерное время чтения в минутах"""
        if not self.content:
            return 0
            
        # Среднее количество слов в минуту при чтении
        words_per_minute = 200
        word_count = len(self.content.split())
        reading_time = max(1, round(word_count / words_per_minute))
        
        return reading_time
    
    def increment_views(self) -> None:
        """Увеличивает счетчик просмотров"""
        self.views_count += 1
        self.save(update_fields=['views_count'])
    
    def get_excerpt(self, length: int = 150) -> str:
        """Возвращает краткое описание поста"""
        if len(self.content) <= length:
            return self.content
        return self.content[:length].rsplit(' ', 1)[0] + '...'
    
    def can_user_edit(self, user) -> bool:
        """Проверяет, может ли пользователь редактировать пост"""
        if not user.is_authenticated:
            return False
            
        if user.has_role('superuser'):
            return True
        elif user.has_role('admin'):
            return self.site.owner == user
        elif user.has_role('author'):
            return self.author == user or user in self.site.assigned_users.all()
        
        return False
