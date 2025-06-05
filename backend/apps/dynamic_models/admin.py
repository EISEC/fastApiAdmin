from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json

from .models import (
    DynamicModel,
    DynamicModelData,
    DynamicModelVersion,
    DynamicFieldType,
    DynamicModelExtension,
    DynamicModelPermission
)


@admin.register(DynamicFieldType)
class DynamicFieldTypeAdmin(admin.ModelAdmin):
    """Админка для типов полей"""
    
    list_display = ['name', 'label', 'category', 'ui_component', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'label', 'description']
    ordering = ['category', 'label']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'label', 'category', 'description', 'ui_component')
        }),
        ('Конфигурация', {
            'fields': ('default_config', 'validation_rules'),
            'classes': ('collapse',)
        }),
        ('Управление', {
            'fields': ('is_active',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser:
            # Обычные пользователи видят только активные типы
            qs = qs.filter(is_active=True)
        
        return qs


class DynamicModelVersionInline(admin.TabularInline):
    """Инлайн для версий модели"""
    model = DynamicModelVersion
    fk_name = 'dynamic_model'  # Указываем какой ForeignKey использовать
    extra = 0
    readonly_fields = ['created_at', 'created_by']
    fields = ['changes_description', 'is_rollback', 'created_by', 'created_at']
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(DynamicModel)
class DynamicModelAdmin(admin.ModelAdmin):
    """Админка для динамических моделей"""
    
    list_display = ['name', 'site', 'model_type', 'version', 'fields_count', 'data_count', 'is_active', 'created_at']
    list_filter = ['model_type', 'is_active', 'site', 'created_at']
    search_fields = ['name', 'description', 'table_name']
    ordering = ['-created_at']
    readonly_fields = ['table_name', 'created_at', 'updated_at', 'fields_preview']
    inlines = [DynamicModelVersionInline]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'site', 'description')
        }),
        ('Тип модели', {
            'fields': ('model_type', 'target_model'),
            'description': 'Выберите тип модели: отдельная или расширение существующей'
        }),
        ('Конфигурация полей', {
            'fields': ('fields_config', 'fields_preview'),
            'classes': ('collapse',)
        }),
        ('Валидация', {
            'fields': ('validation_rules',),
            'classes': ('collapse',)
        }),
        ('Версионность', {
            'fields': ('version', 'parent_model'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('table_name', 'is_active', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser and hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                # Админы видят только свои модели
                qs = qs.filter(site__owner=request.user)
            elif request.user.role.name == 'author':
                # Авторы видят модели сайтов, где они назначены
                qs = qs.filter(site__assigned_users=request.user)
            else:
                # Остальные не видят ничего
                qs = qs.none()
        
        return qs
    
    def fields_count(self, obj):
        """Количество полей в модели"""
        if obj.fields_config and 'fields' in obj.fields_config:
            return len(obj.fields_config['fields'])
        return 0
    fields_count.short_description = 'Полей'
    
    def data_count(self, obj):
        """Количество записей данных"""
        count = obj.data_entries.filter(is_published=True).count()
        if count > 0:
            url = reverse('admin:dynamic_models_dynamicmodeldata_changelist')
            return format_html('<a href="{}?dynamic_model__id__exact={}">{}</a>', url, obj.id, count)
        return count
    data_count.short_description = 'Записей'
    
    def fields_preview(self, obj):
        """Превью полей модели"""
        if not obj.fields_config or 'fields' not in obj.fields_config:
            return "Поля не настроены"
        
        fields = obj.fields_config['fields']
        preview_html = "<table style='width:100%; border-collapse: collapse;'>"
        preview_html += "<tr style='background: #f0f0f0;'><th>Название</th><th>Тип</th><th>Обязательное</th></tr>"
        
        for field in fields[:5]:  # Показываем только первые 5 полей
            required = "Да" if field.get('required', False) else "Нет"
            preview_html += f"<tr><td>{field.get('label', field['name'])}</td><td>{field['type']}</td><td>{required}</td></tr>"
        
        if len(fields) > 5:
            preview_html += f"<tr><td colspan='3'><i>... и еще {len(fields) - 5} полей</i></td></tr>"
        
        preview_html += "</table>"
        return mark_safe(preview_html)
    fields_preview.short_description = 'Превью полей'


@admin.register(DynamicModelData)
class DynamicModelDataAdmin(admin.ModelAdmin):
    """Админка для данных динамических моделей"""
    
    list_display = ['id', 'dynamic_model', 'get_display_value', 'is_published', 'created_at']
    list_filter = ['is_published', 'dynamic_model__site', 'dynamic_model', 'created_at']
    search_fields = ['data']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'data_preview']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('dynamic_model', 'is_published')
        }),
        ('Данные', {
            'fields': ('data', 'data_preview'),
            'classes': ('collapse',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser and hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                qs = qs.filter(dynamic_model__site__owner=request.user)
            elif request.user.role.name == 'author':
                qs = qs.filter(dynamic_model__site__assigned_users=request.user)
            else:
                qs = qs.none()
        
        return qs
    
    def data_preview(self, obj):
        """Превью данных в читаемом виде"""
        if not obj.data:
            return "Нет данных"
        
        preview_html = "<table style='width:100%; border-collapse: collapse;'>"
        preview_html += "<tr style='background: #f0f0f0;'><th>Поле</th><th>Значение</th></tr>"
        
        for key, value in obj.data.items():
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)
            preview_html += f"<tr><td><strong>{key}</strong></td><td>{str(value)[:100]}{'...' if len(str(value)) > 100 else ''}</td></tr>"
        
        preview_html += "</table>"
        return mark_safe(preview_html)
    data_preview.short_description = 'Превью данных'

    def get_display_value(self, obj):
        """Возвращает отображаемое значение записи"""
        return obj.get_display_value()
    get_display_value.short_description = 'Значение'


@admin.register(DynamicModelVersion)
class DynamicModelVersionAdmin(admin.ModelAdmin):
    """Админка для версий моделей"""
    
    list_display = ['dynamic_model', 'version', 'created_by', 'is_rollback', 'created_at']
    list_filter = ['is_rollback', 'created_at', 'dynamic_model__site']
    search_fields = ['dynamic_model__name', 'changes_description', 'created_by__email']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Версия', {
            'fields': ('dynamic_model', 'parent_version')
        }),
        ('Изменения', {
            'fields': ('changes_description', 'is_rollback', 'created_by')
        }),
        ('Дата', {
            'fields': ('created_at',)
        }),
    )
    
    def version(self, obj):
        """Версия модели"""
        return obj.dynamic_model.version
    version.short_description = 'Версия'
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser and hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                qs = qs.filter(dynamic_model__site__owner=request.user)
            elif request.user.role.name == 'author':
                qs = qs.filter(dynamic_model__site__assigned_users=request.user)
            else:
                qs = qs.none()
        
        return qs


@admin.register(DynamicModelExtension)
class DynamicModelExtensionAdmin(admin.ModelAdmin):
    """Админка для расширений моделей"""
    
    list_display = ['dynamic_model', 'target_model', 'extension_type', 'migration_applied', 'is_active']
    list_filter = ['extension_type', 'migration_applied', 'is_active', 'created_at']
    search_fields = ['dynamic_model__name', 'target_model']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Расширение', {
            'fields': ('dynamic_model', 'target_model', 'extension_type')
        }),
        ('Конфигурация', {
            'fields': ('field_mappings', 'relation_config'),
            'classes': ('collapse',)
        }),
        ('Состояние', {
            'fields': ('migration_applied', 'is_active')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser and hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                qs = qs.filter(dynamic_model__site__owner=request.user)
            else:
                qs = qs.none()
        
        return qs


@admin.register(DynamicModelPermission)
class DynamicModelPermissionAdmin(admin.ModelAdmin):
    """Админка для разрешений моделей"""
    
    list_display = ['dynamic_model', 'user', 'role', 'permission_type', 'is_active']
    list_filter = ['permission_type', 'is_active', 'created_at']
    search_fields = ['dynamic_model__name', 'user__email', 'role__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Разрешение', {
            'fields': ('dynamic_model', 'permission_type')
        }),
        ('Кому', {
            'fields': ('user', 'role'),
            'description': 'Укажите либо пользователя, либо роль'
        }),
        ('Ограничения', {
            'fields': ('field_restrictions', 'conditions'),
            'classes': ('collapse',)
        }),
        ('Состояние', {
            'fields': ('is_active',)
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Фильтрация по роли пользователя"""
        qs = super().get_queryset(request)
        
        if not request.user.is_superuser and hasattr(request.user, 'role'):
            if request.user.role.name == 'admin':
                qs = qs.filter(dynamic_model__site__owner=request.user)
            else:
                qs = qs.none()
        
        return qs
