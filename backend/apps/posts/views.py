from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, F
from django.utils import timezone

from .models import Post
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    PostStatsSerializer
)
from apps.common.permissions import PostPermission
from apps.sites.models import Site


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet для управления постами"""
    
    queryset = Post.objects.all()
    permission_classes = [permissions.IsAuthenticated, PostPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_published', 'site', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return PostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostDetailSerializer
    
    def get_queryset(self):
        """Фильтрация постов по ролям пользователей"""
        user = self.request.user
        queryset = Post.objects.select_related('author', 'site')
        
        # Проверка для Swagger схемы и анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return queryset.none()
        
        if user.role.name == 'superuser':
            return queryset
        elif user.role.name == 'admin':
            # Админ видит посты только своих сайтов
            return queryset.filter(site__owner=user)
        elif user.role.name == 'author':
            # Автор видит только свои посты или посты сайтов, к которым имеет доступ
            return queryset.filter(
                Q(author=user) | Q(site__assigned_users=user)
            ).distinct()
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """Создание поста с назначением автора"""
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Увеличение счетчика просмотров"""
        post = self.get_object()
        post.increment_views()
        
        return Response({
            'success': True,
            'views_count': post.views_count
        })
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Публикация поста"""
        post = self.get_object()
        
        if not post.is_published:
            post.is_published = True
            if not post.published_at:
                post.published_at = timezone.now()
            post.save(update_fields=['is_published', 'published_at'])
        
        return Response({
            'success': True,
            'is_published': post.is_published,
            'published_at': post.published_at
        })
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Снятие поста с публикации"""
        post = self.get_object()
        
        if post.is_published:
            post.is_published = False
            post.published_at = None
            post.save(update_fields=['is_published', 'published_at'])
        
        return Response({
            'success': True,
            'is_published': post.is_published
        })
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Получение постов текущего пользователя"""
        queryset = self.get_queryset().filter(author=request.user)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Получение опубликованных постов"""
        queryset = self.get_queryset().filter(is_published=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика постов"""
        queryset = self.get_queryset()
        
        stats = {
            'total_posts': queryset.count(),
            'published_posts': queryset.filter(is_published=True).count(),
            'draft_posts': queryset.filter(is_published=False).count(),
            'total_views': sum(post.views_count for post in queryset),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def available_sites(self, request):
        """Получение доступных сайтов для создания постов"""
        user = request.user
        
        # Проверка для анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return Response([])
        
        if user.role.name == 'superuser':
            sites = Site.objects.all()
        elif user.role.name == 'admin':
            sites = Site.objects.filter(owner=user)
        elif user.role.name == 'author':
            sites = Site.objects.filter(assigned_users=user)
        else:
            sites = Site.objects.none()
        
        return Response([
            {'id': site.id, 'name': site.name, 'domain': site.domain}
            for site in sites
        ])
