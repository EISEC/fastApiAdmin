from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, F
from django.utils import timezone

from .models import Post, Category, Tag
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    PostStatsSerializer,
    CategorySerializer,
    TagSerializer
)
from apps.common.permissions import PostPermission, SitePermission
from apps.sites.models import Site


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с категориями постов"""
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, SitePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order', 'created_at']
    ordering = ['order', 'name']
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'role') or user.role is None:
            return Category.objects.none()
            
        if user.role.name == 'superuser':
            return Category.objects.all()
        elif user.role.name == 'admin':
            return Category.objects.filter(site__owner=user)
        elif user.role.name == 'author':
            return Category.objects.filter(site__assigned_users=user)
        
        return Category.objects.none()


class TagViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с тегами постов"""
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, SitePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'role') or user.role is None:
            return Tag.objects.none()
            
        if user.role.name == 'superuser':
            return Tag.objects.all()
        elif user.role.name == 'admin':
            return Tag.objects.filter(site__owner=user)
        elif user.role.name == 'author':
            return Tag.objects.filter(site__assigned_users=user)
        
        return Tag.objects.none()


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet для работы с постами"""
    permission_classes = [IsAuthenticated, SitePermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['title', 'created_at', 'published_at', 'views_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'role') or user.role is None:
            return Post.objects.none()
            
        if user.role.name == 'superuser':
            queryset = Post.objects.all()
        elif user.role.name == 'admin':
            queryset = Post.objects.filter(site__owner=user)
        elif user.role.name == 'author':
            queryset = Post.objects.filter(
                Q(site__assigned_users=user) | Q(author=user)
            )
        else:
            queryset = Post.objects.none()
        
        return queryset.select_related('site', 'author', 'category').prefetch_related('tags')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Дублирование поста"""
        post = self.get_object()
        
        # Создаем копию поста
        new_post = Post.objects.create(
            title=f"{post.title} (копия)",
            content=post.content,
            excerpt=post.excerpt,
            status='draft',
            site=post.site,
            author=request.user,
            category=post.category,
            meta_title=post.meta_title,
            meta_description=post.meta_description,
            is_featured=False,
            allow_comments=post.allow_comments
        )
        
        # Копируем теги
        new_post.tags.set(post.tags.all())
        
        serializer = self.get_serializer(new_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        """Изменение статуса поста"""
        post = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['draft', 'published', 'scheduled', 'archived']:
            return Response(
                {'error': 'Неверный статус'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        post.status = new_status
        
        # Устанавливаем дату публикации при публикации
        if new_status == 'published' and not post.published_at:
            post.published_at = timezone.now()
        
        post.save()
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def increment_views(self, request, pk=None):
        """Увеличение счетчика просмотров"""
        post = self.get_object()
        post.views_count += 1
        post.save(update_fields=['views_count'])
        
        return Response({'views_count': post.views_count})
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получение постов по категории"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'Необходимо указать category_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(category_id=category_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PostListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PostListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_tag(self, request):
        """Получение постов по тегу"""
        tag_id = request.query_params.get('tag_id')
        if not tag_id:
            return Response(
                {'error': 'Необходимо указать tag_id'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(tags__id=tag_id)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PostListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PostListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
        queryset = self.get_queryset().filter(status='published')
        
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
            'published_posts': queryset.filter(status='published').count(),
            'draft_posts': queryset.filter(status='draft').count(),
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
