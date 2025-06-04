from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Count, Q
from django.utils import timezone
from django.http import HttpResponse

from .models import Page
from .serializers import (
    PageListSerializer,
    PageDetailSerializer,
    PageCreateUpdateSerializer,
    PageStatsSerializer,
    PagePreviewSerializer
)
from apps.common.permissions import PagePermission
from apps.sites.models import Site


class PageViewSet(viewsets.ModelViewSet):
    """ViewSet для работы со страницами"""
    
    queryset = Page.objects.all()
    permission_classes = [permissions.IsAuthenticated, PagePermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'meta_title', 'meta_description']
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return PageListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PageCreateUpdateSerializer
        elif self.action == 'preview':
            return PagePreviewSerializer
        return PageDetailSerializer
    
    def get_queryset(self):
        """Фильтрация страниц по ролям пользователей"""
        user = self.request.user
        queryset = Page.objects.select_related('author', 'site')
        
        # Проверка для Swagger схемы и анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return queryset.none()
        
        if user.role.name == 'superuser':
            return queryset
        elif user.role.name == 'admin':
            # Админ видит страницы только своих сайтов
            return queryset.filter(site__owner=user)
        elif user.role.name == 'author':
            # Автор видит только свои страницы или страницы сайтов, к которым имеет доступ
            return queryset.filter(
                Q(author=user) | Q(site__assigned_users=user)
            ).distinct()
        
        return queryset.none()
    
    def perform_create(self, serializer):
        """Создание страницы с назначением автора"""
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'])
    def compile(self, request, pk=None):
        """Компиляция HTML и CSS из компонентов"""
        page = self.get_object()
        # Здесь будет логика компиляции компонентов
        compiled_html = page.compile_components_to_html()
        compiled_css = page.compile_components_to_css()
        
        # Сохраняем скомпилированные данные
        page.compiled_css = compiled_css
        page.save(update_fields=['compiled_css'])
        
        return Response({
            'success': True,
            'compiled_html': compiled_html,
            'compiled_css': compiled_css
        })
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Предварительный просмотр страницы"""
        page = self.get_object()
        serializer = self.get_serializer(page)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def render(self, request, pk=None):
        """Отрендеренная HTML-страница"""
        page = self.get_object()
        
        compiled_html = page.compile_components_to_html()
        
        html_content = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{page.meta_title or page.title}</title>
            <meta name="description" content="{page.meta_description or ''}">
            <meta name="keywords" content="{page.meta_keywords or ''}">
            <style>
                {page.compiled_css or ''}
            </style>
        </head>
        <body>
            {compiled_html}
        </body>
        </html>
        """
        
        return HttpResponse(html_content, content_type='text/html')
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Публикация страницы"""
        page = self.get_object()
        
        if not page.is_published:
            page.is_published = True
            page.save(update_fields=['is_published'])
        
        return Response({
            'success': True,
            'is_published': page.is_published
        })
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Снятие страницы с публикации"""
        page = self.get_object()
        
        if page.is_published:
            page.is_published = False
            page.save(update_fields=['is_published'])
        
        return Response({
            'success': True,
            'is_published': page.is_published
        })
    
    @action(detail=True, methods=['post'])
    def set_home(self, request, pk=None):
        """Установка страницы как главной"""
        page = self.get_object()
        
        # Убираем флаг главной страницы у всех других страниц сайта
        Page.objects.filter(site=page.site, is_homepage=True).update(is_homepage=False)
        
        # Устанавливаем текущую страницу как главную
        page.is_homepage = True
        page.save(update_fields=['is_homepage'])
        
        return Response({
            'success': True,
            'is_homepage': page.is_homepage
        })
    
    @action(detail=False, methods=['get'])
    def my_pages(self, request):
        """Получение страниц текущего пользователя"""
        queryset = self.get_queryset().filter(author=request.user)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Получение опубликованных страниц"""
        queryset = self.get_queryset().filter(is_published=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def home_pages(self, request):
        """Получение главных страниц сайтов"""
        queryset = self.get_queryset().filter(is_homepage=True, is_published=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Статистика страниц"""
        queryset = self.get_queryset()
        
        stats = {
            'total_pages': queryset.count(),
            'published_pages': queryset.filter(is_published=True).count(),
            'draft_pages': queryset.filter(is_published=False).count(),
            'home_pages': queryset.filter(is_homepage=True).count(),
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def available_sites(self, request):
        """Получение доступных сайтов для создания страниц"""
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
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Получение доступных шаблонов"""
        templates = [
            {'value': 'basic', 'label': 'Базовый шаблон'},
            {'value': 'landing', 'label': 'Лендинг'},
            {'value': 'blog', 'label': 'Блог'},
            {'value': 'portfolio', 'label': 'Портфолио'},
            {'value': 'ecommerce', 'label': 'Интернет-магазин'},
            {'value': 'custom', 'label': 'Пользовательский'},
        ]
        
        return Response(templates)
