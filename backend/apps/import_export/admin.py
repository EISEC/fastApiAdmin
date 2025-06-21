from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import ImportSource, ImportJob, ImportMapping, ImportLog


@admin.register(ImportSource)
class ImportSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'platform', 'is_active', 'created_at']
    list_filter = ['platform', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'platform', 'description', 'is_active')
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ImportMappingInline(admin.TabularInline):
    model = ImportMapping
    extra = 0
    fields = ['source_field', 'target_field', 'field_type', 'is_required', 'default_value']


class ImportLogInline(admin.TabularInline):
    model = ImportLog
    extra = 0
    readonly_fields = ['level', 'message', 'created_at']
    fields = ['level', 'message', 'created_at']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'source', 'target_site', 'status', 'progress_display', 
        'created_by', 'created_at', 'actions_column'
    ]
    list_filter = ['status', 'source__platform', 'created_at', 'target_site']
    search_fields = ['name', 'target_site__name', 'created_by__username']
    readonly_fields = [
        'created_by', 'progress', 'total_items', 'processed_items', 
        'imported_items', 'failed_items', 'results', 'errors',
        'started_at', 'completed_at', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'source', 'target_site', 'created_by')
        }),
        ('Настройки импорта', {
            'fields': ('content_types', 'import_settings', 'source_file')
        }),
        ('Статус и прогресс', {
            'fields': ('status', 'progress', 'total_items', 'processed_items', 
                      'imported_items', 'failed_items')
        }),
        ('Результаты', {
            'fields': ('results', 'errors'),
            'classes': ('collapse',)
        }),
        ('Временные метки', {
            'fields': ('started_at', 'completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [ImportMappingInline, ImportLogInline]
    
    def progress_display(self, obj):
        """Отображение прогресса с прогресс-баром"""
        if obj.total_items == 0:
            return "0%"
        
        percentage = obj.get_progress_percentage()
        color = 'green' if percentage == 100 else 'blue' if percentage > 50 else 'orange'
        
        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 3px; '
            'text-align: center; color: white; font-size: 12px; line-height: 20px;">'
            '{}%</div></div>',
            percentage, color, int(percentage)
        )
    progress_display.short_description = 'Прогресс'
    
    def actions_column(self, obj):
        """Колонка с действиями"""
        actions = []
        
        if obj.status == 'pending':
            actions.append(
                '<a href="#" onclick="startImport({})" class="button">Запустить</a>'.format(obj.id)
            )
        
        if obj.status in ['pending', 'processing']:
            actions.append(
                '<a href="#" onclick="cancelImport({})" class="button">Отменить</a>'.format(obj.id)
            )
        
        logs_url = reverse('admin:import_export_importlog_changelist') + f'?job__id__exact={obj.id}'
        actions.append(
            f'<a href="{logs_url}" class="button">Логи</a>'
        )
        
        return mark_safe(' '.join(actions))
    actions_column.short_description = 'Действия'
    
    class Media:
        js = ('admin/js/import_export_admin.js',)


@admin.register(ImportMapping)
class ImportMappingAdmin(admin.ModelAdmin):
    list_display = ['job', 'source_field', 'target_field', 'field_type', 'is_required']
    list_filter = ['field_type', 'is_required', 'job__source__platform']
    search_fields = ['source_field', 'target_field', 'job__name']
    
    fieldsets = (
        ('Маппинг полей', {
            'fields': ('job', 'source_field', 'target_field', 'field_type')
        }),
        ('Настройки', {
            'fields': ('is_required', 'default_value', 'transformation_rules')
        }),
    )


@admin.register(ImportLog)
class ImportLogAdmin(admin.ModelAdmin):
    list_display = ['job', 'level', 'message_short', 'item_id', 'created_at']
    list_filter = ['level', 'created_at', 'job__source__platform']
    search_fields = ['message', 'item_id', 'job__name']
    readonly_fields = ['job', 'level', 'message', 'details', 'item_id', 'created_at']
    
    def message_short(self, obj):
        """Сокращенное сообщение"""
        return obj.message[:100] + '...' if len(obj.message) > 100 else obj.message
    message_short.short_description = 'Сообщение'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
