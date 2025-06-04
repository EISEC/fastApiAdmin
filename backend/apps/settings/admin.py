from django.contrib import admin
from .models import SettingCategory, SettingGroup, Setting, SettingTemplate


class SettingInline(admin.TabularInline):
    """Инлайн для настроек в группе"""
    model = Setting
    extra = 0
    fields = ['key', 'label', 'type', 'value', 'is_required', 'is_readonly', 'order']
    readonly_fields = ['created_at', 'updated_at']


class SettingGroupInline(admin.TabularInline):
    """Инлайн для групп в категории"""
    model = SettingGroup
    extra = 0
    fields = ['id', 'name', 'icon', 'order', 'is_active']


@admin.register(SettingCategory)
class SettingCategoryAdmin(admin.ModelAdmin):
    """Админка для категорий настроек"""
    list_display = ['id', 'name', 'icon', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']
    inlines = [SettingGroupInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('id', 'name', 'description', 'icon')
        }),
        ('Настройки отображения', {
            'fields': ('order', 'is_active')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(SettingGroup)
class SettingGroupAdmin(admin.ModelAdmin):
    """Админка для групп настроек"""
    list_display = ['id', 'name', 'category', 'icon', 'order', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'category__name']
    ordering = ['category__order', 'order', 'name']
    inlines = [SettingInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('id', 'name', 'description', 'icon', 'category')
        }),
        ('Настройки отображения', {
            'fields': ('order', 'is_active')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    """Админка для настроек"""
    list_display = ['key', 'label', 'type', 'group', 'site', 'is_required', 'is_readonly', 'updated_at']
    list_filter = ['type', 'group__category', 'is_required', 'is_readonly', 'site', 'created_at']
    search_fields = ['key', 'label', 'description']
    ordering = ['group__category__order', 'group__order', 'order', 'label']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('key', 'label', 'description', 'type', 'group', 'site')
        }),
        ('Значения', {
            'fields': ('value', 'default_value')
        }),
        ('Валидация и ограничения', {
            'fields': ('is_required', 'is_readonly', 'validation_rules', 'options'),
            'classes': ('collapse',)
        }),
        ('Метаданные', {
            'fields': ('placeholder', 'help_text', 'help_url', 'order'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'group', 'group__category', 'site', 'updated_by'
        )


@admin.register(SettingTemplate)
class SettingTemplateAdmin(admin.ModelAdmin):
    """Админка для шаблонов настроек"""
    list_display = ['name', 'created_by', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at', 'created_by']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'is_public')
        }),
        ('Данные', {
            'fields': ('settings_data',)
        }),
        ('Метаданные', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_by', 'created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        if not change:  # Создание нового объекта
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
