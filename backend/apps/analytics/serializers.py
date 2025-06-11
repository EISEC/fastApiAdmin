from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AnalyticsEvent, DailyStats, UserSession

User = get_user_model()


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """
    Сериализатор для событий аналитики
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role.name', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    response_time_formatted = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = AnalyticsEvent
        fields = [
            'id', 'event_type', 'event_type_display', 'user', 'user_name', 'user_role',
            'ip_address', 'user_agent', 'url', 'method', 'status_code',
            'response_time', 'response_time_formatted', 'metadata',
            'created_at', 'created_at_formatted'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_response_time_formatted(self, obj):
        """Форматирует время ответа"""
        if obj.response_time:
            if obj.response_time < 100:
                return f"{obj.response_time:.2f}ms (Fast)"
            elif obj.response_time < 500:
                return f"{obj.response_time:.2f}ms (Normal)"
            elif obj.response_time < 1000:
                return f"{obj.response_time:.2f}ms (Slow)"
            else:
                return f"{obj.response_time:.2f}ms (Very Slow)"
        return None
    
    def get_created_at_formatted(self, obj):
        """Форматирует дату создания"""
        return obj.created_at.strftime('%d.%m.%Y %H:%M:%S')


class DailyStatsSerializer(serializers.ModelSerializer):
    """
    Сериализатор для ежедневной статистики
    """
    date_formatted = serializers.SerializerMethodField()
    performance_grade = serializers.SerializerMethodField()
    cache_performance = serializers.SerializerMethodField()
    error_status = serializers.SerializerMethodField()
    
    class Meta:
        model = DailyStats
        fields = [
            'id', 'date', 'date_formatted', 'total_requests', 'unique_users',
            'new_users', 'total_posts', 'new_posts', 'avg_response_time',
            'error_rate', 'cache_hit_rate', 'performance_grade',
            'cache_performance', 'error_status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_date_formatted(self, obj):
        """Форматирует дату"""
        return obj.date.strftime('%d.%m.%Y')
    
    def get_performance_grade(self, obj):
        """Определяет оценку производительности"""
        if obj.avg_response_time < 100:
            return 'Excellent'
        elif obj.avg_response_time < 300:
            return 'Good'
        elif obj.avg_response_time < 500:
            return 'Fair'
        else:
            return 'Poor'
    
    def get_cache_performance(self, obj):
        """Определяет производительность кэша"""
        if obj.cache_hit_rate > 80:
            return 'Excellent'
        elif obj.cache_hit_rate > 60:
            return 'Good'
        elif obj.cache_hit_rate > 40:
            return 'Fair'
        else:
            return 'Poor'
    
    def get_error_status(self, obj):
        """Определяет статус ошибок"""
        if obj.error_rate < 1:
            return 'Excellent'
        elif obj.error_rate < 3:
            return 'Good'
        elif obj.error_rate < 5:
            return 'Fair'
        else:
            return 'Poor'


class UserSessionSerializer(serializers.ModelSerializer):
    """
    Сериализатор для пользовательских сессий
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    duration_formatted = serializers.SerializerMethodField()
    started_at_formatted = serializers.SerializerMethodField()
    last_activity_formatted = serializers.SerializerMethodField()
    browser_info = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'user_name', 'user_role', 'user_email',
            'session_id', 'ip_address', 'user_agent', 'browser_info',
            'started_at', 'started_at_formatted', 'last_activity',
            'last_activity_formatted', 'is_active', 'duration',
            'duration_formatted', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'duration']
    
    def get_duration_formatted(self, obj):
        """Форматирует длительность сессии"""
        if obj.duration:
            total_seconds = int(obj.duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            
            if hours > 0:
                return f"{hours}h {minutes}m"
            elif minutes > 0:
                return f"{minutes}m {seconds}s"
            else:
                return f"{seconds}s"
        elif obj.is_active:
            # Для активных сессий вычисляем текущую длительность
            from django.utils import timezone
            current_duration = timezone.now() - obj.started_at
            total_seconds = int(current_duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            
            if hours > 0:
                return f"{hours}h {minutes}m (active)"
            else:
                return f"{minutes}m (active)"
        return None
    
    def get_started_at_formatted(self, obj):
        """Форматирует время начала сессии"""
        return obj.started_at.strftime('%d.%m.%Y %H:%M:%S')
    
    def get_last_activity_formatted(self, obj):
        """Форматирует время последней активности"""
        return obj.last_activity.strftime('%d.%m.%Y %H:%M:%S')
    
    def get_browser_info(self, obj):
        """Извлекает информацию о браузере из User-Agent"""
        if not obj.user_agent:
            return {'browser': 'Unknown', 'os': 'Unknown', 'device': 'Unknown'}
        
        from .utils import parse_user_agent
        return parse_user_agent(obj.user_agent)


class AnalyticsSummarySerializer(serializers.Serializer):
    """
    Сериализатор для сводки аналитики
    """
    total_requests = serializers.IntegerField()
    unique_users = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    active_sessions = serializers.IntegerField()
    period_days = serializers.IntegerField()
    top_endpoints = serializers.ListField()
    
    def to_representation(self, instance):
        """Дополнительная обработка данных"""
        data = super().to_representation(instance)
        
        # Добавляем статус показателей
        data['performance_status'] = 'Good' if data['avg_response_time'] < 200 else 'Poor'
        data['error_status'] = 'Good' if data['error_rate'] < 2 else 'Poor'
        
        return data


class PerformanceMetricsSerializer(serializers.Serializer):
    """
    Сериализатор для метрик производительности
    """
    total_requests = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    response_time_distribution = serializers.ListField()
    status_codes = serializers.ListField()
    slow_endpoints = serializers.ListField()
    period_days = serializers.IntegerField()


class ContentStatsSerializer(serializers.Serializer):
    """
    Сериализатор для статистики контента
    """
    posts = serializers.DictField()
    sites = serializers.DictField()
    pages = serializers.DictField()
    period_days = serializers.IntegerField() 