import json
import time
from django.core.cache import cache
from django.http import JsonResponse, HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from apps.settings.utils import get_cache_enabled, get_cache_timeout
import logging

logger = logging.getLogger(__name__)


class APICacheMiddleware(MiddlewareMixin):
    """
    Middleware для кэширования API ответов
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Проверяем кэш перед обработкой запроса
        """
        # Кэшируем только GET запросы к API
        if not self._should_cache_request(request):
            return None
            
        # Проверяем, включено ли кэширование
        if not get_cache_enabled():
            return None
            
        cache_key = self._get_cache_key(request)
        cached_response = cache.get(cache_key)
        
        # Дебаг информация
        logger.debug(f"Cache REQUEST - Path: {request.path}, Key: {cache_key}, User: {getattr(request, 'user', 'None')}, Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        
        if cached_response:
            logger.debug(f"Cache HIT for {request.path}")
            
            # Добавляем заголовки о кэше
            response = JsonResponse(cached_response['data'], safe=False)
            response['X-Cache'] = 'HIT'
            response['X-Cache-Key'] = cache_key
            response['X-Cache-Time'] = cached_response['cached_at']
            
            return response
            
        logger.debug(f"Cache MISS for {request.path}")
        return None
    
    def process_response(self, request, response):
        """
        Кэшируем ответ после обработки
        """
        # Кэшируем только успешные GET запросы к API
        if not self._should_cache_response(request, response):
            return response
            
        # Проверяем, включено ли кэширование
        if not get_cache_enabled():
            response['X-Cache'] = 'DISABLED'
            return response
            
        cache_key = self._get_cache_key(request)
        cache_timeout = get_cache_timeout()
        
        # Дебаг информация
        logger.debug(f"Cache RESPONSE - Path: {request.path}, Key: {cache_key}, User: {getattr(request, 'user', 'None')}, Authenticated: {getattr(request.user, 'is_authenticated', False) if hasattr(request, 'user') else False}")
        
        try:
            # Кэшируем только JSON ответы
            content_type = response.get('Content-Type', '')
            if hasattr(response, 'content') and 'application/json' in content_type:
                data = json.loads(response.content.decode('utf-8'))
                
                cache_data = {
                    'data': data,
                    'cached_at': time.time(),
                    'status_code': response.status_code
                }
                
                cache.set(cache_key, cache_data, cache_timeout)
                logger.debug(f"Cache SET for {request.path} (timeout: {cache_timeout}s)")
                
                # Добавляем заголовки о кэше
                response['X-Cache'] = 'MISS'
                response['X-Cache-Key'] = cache_key
                response['X-Cache-Timeout'] = str(cache_timeout)
                
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to cache response for {request.path}: {e}")
            
        return response
    
    def _should_cache_request(self, request):
        """
        Определяем, должен ли запрос кэшироваться
        """
        # Кэшируем только GET запросы к API
        if request.method != 'GET':
            return False
            
        # Кэшируем только API endpoints
        if not request.path.startswith('/api/'):
            return False
            
        # Не кэшируем административные endpoints
        if '/admin/' in request.path:
            return False
            
        # Не кэшируем debug endpoints
        if '/debug/' in request.path:
            return False
            
        # Не кэшируем Swagger documentation
        if any(x in request.path for x in ['/swagger/', '/redoc/', '/schema/']):
            return False
            
        return True
    
    def _should_cache_response(self, request, response):
        """
        Определяем, должен ли ответ кэшироваться
        """
        if not self._should_cache_request(request):
            return False
            
        # Кэшируем только успешные ответы
        if response.status_code not in [200]:
            return False
            
        return True
    
    def _get_cache_key(self, request):
        """
        Генерируем ключ кэша для запроса
        """
        # Базовый ключ из пути
        key_parts = [
            'api_cache',
            request.path.replace('/', '_'),
        ]
        
        # Добавляем query параметры (отсортированные для консистентности)
        if request.GET:
            query_parts = []
            for key, value in sorted(request.GET.items()):
                query_parts.append(f"{key}={value}")
            key_parts.append('_'.join(query_parts))
        
        # Добавляем ID пользователя для персонализации (только для личных данных)
        # Для публичных API (sites, posts, settings) не персонализируем
        personal_endpoints = ['/users/', '/profile/', '/dashboard/']
        is_personal = any(endpoint in request.path for endpoint in personal_endpoints)
        
        if hasattr(request, 'user') and request.user.is_authenticated and is_personal:
            key_parts.append(f"user_{request.user.id}")
        
        cache_key = ':'.join(key_parts)
        
        # Ограничиваем длину ключа (Redis может иметь ограничения)
        if len(cache_key) > 250:
            import hashlib
            cache_key = hashlib.md5(cache_key.encode()).hexdigest()
            
        return cache_key


class CacheInvalidationMiddleware(MiddlewareMixin):
    """
    Middleware для инвалидации кэша при изменениях данных
    """
    
    def process_response(self, request, response):
        """
        Инвалидируем кэш при изменениях данных
        """
        # Инвалидируем кэш для POST/PUT/PATCH/DELETE запросов
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and request.path.startswith('/api/'):
            if response.status_code in [200, 201, 204]:
                self._invalidate_related_cache(request)
                
        return response
    
    def _invalidate_related_cache(self, request):
        """
        Инвалидируем связанный кэш
        """
        try:
            # Определяем ресурс из URL
            path_parts = request.path.strip('/').split('/')
            if len(path_parts) >= 2 and path_parts[0] == 'api':
                resource = path_parts[1]  # sites, posts, pages, etc.
                
                # Паттерны ключей для инвалидации
                patterns_to_invalidate = [
                    f"api_cache:_api_{resource}_*",
                    f"api_cache:_api_dashboard_*",  # Dashboard может показывать данные разных ресурсов
                ]
                
                # Инвалидируем по паттернам
                for pattern in patterns_to_invalidate:
                    keys = cache.keys(pattern)
                    if keys:
                        cache.delete_many(keys)
                        logger.debug(f"Invalidated {len(keys)} cache keys for pattern: {pattern}")
                        
        except Exception as e:
            logger.warning(f"Failed to invalidate cache for {request.path}: {e}")


class CacheStatsMiddleware(MiddlewareMixin):
    """
    Middleware для сбора статистики кэша
    """
    
    def process_response(self, request, response):
        """
        Собираем статистику кэша
        """
        if request.path.startswith('/api/') and hasattr(response, 'get'):
            cache_status = response.get('X-Cache', 'NONE')
            
            # Увеличиваем счетчики
            stats_key = 'cache_stats'
            stats = cache.get(stats_key, {
                'hits': 0,
                'misses': 0,
                'total_requests': 0,
                'last_reset': time.time()
            })
            
            stats['total_requests'] += 1
            
            if cache_status == 'HIT':
                stats['hits'] += 1
            elif cache_status == 'MISS':
                stats['misses'] += 1
                
            # Сохраняем статистику в кэш на 24 часа
            cache.set(stats_key, stats, 86400)
            
        return response 