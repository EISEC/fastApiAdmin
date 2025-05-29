from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.http import HttpResponse
from django.db.models import Q
from django.utils.safestring import mark_safe
from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    """Админка для страниц"""
    
    list_display = [
        'title', 'author', 'site', 'template_name', 'is_published', 
        'is_homepage', 'preview_link', 'created_at'
    ]
    list_filter = [
        'is_published', 'template_name', 'is_homepage', 'site', 
        'author__role', 'created_at'
    ]
    search_fields = [
        'title', 'meta_title', 'meta_description', 
        'author__email', 'site__name'
    ]
    readonly_fields = [
        'slug', 'compiled_css', 
        'created_at', 'updated_at', 'preview_link'
    ]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'template_name')
        }),
        ('Настройки публикации', {
            'fields': ('site', 'author', 'is_published', 'is_homepage')
        }),
        ('Контент', {
            'fields': ('content', 'image')
        }),
        ('Визуальный конструктор', {
            'fields': ('page_components',),
            'description': 'JSON конфигурация компонентов страницы'
        }),
        ('Скомпилированный код', {
            'fields': ('compiled_css',),
            'classes': ('collapse',),
            'description': 'Автоматически генерируемый CSS'
        }),
        ('SEO настройки', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
        ('Статистика', {
            'fields': ('preview_link',),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def preview_link(self, obj):
        """Ссылка на предварительный просмотр"""
        if obj.pk:
            preview_url = reverse('admin:pages_page_preview', args=[obj.pk])
            return format_html(
                '<a href="{}" target="_blank" style="background: #007cba; color: white; padding: 5px 10px; '
                'text-decoration: none; border-radius: 3px; font-size: 12px;">🔍 Предварительный просмотр</a>',
                preview_url
            )
        return "Сохраните страницу для просмотра"
    
    preview_link.short_description = 'Просмотр'
    
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
                # Админ видит страницы только своих сайтов
                return queryset.filter(site__owner=request.user)
            elif request.user.role.name == 'author':
                # Автор видит только свои страницы или страницы сайтов, к которым имеет доступ
                return queryset.filter(
                    Q(author=request.user)
                ).distinct()
        
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
        """Автоматическое назначение автора и компиляция при создании"""
        if not change:  # Если это создание нового объекта
            obj.author = request.user
        
        # Компилируем компоненты при сохранении
        super().save_model(request, obj, form, change)
    
    def get_urls(self):
        """Добавляем кастомные URL для предварительного просмотра"""
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:page_id>/preview/',
                self.admin_site.admin_view(self.preview_page),
                name='pages_page_preview'
            ),
        ]
        return custom_urls + urls
    
    def preview_page(self, request, page_id):
        """Предварительный просмотр страницы"""
        try:
            page = Page.objects.get(pk=page_id)
            
            # Проверяем права доступа
            if not self.has_view_permission(request, page):
                return HttpResponse("Доступ запрещен", status=403)
            
            # Компилируем компоненты
            compiled_html = page.compile_components_to_html()
            
            html_content = f"""
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>{page.meta_title or page.title}</title>
                <meta name="description" content="{page.meta_description or ''}">
                <style>
                    body {{ margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
                    .preview-header {{ 
                        background: #007cba; color: white; padding: 10px 20px; margin: -20px -20px 20px; 
                        display: flex; justify-content: space-between; align-items: center;
                    }}
                    .preview-content {{ border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }}
                    {page.compiled_css or ''}
                </style>
            </head>
            <body>
                <div class="preview-header">
                    <h3 style="margin: 0;">Предварительный просмотр: {page.title}</h3>
                    <small>Статус: {'Опубликовано' if page.is_published else 'Черновик'}</small>
                </div>
                <div class="preview-content">
                    {compiled_html or '<p style="padding: 20px; color: #666;">Контент не настроен</p>'}
                </div>
            </body>
            </html>
            """
            
            return HttpResponse(html_content, content_type='text/html')
            
        except Page.DoesNotExist:
            return HttpResponse("Страница не найдена", status=404)
    
    actions = ['make_published', 'make_draft', 'set_as_home']
    
    def make_published(self, request, queryset):
        """Массовая публикация страниц"""
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} страниц опубликованы.')
    
    make_published.short_description = "Опубликовать выбранные страницы"
    
    def make_draft(self, request, queryset):
        """Массовое снятие с публикации"""
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} страниц переведены в черновики.')
    
    make_draft.short_description = "Перевести в черновики"
    
    def set_as_home(self, request, queryset):
        """Установить как главную страницу"""
        if queryset.count() > 1:
            self.message_user(request, 'Можно установить только одну главную страницу за раз.', level='error')
            return
        
        page = queryset.first()
        if page:
            # Снимаем флаг с других страниц сайта
            Page.objects.filter(site=page.site, is_homepage=True).update(is_homepage=False)
            page.is_homepage = True
            page.save()
            self.message_user(request, f'Страница "{page.title}" установлена как главная.')
    
    set_as_home.short_description = "Установить как главную страницу"
