from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model

from .models import AnalyticsEvent, DailyStats, UserSession
from .serializers import AnalyticsEventSerializer, DailyStatsSerializer, UserSessionSerializer
from .utils import get_analytics_summary, get_user_analytics, calculate_daily_stats
from apps.common.permissions import RoleBasedPermission

User = get_user_model()


class AnalyticsEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра событий аналитики
    """
    serializer_class = AnalyticsEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['url', 'ip_address', 'user__username']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = AnalyticsEvent.objects.select_related('user')
        
        # Проверяем есть ли роль у пользователя
        if not hasattr(user, 'role') or not user.role:
            return queryset.filter(user=user)
        
        # Фильтрация по ролям
        if user.role.name == 'superuser':
            return queryset
        elif user.role.name == 'admin':
            # Админы видят события всех пользователей (упрощенная версия)
            return queryset
        else:
            # Обычные пользователи видят только свои события
            return queryset.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Получить сводку аналитики"""
        days = int(request.query_params.get('days', 7))
        summary = get_analytics_summary(days)
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def performance(self, request):
        """Получить метрики производительности"""
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # API запросы за период
        api_events = AnalyticsEvent.objects.filter(
            event_type='api_request',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Метрики производительности
        total_requests = api_events.count()
        avg_response_time = api_events.filter(
            response_time__isnull=False
        ).aggregate(avg=Avg('response_time'))['avg'] or 0
        
        # Распределение времени ответа
        time_ranges = [
            ('< 100ms', api_events.filter(response_time__lt=100).count()),
            ('100-500ms', api_events.filter(response_time__gte=100, response_time__lt=500).count()),
            ('500ms-1s', api_events.filter(response_time__gte=500, response_time__lt=1000).count()),
            ('> 1s', api_events.filter(response_time__gte=1000).count()),
        ]
        
        # Статус коды
        status_codes = api_events.values('status_code').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Самые медленные endpoints
        slow_endpoints = api_events.filter(
            response_time__isnull=False
        ).values('url').annotate(
            avg_time=Avg('response_time'),
            count=Count('id')
        ).filter(count__gte=5).order_by('-avg_time')[:10]
        
        return Response({
            'total_requests': total_requests,
            'avg_response_time': round(avg_response_time, 2),
            'response_time_distribution': time_ranges,
            'status_codes': list(status_codes),
            'slow_endpoints': list(slow_endpoints),
            'period_days': days,
        })
    
    @action(detail=False, methods=['get'])
    def users_activity(self, request):
        """Получить активность пользователей"""
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # Активность пользователей
        user_activity = AnalyticsEvent.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            user__isnull=False
        ).values('user__username', 'user__role__name').annotate(
            total_requests=Count('id'),
            api_requests=Count('id', filter=Q(event_type='api_request'))
        ).order_by('-total_requests')[:20]
        
        # Активные сессии
        active_sessions = UserSession.objects.filter(
            last_activity__gte=timezone.now() - timedelta(hours=24),
            is_active=True
        ).select_related('user').order_by('-last_activity')[:10]
        
        active_sessions_data = UserSessionSerializer(active_sessions, many=True).data
        
        return Response({
            'user_activity': list(user_activity),
            'active_sessions': active_sessions_data,
            'period_days': days,
        })
    
    @action(detail=False, methods=['get'])
    def content_stats(self, request):
        """Получить статистику контента"""
        days = int(request.query_params.get('days', 7))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # Инициализируем базовые значения
        posts_stats = {'total': 0, 'new_this_period': 0, 'by_category': [], 'popular_tags': []}
        sites_stats = {'total': 0, 'new_this_period': 0, 'posts_per_site': []}
        pages_stats = {'total': 0, 'new_this_period': 0}
        
        try:
            # Импорты моделей контента
            from apps.posts.models import Post, Category, Tag
            from apps.sites.models import Site
            from apps.pages.models import Page
            
            # Статистика постов
            posts_stats = {
                'total': Post.objects.count(),
                'new_this_period': Post.objects.filter(
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count(),
                'by_category': list(Post.objects.values('category__name').annotate(
                    count=Count('id')
                ).order_by('-count')[:10]),
                'popular_tags': list(Tag.objects.annotate(
                    posts_count=Count('posts')
                ).order_by('-posts_count')[:10].values('name', 'posts_count')),
            }
            
            # Статистика сайтов
            sites_stats = {
                'total': Site.objects.count(),
                'new_this_period': Site.objects.filter(
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count(),
                'posts_per_site': list(Site.objects.annotate(
                    posts_count=Count('posts')
                ).order_by('-posts_count')[:10].values('name', 'posts_count')),
            }
            
            # Статистика страниц
            pages_stats = {
                'total': Page.objects.count(),
                'new_this_period': Page.objects.filter(
                    created_at__date__gte=start_date,
                    created_at__date__lte=end_date
                ).count(),
            }
        except ImportError as e:
            # Если модули не найдены, используем базовые значения
            pass
        
        return Response({
            'posts': posts_stats,
            'sites': sites_stats,
            'pages': pages_stats,
            'period_days': days,
        })


class DailyStatsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра ежедневной статистики
    """
    serializer_class = DailyStatsSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    ordering = ['-date']
    
    def get_queryset(self):
        # Все пользователи могут видеть ежедневную статистику
        return DailyStats.objects.all()
    
    @action(detail=False, methods=['post'])
    def calculate_today(self, request):
        """Пересчитать статистику за сегодня"""
        daily_stats = calculate_daily_stats()
        serializer = self.get_serializer(daily_stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trends(self, request):
        """Получить тренды за последние дни"""
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        stats = DailyStats.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')
        
        trends_data = []
        for stat in stats:
            trends_data.append({
                'date': stat.date,
                'total_requests': stat.total_requests,
                'unique_users': stat.unique_users,
                'new_users': stat.new_users,
                'new_posts': stat.new_posts,
                'avg_response_time': stat.avg_response_time,
                'error_rate': stat.error_rate,
                'cache_hit_rate': stat.cache_hit_rate,
            })
        
        return Response({
            'data': trends_data,
            'period_days': days,
        })


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра пользовательских сессий
    """
    serializer_class = UserSessionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'ip_address']
    ordering = ['-last_activity']
    
    def get_queryset(self):
        user = self.request.user
        queryset = UserSession.objects.select_related('user')
        
        # Проверяем есть ли роль у пользователя
        if not hasattr(user, 'role') or not user.role:
            return queryset.filter(user=user)
        
        # Фильтрация по ролям
        if user.role.name == 'superuser':
            return queryset
        elif user.role.name == 'admin':
            # Админы видят сессии всех пользователей (упрощенная версия)
            return queryset
        else:
            # Обычные пользователи видят только свои сессии
            return queryset.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Получить активные сессии"""
        active_sessions = self.get_queryset().filter(
            is_active=True,
            last_activity__gte=timezone.now() - timedelta(hours=24)
        )
        
        serializer = self.get_serializer(active_sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def cleanup_old(self, request):
        """Очистить старые неактивные сессии"""
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = UserSession.objects.filter(
            is_active=False,
            last_activity__lt=cutoff_date
        ).delete()[0]
        
        return Response({
            'deleted_sessions': deleted_count,
            'message': f'Удалено {deleted_count} старых сессий'
        }) 