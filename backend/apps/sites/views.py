from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q

from .models import Site
from .serializers import (
    SiteListSerializer,
    SiteDetailSerializer,
    SiteCreateUpdateSerializer,
    SiteStatsSerializer,
    SiteAssignUsersSerializer
)
from apps.common.permissions import SitePermission
from apps.accounts.models import Role


class SiteViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сайтами"""
    
    queryset = Site.objects.all()
    permission_classes = [permissions.IsAuthenticated, SitePermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'domain']
    ordering_fields = ['created_at', 'name', 'domain']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return SiteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SiteCreateUpdateSerializer
        else:
            return SiteDetailSerializer
    
    def get_queryset(self):
        """Фильтрация сайтов в зависимости от роли пользователя"""
        user = self.request.user
        
        # Проверка для Swagger схемы и анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return Site.objects.none()
        
        user_role = user.role.name
        
        if user_role == Role.SUPERUSER:
            # Суперпользователь видит все сайты
            return Site.objects.all().select_related('owner').prefetch_related('assigned_users')
        elif user_role == Role.ADMIN:
            # Админ видит только свои сайты
            return Site.objects.filter(owner=user).select_related('owner').prefetch_related('assigned_users')
        elif user_role == Role.AUTHOR:
            # Автор видит только назначенные ему сайты
            return Site.objects.filter(assigned_users=user).select_related('owner').prefetch_related('assigned_users')
        else:
            # Обычные пользователи не видят сайты
            return Site.objects.none()
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Получение статистики сайта"""
        site = self.get_object()
        
        # Проверяем права доступа
        if not site.can_user_access(request.user):
            return Response({
                'error': 'У вас нет доступа к этому сайту'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Собираем статистику
        from apps.posts.models import Post
        from apps.pages.models import Page
        
        posts_stats = Post.objects.filter(site=site).aggregate(
            total=Count('id'),
            published=Count('id', filter=Q(status='published')),
            draft=Count('id', filter=Q(status='draft'))
        )
        
        pages_stats = Page.objects.filter(site=site).aggregate(
            total=Count('id'),
            published=Count('id', filter=Q(status='published')),
            draft=Count('id', filter=Q(status='draft'))
        )
        
        # Общее количество просмотров постов
        total_views = Post.objects.filter(site=site).aggregate(
            total_views=Count('views_count')
        )['total_views'] or 0
        
        stats_data = {
            'posts_total': posts_stats['total'],
            'posts_published': posts_stats['published'],
            'posts_draft': posts_stats['draft'],
            'pages_total': pages_stats['total'],
            'pages_published': pages_stats['published'],
            'pages_draft': pages_stats['draft'],
            'authors_count': site.get_authors().count(),
            'views_total': total_views,
        }
        
        serializer = SiteStatsSerializer(stats_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_users(self, request, pk=None):
        """Назначение пользователей на сайт"""
        site = self.get_object()
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids:
            return Response(
                {'error': 'Необходимо указать user_ids'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем пользователей
            from apps.accounts.models import CustomUser
            users = CustomUser.objects.filter(id__in=user_ids)
            
            if len(users) != len(user_ids):
                return Response(
                    {'error': 'Некоторые пользователи не найдены'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Назначаем пользователей
            site.assigned_users.set(users)
            
            serializer = self.get_serializer(site)
            return Response(serializer.data)
        
        except Exception as e:
            return Response(
                {'error': f'Ошибка назначения пользователей: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def remove_user(self, request, pk=None):
        """Удаление пользователя с сайта"""
        site = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'error': 'Необходимо указать user_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверка аутентификации
        if not request.user.is_authenticated or not hasattr(request.user, 'role') or request.user.role is None:
            return Response({
                'error': 'Необходима авторизация'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Проверяем права доступа
        user_role = request.user.role.name
        if user_role not in [Role.SUPERUSER] and site.owner != request.user:
            return Response({
                'error': 'У вас нет прав для удаления пользователей'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_to_remove = User.objects.get(id=user_id)
            
            if user_to_remove in site.assigned_users.all():
                site.assigned_users.remove(user_to_remove)
                return Response({
                    'message': f'Пользователь {user_to_remove.username} удален с сайта'
                })
            else:
                return Response({
                    'error': 'Пользователь не назначен на этот сайт'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except User.DoesNotExist:
            return Response({
                'error': 'Пользователь не найден'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Активация/деактивация сайта"""
        site = self.get_object()
        
        # Проверка аутентификации
        if not request.user.is_authenticated or not hasattr(request.user, 'role') or request.user.role is None:
            return Response({
                'error': 'Необходима авторизация'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Проверяем права (только владелец или суперпользователь)
        user_role = request.user.role.name
        if user_role not in [Role.SUPERUSER] and site.owner != request.user:
            return Response({
                'error': 'У вас нет прав для изменения статуса сайта'
            }, status=status.HTTP_403_FORBIDDEN)
        
        site.is_active = not site.is_active
        site.save()
        
        return Response({
            'message': f'Сайт {"активирован" if site.is_active else "деактивирован"}',
            'is_active': site.is_active
        })
    
    @action(detail=False, methods=['get'])
    def my_sites(self, request):
        """Получение сайтов текущего пользователя"""
        user = request.user
        
        # Проверка аутентификации
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return Response([])
        
        user_role = user.role.name
        
        if user_role == Role.ADMIN:
            sites = Site.objects.filter(owner=user)
        elif user_role == Role.AUTHOR:
            sites = Site.objects.filter(assigned_users=user)
        else:
            sites = Site.objects.none()
        
        serializer = SiteListSerializer(sites, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_users(self, request):
        """Получение пользователей, доступных для назначения на сайты"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            # Суперпользователь может назначить любых авторов и пользователей
            from django.contrib.auth import get_user_model
            User = get_user_model()
            users = User.objects.filter(
                role__name__in=[Role.AUTHOR, Role.USER],
                is_active=True
            )
        elif user_role == Role.ADMIN:
            # Админ может назначить только созданных им пользователей
            from django.contrib.auth import get_user_model
            User = get_user_model()
            users = User.objects.filter(
                parent_user=request.user,
                role__name__in=[Role.AUTHOR, Role.USER],
                is_active=True
            )
        else:
            users = []
        
        from apps.accounts.serializers import UserListSerializer
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)
