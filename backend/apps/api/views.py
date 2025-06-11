from django.shortcuts import render
import time
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Create your views here.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cache_stats(request):
    """
    Получение статистики кэша
    """
    try:
        # Получаем статистику
        stats = cache.get('cache_stats', {
            'hits': 0,
            'misses': 0,
            'total_requests': 0,
            'last_reset': time.time()
        })
        
        # Вычисляем дополнительные метрики
        total_cache_requests = stats['hits'] + stats['misses']
        hit_rate = (stats['hits'] / total_cache_requests * 100) if total_cache_requests > 0 else 0
        
        # Информация о кэше
        cache_info = {
            'enabled': True,  # TODO: использовать get_cache_enabled()
            'backend': 'django_redis.cache.RedisCache',
            'location': 'redis://127.0.0.1:6379/1'
        }
        
        # Попытка получить информацию о Redis
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            redis_info = redis_conn.info()
            
            cache_info.update({
                'redis_version': redis_info.get('redis_version', 'unknown'),
                'used_memory': redis_info.get('used_memory_human', 'unknown'),
                'connected_clients': redis_info.get('connected_clients', 0),
                'keyspace_hits': redis_info.get('keyspace_hits', 0),
                'keyspace_misses': redis_info.get('keyspace_misses', 0),
            })
        except Exception as e:
            cache_info['redis_error'] = str(e)
        
        response_data = {
            'cache_stats': {
                'hits': stats['hits'],
                'misses': stats['misses'],
                'total_requests': stats['total_requests'],
                'cache_requests': total_cache_requests,
                'hit_rate': round(hit_rate, 2),
                'last_reset': stats['last_reset'],
                'uptime_hours': round((time.time() - stats['last_reset']) / 3600, 2)
            },
            'cache_info': cache_info
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get cache stats: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_cache(request):
    """
    Очистка кэша (только для администраторов)
    """
    try:
        # Проверяем права пользователя
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied. Admin rights required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем паттерн для очистки
        pattern = request.data.get('pattern', 'api_cache:*')
        
        # Очищаем кэш
        if pattern == 'all':
            cache.clear()
            cleared_count = 'all'
        else:
            keys = cache.keys(pattern)
            if keys:
                cache.delete_many(keys)
                cleared_count = len(keys)
            else:
                cleared_count = 0
        
        # Сбрасываем статистику
        cache.delete('cache_stats')
        
        return Response({
            'message': f'Cache cleared successfully',
            'pattern': pattern,
            'cleared_keys': cleared_count
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to clear cache: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
