import re
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model
from .models import AnalyticsEvent, DailyStats, UserSession

User = get_user_model()


def get_client_ip(request):
    """Получает IP адрес клиента"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def parse_user_agent(user_agent_string):
    """Парсит User-Agent строку"""
    if not user_agent_string:
        return {'browser': 'Unknown', 'os': 'Unknown', 'device': 'Unknown'}
    
    # Простое определение браузера
    browser = 'Unknown'
    if 'Chrome' in user_agent_string and 'Edg' not in user_agent_string:
        browser = 'Chrome'
    elif 'Firefox' in user_agent_string:
        browser = 'Firefox'
    elif 'Safari' in user_agent_string and 'Chrome' not in user_agent_string:
        browser = 'Safari'
    elif 'Edg' in user_agent_string:
        browser = 'Edge'
    
    # Простое определение ОС
    os = 'Unknown'
    if 'Windows' in user_agent_string:
        os = 'Windows'
    elif 'Mac OS X' in user_agent_string or 'macOS' in user_agent_string:
        os = 'macOS'
    elif 'Linux' in user_agent_string:
        os = 'Linux'
    elif 'iPhone' in user_agent_string:
        os = 'iOS'
    elif 'Android' in user_agent_string:
        os = 'Android'
    
    # Простое определение устройства
    device = 'Desktop'
    if 'Mobile' in user_agent_string:
        device = 'Mobile'
    elif 'Tablet' in user_agent_string:
        device = 'Tablet'
    
    return {
        'browser': browser,
        'os': os,
        'device': device
    }


def calculate_daily_stats(date=None):
    """Вычисляет ежедневную статистику"""
    if date is None:
        date = timezone.now().date()
    
    start_date = timezone.make_aware(datetime.combine(date, datetime.min.time()))
    end_date = start_date + timedelta(days=1)
    
    # Запросы за день
    events = AnalyticsEvent.objects.filter(
        created_at__gte=start_date,
        created_at__lt=end_date
    )
    
    total_requests = events.count()
    api_requests = events.filter(event_type='api_request')
    
    # Уникальные пользователи
    unique_users = events.filter(
        user__isnull=False
    ).values('user').distinct().count()
    
    # Новые пользователи
    new_users = User.objects.filter(
        date_joined__gte=start_date,
        date_joined__lt=end_date
    ).count()
    
    # Посты за день
    from apps.posts.models import Post
    posts_today = Post.objects.filter(
        created_at__gte=start_date,
        created_at__lt=end_date
    )
    total_posts = Post.objects.filter(created_at__lt=end_date).count()
    new_posts = posts_today.count()
    
    # Среднее время ответа
    avg_response_time = api_requests.filter(
        response_time__isnull=False
    ).aggregate(avg=Avg('response_time'))['avg'] or 0
    
    # Процент ошибок
    error_requests = api_requests.filter(status_code__gte=400).count()
    error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0
    
    # Cache hit rate (берем из кэш статистики)
    from apps.common.middleware import CacheStatsMiddleware
    cache_stats = getattr(CacheStatsMiddleware, '_stats', {})
    total_cache_requests = cache_stats.get('hits', 0) + cache_stats.get('misses', 0)
    cache_hit_rate = (cache_stats.get('hits', 0) / total_cache_requests * 100) if total_cache_requests > 0 else 0
    
    # Создаем или обновляем статистику
    daily_stats, created = DailyStats.objects.get_or_create(
        date=date,
        defaults={
            'total_requests': total_requests,
            'unique_users': unique_users,
            'new_users': new_users,
            'total_posts': total_posts,
            'new_posts': new_posts,
            'avg_response_time': avg_response_time,
            'error_rate': error_rate,
            'cache_hit_rate': cache_hit_rate,
        }
    )
    
    if not created:
        # Обновляем существующую запись
        daily_stats.total_requests = total_requests
        daily_stats.unique_users = unique_users
        daily_stats.new_users = new_users
        daily_stats.total_posts = total_posts
        daily_stats.new_posts = new_posts
        daily_stats.avg_response_time = avg_response_time
        daily_stats.error_rate = error_rate
        daily_stats.cache_hit_rate = cache_hit_rate
        daily_stats.save()
    
    return daily_stats


def get_analytics_summary(days=7):
    """Получает сводку аналитики за последние N дней"""
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    # Общая статистика
    total_requests = AnalyticsEvent.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    ).count()
    
    api_requests = AnalyticsEvent.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        event_type='api_request'
    )
    
    unique_users = AnalyticsEvent.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date,
        user__isnull=False
    ).values('user').distinct().count()
    
    # Среднее время ответа
    avg_response_time = api_requests.filter(
        response_time__isnull=False
    ).aggregate(avg=Avg('response_time'))['avg'] or 0
    
    # Процент ошибок
    error_requests = api_requests.filter(status_code__gte=400).count()
    error_rate = (error_requests / total_requests * 100) if total_requests > 0 else 0
    
    # Топ endpoints
    top_endpoints = api_requests.values('url').annotate(
        count=Count('id')
    ).order_by('-count')[:10]
    
    # Активные пользователи
    active_sessions = UserSession.objects.filter(
        last_activity__gte=timezone.now() - timedelta(hours=24),
        is_active=True
    ).count()
    
    return {
        'total_requests': total_requests,
        'unique_users': unique_users,
        'avg_response_time': round(avg_response_time, 2),
        'error_rate': round(error_rate, 2),
        'top_endpoints': list(top_endpoints),
        'active_sessions': active_sessions,
        'period_days': days,
    }


def get_user_analytics(user_id, days=30):
    """Получает аналитику для конкретного пользователя"""
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    user_events = AnalyticsEvent.objects.filter(
        user_id=user_id,
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    
    total_requests = user_events.count()
    api_requests = user_events.filter(event_type='api_request').count()
    
    # Последняя активность
    last_event = user_events.order_by('-created_at').first()
    last_activity = last_event.created_at if last_event else None
    
    # Сессии пользователя
    user_sessions = UserSession.objects.filter(
        user_id=user_id,
        started_at__date__gte=start_date,
        started_at__date__lte=end_date
    )
    
    total_sessions = user_sessions.count()
    active_sessions = user_sessions.filter(is_active=True).count()
    
    # Среднее время сессии
    completed_sessions = user_sessions.filter(
        is_active=False,
        duration__isnull=False
    )
    
    avg_session_duration = None
    if completed_sessions.exists():
        total_duration = sum(
            (session.duration.total_seconds() for session in completed_sessions),
            0
        )
        avg_session_duration = total_duration / completed_sessions.count()
    
    return {
        'total_requests': total_requests,
        'api_requests': api_requests,
        'last_activity': last_activity,
        'total_sessions': total_sessions,
        'active_sessions': active_sessions,
        'avg_session_duration': avg_session_duration,
        'period_days': days,
    } 