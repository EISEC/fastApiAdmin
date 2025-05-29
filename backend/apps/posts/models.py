from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model
import uuid
import re
import time

User = get_user_model()


class Post(models.Model):
    """Модель поста"""
    
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.CASCADE,
        related_name='posts',
        verbose_name='Сайт',
        help_text='Сайт, к которому принадлежит пост'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts',
        verbose_name='Автор',
        help_text='Автор поста'
    )
    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок',
        help_text='Заголовок поста'
    )
    content = models.TextField(
        verbose_name='Содержание',
        help_text='Основное содержание поста'
    )
    slug = models.SlugField(
        max_length=255,
        verbose_name='Слаг',
        help_text='URL-дружественный идентификатор поста'
    )
    image = models.ImageField(
        upload_to='posts/',
        null=True,
        blank=True,
        verbose_name='Изображение',
        help_text='Основное изображение поста'
    )
    is_published = models.BooleanField(
        default=False,
        verbose_name='Опубликован',
        help_text='Определяет, опубликован ли пост'
    )
    
    # SEO поля
    meta_title = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Meta Title',
        help_text='SEO заголовок страницы'
    )
    meta_description = models.TextField(
        max_length=500,
        blank=True,
        verbose_name='Meta Description',
        help_text='SEO описание страницы'
    )
    meta_keywords = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Meta Keywords',
        help_text='SEO ключевые слова'
    )
    
    # Дополнительные поля
    views_count = models.PositiveIntegerField(
        default=0,
        verbose_name='Количество просмотров',
        help_text='Счетчик просмотров поста'
    )
    reading_time = models.PositiveIntegerField(
        default=0,
        verbose_name='Время чтения (мин)',
        help_text='Примерное время чтения в минутах'
    )
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата публикации',
        help_text='Дата и время публикации поста'
    )
    
    class Meta:
        verbose_name = 'Пост'
        verbose_name_plural = 'Посты'
        unique_together = ['site', 'slug']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['site', 'is_published']),
            models.Index(fields=['author', 'is_published']),
            models.Index(fields=['slug']),
            models.Index(fields=['-published_at']),
        ]
        
    def __str__(self) -> str:
        return f"{self.title} - {self.site.name}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save для автогенерации slug"""
        if not self.slug:
            # Создаем slug с поддержкой кириллицы
            
            # Берем заголовок и приводим к нижнему регистру
            title_slug = self.title.lower()
            
            # Заменяем кириллицу на латиницу (транслитерация)
            cyrillic_to_latin = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
                'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
                'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
            }
            
            for cyrillic, latin in cyrillic_to_latin.items():
                title_slug = title_slug.replace(cyrillic, latin)
            
            # Удаляем все символы кроме букв, цифр и дефисов
            title_slug = re.sub(r'[^a-z0-9\-]', '-', title_slug)
            
            # Убираем множественные дефисы
            title_slug = re.sub(r'-+', '-', title_slug)
            
            # Убираем дефисы в начале и конце
            base_slug = title_slug.strip('-')
            
            # Если slug пустой, используем fallback
            if not base_slug:
                base_slug = f"post-{int(time.time())}"
            
            unique_slug = base_slug
            num = 1
            
            # Проверяем уникальность slug в рамках сайта
            while Post.objects.filter(site=self.site, slug=unique_slug).exclude(id=self.id).exists():
                unique_slug = f"{base_slug}-{num}"
                num += 1
                
            self.slug = unique_slug
        
        # Автоматически устанавливаем дату публикации
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        elif not self.is_published:
            self.published_at = None
            
        # Автоматически вычисляем время чтения
        if self.content and not self.reading_time:
            self.reading_time = self.calculate_reading_time()
            
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
