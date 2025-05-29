from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Q
from django.utils.safestring import mark_safe
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Админка для постов"""
    
    list_display = [
        'title', 'author', 'site', 'is_published',
        'image_preview', 'views_count', 'reading_time', 
        'published_at'
    ]
    list_filter = [
        'is_published', 'site', 'author__role', 
        'published_at', 'created_at'
    ]
    search_fields = [
        'title', 'content', 'author__email', 
        'site__name'
    ]
    readonly_fields = [
        'slug', 'views_count', 'reading_time', 'created_at', 
        'updated_at', 'image_preview'
    ]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'content')
        }),
        ('Настройки публикации', {
            'fields': ('site', 'author', 'is_published', 'published_at')
        }),
        ('Изображения', {
            'fields': ('image', 'image_preview'),
            'classes': ('collapse',)
        }),
        ('SEO настройки', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Статистика', {
            'fields': ('views_count', 'reading_time'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """Превью изображения поста"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 100px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        return format_html(
            '<div style="width: 200px; height: 100px; background-color: #f0f0f0; '
            'display: flex; align-items: center; justify-content: center; color: #666; border-radius: 4px;">'
            'Нет изображения</div>'
        )
    
    image_preview.short_description = 'Изображение'
    
    def get_queryset(self, request):
        """Оптимизация запросов и фильтрация по ролям"""
        queryset = super().get_queryset(request).select_related(
            'author', 'site', 'author__role'
        )
        
        # Фильтрация по ролям
        if request.user.is_superuser:
            return queryset
        elif hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                # Админ видит посты только своих сайтов
                return queryset.filter(site__owner=request.user)
            elif request.user.role.name == 'author':
                # Автор видит только свои посты
                return queryset.filter(author=request.user).distinct()
        
        return queryset.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Фильтрация полей по ролям"""
        if db_field.name == "site":
            if request.user.is_superuser:
                pass  # Суперюзер видит все сайты
            elif hasattr(request.user, 'role'):
                if request.user.role.name == 'admin':
                    kwargs["queryset"] = kwargs["queryset"].filter(owner=request.user)
                elif request.user.role.name == 'author':
                    kwargs["queryset"] = kwargs["queryset"].filter(owner__role__name__in=['admin', 'superuser'])
                else:
                    kwargs["queryset"] = kwargs["queryset"].none()
        
        if db_field.name == "author":
            if not request.user.is_superuser:
                # Ограничиваем выбор авторов
                kwargs["queryset"] = kwargs["queryset"].filter(
                    role__name__in=['admin', 'author']
                )
        
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        """Проверка прав на изменение"""
        if obj is None:
            return True
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                return obj.site.owner == request.user
            elif request.user.role.name == 'author':
                return obj.author == request.user
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Проверка прав на удаление"""
        if obj is None:
            return True
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                return obj.site.owner == request.user
            elif request.user.role.name == 'author':
                return obj.author == request.user
        
        return False
    
    def has_add_permission(self, request):
        """Проверка прав на добавление"""
        if request.user.is_superuser:
            return True
        
        return hasattr(request.user, 'role') and request.user.role.name in ['admin', 'author']
    
    def save_model(self, request, obj, form, change):
        """Автоматическое назначение автора при создании"""
        if not change:  # Если это создание нового объекта
            obj.author = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['make_published', 'make_draft']
    
    def make_published(self, request, queryset):
        """Массовая публикация постов"""
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} постов опубликованы.')
    
    make_published.short_description = "Опубликовать выбранные посты"
    
    def make_draft(self, request, queryset):
        """Массовое снятие с публикации"""
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} постов переведены в черновики.')
    
    make_draft.short_description = "Перевести в черновики"
