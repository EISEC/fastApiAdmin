from django.db import models
from django.utils.text import slugify
from django.contrib.auth import get_user_model

User = get_user_model()


class Page(models.Model):
    """Модель страницы"""
    
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.CASCADE,
        related_name='pages',
        verbose_name='Сайт',
        help_text='Сайт, к которому принадлежит страница'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pages',
        verbose_name='Автор',
        help_text='Автор страницы'
    )
    title = models.CharField(
        max_length=255,
        verbose_name='Заголовок',
        help_text='Заголовок страницы'
    )
    content = models.TextField(
        verbose_name='Содержание (HTML)',
        help_text='HTML содержание страницы'
    )
    slug = models.SlugField(
        max_length=255,
        verbose_name='Слаг',
        help_text='URL-дружественный идентификатор страницы'
    )
    image = models.ImageField(
        upload_to='pages/',
        null=True,
        blank=True,
        verbose_name='Изображение',
        help_text='Основное изображение страницы'
    )
    is_published = models.BooleanField(
        default=False,
        verbose_name='Опубликована',
        help_text='Определяет, опубликована ли страница'
    )
    
    # Конструктор страниц - сохраняем компоненты
    page_components = models.JSONField(
        default=list,
        verbose_name='Компоненты страницы',
        help_text='JSON массив с компонентами страницы для визуального конструктора'
    )
    compiled_css = models.TextField(
        blank=True,
        verbose_name='Скомпилированный CSS',
        help_text='CSS стили, сгенерированные из компонентов'
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
    is_homepage = models.BooleanField(
        default=False,
        verbose_name='Главная страница',
        help_text='Является ли эта страница главной страницей сайта'
    )
    template_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Название шаблона',
        help_text='Кастомный шаблон для рендеринга страницы'
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name='Порядок сортировки',
        help_text='Порядок отображения в меню'
    )
    
    # Временные метки
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата публикации',
        help_text='Дата и время публикации страницы'
    )
    
    class Meta:
        verbose_name = 'Страница'
        verbose_name_plural = 'Страницы'
        unique_together = ['site', 'slug']
        ordering = ['sort_order', '-created_at']
        indexes = [
            models.Index(fields=['site', 'is_published']),
            models.Index(fields=['site', 'is_homepage']),
            models.Index(fields=['slug']),
            models.Index(fields=['sort_order']),
        ]
        
    def __str__(self) -> str:
        return f"{self.title} - {self.site.name}"
    
    def save(self, *args, **kwargs):
        """Переопределяем save для автогенерации slug и управления главной страницей"""
        if not self.slug:
            # Создаем slug с поддержкой кириллицы
            import re
            import time
            
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
                base_slug = f"page-{int(time.time())}"
            
            unique_slug = base_slug
            num = 1
            
            # Проверяем уникальность slug в рамках сайта
            while Page.objects.filter(site=self.site, slug=unique_slug).exclude(id=self.id).exists():
                unique_slug = f"{base_slug}-{num}"
                num += 1
                
            self.slug = unique_slug
        
        # Если эта страница устанавливается как главная, 
        # снимаем флаг с других страниц сайта
        if self.is_homepage:
            Page.objects.filter(
                site=self.site,
                is_homepage=True
            ).exclude(id=self.id).update(is_homepage=False)
        
        # Автоматически устанавливаем дату публикации
        if self.is_published and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        elif not self.is_published:
            self.published_at = None
            
        super().save(*args, **kwargs)
    
    def get_absolute_url(self) -> str:
        """Возвращает абсолютный URL страницы"""
        if self.is_homepage:
            return self.site.get_absolute_url()
        return f"{self.site.get_absolute_url()}/pages/{self.slug}/"
    
    def compile_components_to_html(self) -> str:
        """Компилирует компоненты страницы в HTML"""
        if not self.page_components:
            return self.content
            
        # Здесь будет логика компиляции компонентов в HTML
        # На данном этапе просто возвращаем базовый контент
        compiled_html = ""
        
        for component in self.page_components:
            component_type = component.get('type', '')
            component_props = component.get('props', {})
            
            # Простая реализация для базовых компонентов
            if component_type == 'text':
                compiled_html += f"<div class='text-component'>{component_props.get('content', '')}</div>"
            elif component_type == 'image':
                img_src = component_props.get('src', '')
                img_alt = component_props.get('alt', '')
                compiled_html += f"<img src='{img_src}' alt='{img_alt}' class='image-component' />"
            elif component_type == 'button':
                btn_text = component_props.get('text', 'Button')
                btn_link = component_props.get('link', '#')
                compiled_html += f"<a href='{btn_link}' class='button-component'>{btn_text}</a>"
                
        return compiled_html or self.content
    
    def compile_components_to_css(self) -> str:
        """Компилирует стили компонентов в CSS"""
        if not self.page_components:
            return ""
            
        compiled_css = ""
        
        for component in self.page_components:
            component_styles = component.get('styles', {})
            component_id = component.get('id', '')
            
            if component_styles and component_id:
                css_rules = []
                for prop, value in component_styles.items():
                    css_rules.append(f"{prop}: {value}")
                
                if css_rules:
                    compiled_css += f"#{component_id} {{ {'; '.join(css_rules)}; }}\n"
                    
        return compiled_css
    
    def can_user_edit(self, user) -> bool:
        """Проверяет, может ли пользователь редактировать страницу"""
        if not user.is_authenticated:
            return False
            
        if user.has_role('superuser'):
            return True
        elif user.has_role('admin'):
            return self.site.owner == user
        elif user.has_role('author'):
            return self.author == user or user in self.site.assigned_users.all()
        
        return False
