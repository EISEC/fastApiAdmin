from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count
from .models import Site


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    """Админка для сайтов"""
    
    list_display = [
        'name', 'domain', 'owner', 'is_active', 'icon_preview',
        'posts_count', 'pages_count', 'created_at'
    ]
    list_filter = ['is_active', 'created_at', 'owner__role']
    search_fields = ['name', 'domain', 'owner__email']
    readonly_fields = ['created_at', 'updated_at', 'icon_preview']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'domain', 'owner')
        }),
        ('Настройки', {
            'fields': ('is_active',)
        }),
        ('Изображения', {
            'fields': ('icon', 'icon_preview', 'default_image', 'main_screen_image'),
            'classes': ('collapse',)
        }),
        ('Скрипты', {
            'fields': ('header_scripts', 'footer_scripts'),
            'classes': ('collapse',)
        }),
        ('SEO и настройки', {
            'fields': ('main_screen_settings', 'seo_settings'),
            'classes': ('collapse',)
        }),
        ('Изображения ошибок', {
            'fields': ('error_403_image', 'error_404_image', 'error_4xx_image', 'error_5xx_image'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def icon_preview(self, obj):
        """Превью иконки"""
        if obj.icon:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 50px; object-fit: contain;" />',
                obj.icon.url
            )
        return format_html(
            '<div style="width: 100px; height: 50px; background-color: #f0f0f0; '
            'display: flex; align-items: center; justify-content: center; color: #666; border-radius: 4px;">'
            'Нет иконки</div>'
        )
    
    icon_preview.short_description = 'Иконка'
    
    def posts_count(self, obj):
        """Количество постов на сайте"""
        count = getattr(obj, 'posts_count', None)
        if count is None:
            count = obj.posts.count()
        
        if count > 0:
            url = reverse('admin:posts_post_changelist') + f'?site__id__exact={obj.id}'
            return format_html('<a href="{}">{} постов</a>', url, count)
        return '0 постов'
    
    posts_count.short_description = 'Посты'
    
    def pages_count(self, obj):
        """Количество страниц на сайте"""
        count = getattr(obj, 'pages_count', None)
        if count is None:
            count = obj.pages.count()
        
        if count > 0:
            url = reverse('admin:pages_page_changelist') + f'?site__id__exact={obj.id}'
            return format_html('<a href="{}">{} страниц</a>', url, count)
        return '0 страниц'
    
    pages_count.short_description = 'Страницы'
    
    def get_queryset(self, request):
        """Оптимизация запросов и фильтрация по ролям"""
        queryset = super().get_queryset(request).select_related('owner')
        
        # Добавляем аннотации для подсчета связанных объектов
        queryset = queryset.annotate(
            posts_count=Count('posts', distinct=True),
            pages_count=Count('pages', distinct=True),
        )
        
        # Фильтрация по ролям
        if request.user.is_superuser:
            return queryset
        elif hasattr(request.user, 'role') and request.user.role.name == 'admin':
            return queryset.filter(owner=request.user)
        else:
            return queryset.none()
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Фильтрация владельцев по ролям"""
        if db_field.name == "owner":
            if not request.user.is_superuser:
                kwargs["queryset"] = kwargs["queryset"].filter(role__name='admin')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        """Проверка прав на изменение"""
        if obj is None:
            return True
        
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'role') and request.user.role.name == 'admin':
            return obj.owner == request.user
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Проверка прав на удаление"""
        return self.has_change_permission(request, obj)
    
    def has_add_permission(self, request):
        """Проверка прав на добавление"""
        if request.user.is_superuser:
            return True
        
        return hasattr(request.user, 'role') and request.user.role.name == 'admin'
