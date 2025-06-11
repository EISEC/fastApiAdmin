from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Avg
from django.utils import timezone
from .models import AnalyticsEvent, DailyStats, UserSession


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = [
        'event_type', 'user', 'status_code', 
        'response_time_display', 'created_at', 'method'
    ]
    list_filter = [
        'event_type', 'status_code', 'method', 
        'created_at', 'user__role'
    ]
    search_fields = ['user__username', 'url', 'ip_address']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('event_type', 'user', 'created_at')
        }),
        ('HTTP данные', {
            'fields': ('method', 'status_code', 'url', 'response_time')
        }),
        ('Клиентские данные', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Дополнительно', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
    )
    
    def response_time_display(self, obj):
        if obj.response_time:
            color = 'green' if obj.response_time < 100 else 'orange' if obj.response_time < 500 else 'red'
            return format_html(
                '<span style="color: {};">{:.2f} ms</span>',
                color, obj.response_time
            )
        return '-'
    response_time_display.short_description = 'Response Time'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_requests', 'unique_users', 'new_users',
        'new_posts', 'avg_response_time_display', 'error_rate_display',
        'cache_hit_rate_display'
    ]
    list_filter = ['date']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
    
    def avg_response_time_display(self, obj):
        color = 'green' if obj.avg_response_time < 100 else 'orange' if obj.avg_response_time < 500 else 'red'
        return format_html(
            '<span style="color: {};">{:.2f} ms</span>',
            color, obj.avg_response_time
        )
    avg_response_time_display.short_description = 'Avg Response Time'
    
    def error_rate_display(self, obj):
        color = 'green' if obj.error_rate < 1 else 'orange' if obj.error_rate < 5 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, obj.error_rate
        )
    error_rate_display.short_description = 'Error Rate'
    
    def cache_hit_rate_display(self, obj):
        color = 'green' if obj.cache_hit_rate > 80 else 'orange' if obj.cache_hit_rate > 50 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, obj.cache_hit_rate
        )
    cache_hit_rate_display.short_description = 'Cache Hit Rate'


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'started_at', 'last_activity', 
        'duration_display', 'is_active', 'ip_address'
    ]
    list_filter = [
        'is_active', 'started_at', 
        'user__role', 'user__is_active'
    ]
    search_fields = ['user__username', 'ip_address', 'session_id']
    readonly_fields = ['created_at', 'updated_at', 'duration']
    date_hierarchy = 'started_at'
    
    def duration_display(self, obj):
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            else:
                return f"{minutes}m"
        return '-'
    duration_display.short_description = 'Duration'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    actions = ['mark_as_inactive']
    
    def mark_as_inactive(self, request, queryset):
        updated = queryset.update(
            is_active=False,
            duration=timezone.now() - timezone.now()
        )
        self.message_user(
            request, 
            f'{updated} сессий помечено как неактивные.'
        )
    mark_as_inactive.short_description = 'Пометить как неактивные'