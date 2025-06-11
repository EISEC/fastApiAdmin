from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q

from .models import Site, SiteRequest
from .serializers import (
    SiteListSerializer,
    SiteDetailSerializer,
    SiteCreateUpdateSerializer,
    SiteStatsSerializer,
    SiteAssignUsersSerializer,
    SiteRequestListSerializer,
    SiteRequestDetailSerializer,
    SiteRequestCreateSerializer,
    SiteRequestReviewSerializer
)
from apps.common.permissions import SitePermission
from apps.accounts.models import Role
from .signals import cascade_delete_site_with_transaction


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
    
    @action(detail=True, methods=['delete'])
    def cascade_delete(self, request, pk=None):
        """Каскадное удаление сайта со всеми зависимостями"""
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
                'error': 'У вас нет прав для удаления этого сайта'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Собираем статистику перед удалением для ответа
        stats = {
            'site_name': site.name,
            'site_domain': site.domain,
            'posts_count': site.posts.count(),
            'pages_count': site.pages.count(),
            'categories_count': site.categories.count(),
            'tags_count': site.tags.count(),
            'dynamic_models_count': site.dynamic_models.count(),
            'assigned_users_count': site.assigned_users.count(),
        }
        
        # Выполняем каскадное удаление
        result = cascade_delete_site_with_transaction(site.id)
        
        if result['success']:
            return Response({
                'message': f'Сайт "{stats["site_name"]}" успешно удален со всеми зависимостями',
                'deleted_stats': {
                    'posts': result['posts_deleted'],
                    'pages': result['pages_deleted'],
                    'categories': result['categories_deleted'],
                    'tags': result['tags_deleted'],
                    'dynamic_models': result['dynamic_models_deleted'],
                    'assigned_users_cleared': result['assigned_users_cleared']
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': f'Ошибка при удалении сайта: {result["error"]}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def delete_preview(self, request, pk=None):
        """Предварительный просмотр того, что будет удалено при каскадном удалении"""
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
                'error': 'У вас нет прав для просмотра информации об удалении этого сайта'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Собираем статистику
        stats = {
            'site_info': {
                'name': site.name,
                'domain': site.domain,
                'owner': site.owner.username,
                'created_at': site.created_at,
                'is_active': site.is_active
            },
            'to_be_deleted': {
                'posts': site.posts.count(),
                'pages': site.pages.count(),
                'categories': site.categories.count(),
                'tags': site.tags.count(),
                'dynamic_models': site.dynamic_models.count()
            },
            'users_affected': {
                'assigned_users': site.assigned_users.count(),
                'assigned_users_list': [
                    {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    } for user in site.assigned_users.all()
                ]
            },
            'warnings': []
        }
        
        # Добавляем предупреждения
        total_content = sum(stats['to_be_deleted'].values())
        if total_content > 50:
            stats['warnings'].append(f'Большое количество контента ({total_content} объектов)')
        
        if stats['users_affected']['assigned_users'] > 0:
            stats['warnings'].append(f'{stats["users_affected"]["assigned_users"]} пользователей потеряют доступ')
        
        # Проверяем, последний ли это сайт владельца
        owner_sites_count = Site.objects.filter(owner=site.owner).count()
        if owner_sites_count == 1:
            stats['warnings'].append('Это последний сайт владельца')
        
        return Response(stats)


class SiteRequestViewSet(viewsets.ModelViewSet):
    """ViewSet для управления запросами на доступ к сайтам"""
    
    queryset = SiteRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'user__email', 'site__name', 'site__domain']
    ordering_fields = ['created_at', 'status', 'reviewed_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return SiteRequestListSerializer
        elif self.action == 'create':
            return SiteRequestCreateSerializer
        elif self.action in ['review']:
            return SiteRequestReviewSerializer
        else:
            return SiteRequestDetailSerializer
    
    def get_queryset(self):
        """Фильтрация запросов в зависимости от роли пользователя"""
        user = self.request.user
        
        # Проверка для Swagger схемы и анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return SiteRequest.objects.none()
        
        user_role = user.role.name
        
        if user_role == Role.SUPERUSER:
            # Суперпользователь видит все запросы
            return SiteRequest.objects.all().select_related('user', 'site', 'reviewed_by')
        elif user_role == Role.ADMIN:
            # Админ видит только запросы к своим сайтам
            return SiteRequest.objects.filter(site__owner=user).select_related('user', 'site', 'reviewed_by')
        elif user_role == Role.USER:
            # Пользователи видят только свои запросы
            return SiteRequest.objects.filter(user=user).select_related('user', 'site', 'reviewed_by')
        else:
            # Авторы не могут создавать запросы (уже имеют доступ)
            return SiteRequest.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Создание запроса на доступ к сайту"""
        # Проверяем роль пользователя
        if not hasattr(request.user, 'role') or request.user.role.name != Role.USER:
            return Response({
                'error': 'Только пользователи с ролью USER могут создавать запросы на доступ'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().create(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Рассмотрение запроса (одобрение или отклонение)"""
        site_request = self.get_object()
        
        # Проверяем права на рассмотрение
        if not site_request.can_be_reviewed_by(request.user):
            return Response({
                'error': 'У вас нет прав для рассмотрения этого запроса'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Проверяем, что запрос ожидает рассмотрения
        if site_request.status != 'pending':
            return Response({
                'error': 'Можно рассматривать только ожидающие запросы'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SiteRequestReviewSerializer(
            site_request, 
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Возвращаем обновленную информацию о запросе
            detail_serializer = SiteRequestDetailSerializer(
                site_request, 
                context={'request': request}
            )
            return Response(detail_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Получение запросов текущего пользователя"""
        user = request.user
        
        # Проверка аутентификации
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return Response([])
        
        # Пользователи видят только свои запросы
        requests_qs = SiteRequest.objects.filter(user=user).select_related('site', 'reviewed_by')
        
        serializer = SiteRequestListSerializer(requests_qs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_reviews(self, request):
        """Получение запросов, ожидающих рассмотрения для админов"""
        user = request.user
        
        # Проверка прав
        if not hasattr(user, 'role') or user.role.name not in [Role.SUPERUSER, Role.ADMIN]:
            return Response({
                'error': 'У вас нет прав для просмотра запросов на рассмотрение'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Фильтруем только ожидающие запросы
        if user.role.name == Role.SUPERUSER:
            requests_qs = SiteRequest.objects.filter(status='pending')
        else:  # ADMIN
            requests_qs = SiteRequest.objects.filter(status='pending', site__owner=user)
        
        requests_qs = requests_qs.select_related('user', 'site')
        
        serializer = SiteRequestListSerializer(requests_qs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_sites(self, request):
        """Получение сайтов, к которым пользователь может запросить доступ"""
        user = request.user
        
        # Проверяем роль
        if not hasattr(user, 'role') or user.role.name != Role.USER:
            return Response({
                'error': 'Только пользователи с ролью USER могут запрашивать доступ к сайтам'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Исключаем сайты:
        # 1. К которым у пользователя уже есть доступ
        # 2. К которым у пользователя есть активный запрос
        # 3. Которыми пользователь владеет
        # 4. Неактивные сайты
        
        user_assigned_sites = Site.objects.filter(assigned_users=user).values_list('id', flat=True)
        user_pending_requests = SiteRequest.objects.filter(
            user=user, 
            status='pending'
        ).values_list('site_id', flat=True)
        
        available_sites = Site.objects.filter(
            is_active=True
        ).exclude(
            Q(id__in=user_assigned_sites) |
            Q(id__in=user_pending_requests) |
            Q(owner=user)
        ).select_related('owner')
        
        serializer = SiteListSerializer(available_sites, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def cancel_request(self, request, pk=None):
        """Отмена запроса пользователем"""
        site_request = self.get_object()
        
        # Проверяем, что пользователь может отменить запрос
        if site_request.user != request.user:
            return Response({
                'error': 'Вы можете отменить только свои запросы'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Проверяем, что запрос ожидает рассмотрения
        if site_request.status != 'pending':
            return Response({
                'error': 'Можно отменить только ожидающие запросы'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        site_request.delete()
        
        return Response({
            'message': 'Запрос на доступ к сайту отменен'
        }, status=status.HTTP_200_OK)
