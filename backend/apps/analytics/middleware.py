import time
import logging
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from .models import AnalyticsEvent, UserSession
from .utils import get_client_ip, parse_user_agent

logger = logging.getLogger(__name__)


class AnalyticsMiddleware(MiddlewareMixin):
    """
    Middleware для автоматического сбора аналитики API запросов
    """
    
    def process_request(self, request):
        # Записываем время начала запроса
        request._analytics_start_time = time.time()
        
        # Сохраняем информацию о запросе
        request._analytics_data = {
            'ip_address': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'url': request.build_absolute_uri(),
            'method': request.method,
        }
        
        return None
    
    def process_response(self, request, response):
        # Пропускаем статические файлы и админку
        if self._should_skip_analytics(request):
            return response
        
        try:
            # Вычисляем время ответа
            if hasattr(request, '_analytics_start_time'):
                response_time = (time.time() - request._analytics_start_time) * 1000
            else:
                response_time = None
            
            # Определяем тип события
            event_type = self._get_event_type(request, response)
            
            # Создаем событие аналитики
            AnalyticsEvent.objects.create(
                event_type=event_type,
                user=request.user if not isinstance(request.user, AnonymousUser) else None,
                ip_address=request._analytics_data.get('ip_address'),
                user_agent=request._analytics_data.get('user_agent'),
                url=request._analytics_data.get('url'),
                method=request._analytics_data.get('method'),
                status_code=response.status_code,
                response_time=response_time,
                metadata={
                    'content_length': len(response.content) if hasattr(response, 'content') else 0,
                    'is_ajax': request.headers.get('X-Requested-With') == 'XMLHttpRequest',
                    'referer': request.META.get('HTTP_REFERER', ''),
                }
            )
            
            # Обновляем сессию пользователя
            if not isinstance(request.user, AnonymousUser):
                self._update_user_session(request)
                
        except Exception as e:
            logger.error(f"Ошибка при сохранении аналитики: {e}")
        
        return response
    
    def _should_skip_analytics(self, request):
        """Определяет, нужно ли пропустить аналитику для данного запроса"""
        skip_paths = [
            '/static/',
            '/media/',
            '/admin/jsi18n/',
            '/favicon.ico',
            '/__debug__/',
        ]
        
        return any(request.path.startswith(path) for path in skip_paths)
    
    def _get_event_type(self, request, response):
        """Определяет тип события на основе запроса и ответа"""
        path = request.path.lower()
        
        if '/api/' in path:
            return 'api_request'
        elif 'login' in path:
            return 'user_login'
        elif 'logout' in path:
            return 'user_logout'
        elif '/posts/' in path and request.method == 'GET':
            return 'post_view'
        elif '/posts/' in path and request.method == 'POST':
            return 'post_create'
        elif response.status_code >= 400:
            return 'error_occurred'
        else:
            return 'page_view'
    
    def _update_user_session(self, request):
        """Обновляет или создает сессию пользователя"""
        try:
            session_id = request.session.session_key
            if not session_id:
                return
            
            ip_address = request._analytics_data.get('ip_address')
            user_agent = request._analytics_data.get('user_agent')
            
            session, created = UserSession.objects.get_or_create(
                user=request.user,
                session_id=session_id,
                defaults={
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'started_at': timezone.now(),
                    'last_activity': timezone.now(),
                    'is_active': True,
                }
            )
            
            if not created:
                # Обновляем существующую сессию
                session.last_activity = timezone.now()
                session.is_active = True
                session.save(update_fields=['last_activity', 'is_active'])
                
        except Exception as e:
            logger.error(f"Ошибка при обновлении сессии: {e}")


class SessionTrackingMiddleware(MiddlewareMixin):
    """
    Middleware для отслеживания завершения сессий
    """
    
    def process_request(self, request):
        # Проверяем, если пользователь делает logout
        if 'logout' in request.path and not isinstance(request.user, AnonymousUser):
            self._end_user_session(request)
        
        return None
    
    def _end_user_session(self, request):
        """Завершает активную сессию пользователя"""
        try:
            session_id = request.session.session_key
            if session_id:
                session = UserSession.objects.filter(
                    user=request.user,
                    session_id=session_id,
                    is_active=True
                ).first()
                
                if session:
                    now = timezone.now()
                    session.is_active = False
                    session.duration = now - session.started_at
                    session.save(update_fields=['is_active', 'duration'])
                    
        except Exception as e:
            logger.error(f"Ошибка при завершении сессии: {e}") 