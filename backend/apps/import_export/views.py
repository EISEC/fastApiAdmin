from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import ImportSource, ImportJob, ImportMapping, ImportLog
from .serializers import (
    ImportSourceSerializer, ImportJobSerializer, CreateImportJobSerializer,
    ImportMappingSerializer, ImportLogSerializer, WordPressImportSerializer
)
from .services import WordPressImportService, create_wordpress_import_job
from apps.common.permissions import RoleBasedPermission


class ImportSourceViewSet(viewsets.ModelViewSet):
    """ViewSet для источников импорта"""
    queryset = ImportSource.objects.all()
    serializer_class = ImportSourceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Фильтрация по правам доступа"""
        user = self.request.user
        if user.role.name == 'superuser':
            return ImportSource.objects.all()
        elif user.role.name in ['admin', 'author']:
            return ImportSource.objects.filter(is_active=True)
        return ImportSource.objects.none()


class ImportJobViewSet(viewsets.ModelViewSet):
    """ViewSet для задач импорта"""
    queryset = ImportJob.objects.all()
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'create':
            return CreateImportJobSerializer
        return ImportJobSerializer
    
    def get_queryset(self):
        """Фильтрация по правам доступа"""
        user = self.request.user
        if user.role.name == 'superuser':
            return ImportJob.objects.all()
        elif user.role.name == 'admin':
            # Админ видит импорты для своих сайтов
            return ImportJob.objects.filter(target_site__owner=user)
        elif user.role.name == 'author':
            # Автор видит только свои импорты
            return ImportJob.objects.filter(created_by=user)
        return ImportJob.objects.none()
    
    def perform_create(self, serializer):
        """Создание задачи импорта"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Запуск задачи импорта"""
        import_job = self.get_object()
        
        # Проверяем, что задача еще не запущена
        if import_job.status != 'pending':
            return Response(
                {'error': 'Задача уже выполняется или завершена'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Запускаем импорт
            service = WordPressImportService(import_job)
            success = service.start_import()
            
            if success:
                return Response({
                    'message': 'Импорт успешно завершен',
                    'job_id': import_job.id,
                    'status': import_job.status
                })
            else:
                return Response({
                    'error': 'Импорт завершился с ошибками',
                    'job_id': import_job.id,
                    'status': import_job.status
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            import_job.status = 'failed'
            import_job.completed_at = timezone.now()
            import_job.save()
            
            return Response(
                {'error': f'Ошибка запуска импорта: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отмена задачи импорта"""
        import_job = self.get_object()
        
        # Детальная проверка статуса с информативными сообщениями
        if import_job.status == 'completed':
            return Response(
                {
                    'error': 'Задача уже успешно завершена и не может быть отменена',
                    'status': import_job.status,
                    'completed_at': import_job.completed_at,
                    'imported_items': import_job.imported_items
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif import_job.status == 'failed':
            return Response(
                {
                    'error': 'Задача уже завершена с ошибкой и не может быть отменена',
                    'status': import_job.status,
                    'completed_at': import_job.completed_at,
                    'failed_items': import_job.failed_items
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif import_job.status == 'cancelled':
            return Response(
                {
                    'error': 'Задача уже была отменена ранее',
                    'status': import_job.status,
                    'completed_at': import_job.completed_at
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        elif import_job.status == 'pending':
            # Отменяем задачу, которая еще не начала выполняться
            import_job.status = 'cancelled'
            import_job.completed_at = timezone.now()
            import_job.save()
            
            ImportLog.objects.create(
                job=import_job,
                level='warning',
                message='Задача импорта отменена пользователем до начала выполнения'
            )
            
            return Response({
                'message': 'Задача импорта успешно отменена (не была запущена)',
                'job_id': import_job.id,
                'status': import_job.status
            })
        elif import_job.status == 'running':
            # Отменяем выполняющуюся задачу
            import_job.status = 'cancelled'
            import_job.completed_at = timezone.now()
            import_job.save()
            
            ImportLog.objects.create(
                job=import_job,
                level='warning',
                message='Задача импорта отменена пользователем во время выполнения'
            )
            
            return Response({
                'message': 'Задача импорта отменена (была остановлена во время выполнения)',
                'job_id': import_job.id,
                'status': import_job.status,
                'processed_items': import_job.processed_items,
                'imported_items': import_job.imported_items
            })
        else:
            # Неизвестный статус
            return Response(
                {
                    'error': f'Неизвестный статус задачи: {import_job.status}',
                    'status': import_job.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        """Получение логов импорта"""
        import_job = self.get_object()
        logs = import_job.logs.all()
        
        # Пагинация
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = ImportLogSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ImportLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Получение статистики импорта"""
        import_job = self.get_object()
        
        stats = {
            'job_id': import_job.id,
            'name': import_job.name,
            'status': import_job.status,
            'progress': import_job.progress,
            'total_items': import_job.total_items,
            'processed_items': import_job.processed_items,
            'imported_items': import_job.imported_items,
            'failed_items': import_job.failed_items,
            'progress_percentage': import_job.get_progress_percentage(),
            'success_rate': import_job.get_success_rate(),
            'results': import_job.results,
            'started_at': import_job.started_at,
            'completed_at': import_job.completed_at,
            'duration': None
        }
        
        # Вычисляем длительность
        if import_job.started_at and import_job.completed_at:
            duration = import_job.completed_at - import_job.started_at
            stats['duration'] = duration.total_seconds()
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def wordpress_import(self, request):
        """Специальный endpoint для импорта из WordPress"""
        serializer = WordPressImportSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Создаем задачу импорта
            import_job = create_wordpress_import_job(
                serializer.validated_data,
                request.user
            )
            
            # Возвращаем результат сразу
            response_serializer = ImportJobSerializer(import_job)
            response_data = response_serializer.data
            response_data['message'] = 'Задача импорта создана и будет запущена автоматически'
            
            # Запускаем импорт в отдельном потоке
            import threading
            
            def run_import():
                try:
                    service = WordPressImportService(import_job)
                    service.start_import()
                except Exception as import_error:
                    # Логируем ошибку импорта
                    import_job.status = 'failed'
                    import_job.save()
                    ImportLog.objects.create(
                        job=import_job,
                        level='error',
                        message=f'Ошибка запуска импорта: {str(import_error)}'
                    )
            
            # Запускаем в отдельном потоке
            import_thread = threading.Thread(target=run_import)
            import_thread.daemon = True
            import_thread.start()
            
            return Response(
                response_data,
                status=status.HTTP_201_CREATED
            )
                
        except Exception as e:
            return Response(
                {'error': f'Ошибка создания импорта: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cleanup(self, request, pk=None):
        """Очистка импортированных данных"""
        import_job = self.get_object()
        
        # Проверяем права доступа
        user_role = request.user.role.name if hasattr(request.user, 'role') else 'user'
        if user_role not in ['superuser', 'admin']:
            return Response(
                {'error': 'Недостаточно прав для очистки данных'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from apps.posts.models import Post
            from apps.pages.models import Page
            from apps.sites.models import Site
            
            # Получаем целевой сайт
            target_site = Site.objects.get(id=import_job.target_site_id)
            
            # Подсчитываем что будет удалено
            posts_to_delete = Post.objects.filter(
                site=target_site,
                created_at__gte=import_job.started_at
            ) if import_job.started_at else Post.objects.filter(site=target_site)
            
            pages_to_delete = Page.objects.filter(
                site=target_site,
                created_at__gte=import_job.started_at
            ) if import_job.started_at else Page.objects.filter(site=target_site)
            
            posts_count = posts_to_delete.count()
            pages_count = pages_to_delete.count()
            
            # Выполняем очистку
            deleted_posts = posts_to_delete.delete()[0] if posts_count > 0 else 0
            deleted_pages = pages_to_delete.delete()[0] if pages_count > 0 else 0
            
            # Логируем очистку
            ImportLog.objects.create(
                job=import_job,
                level='info',
                message=f'Очистка данных: удалено {deleted_posts} постов и {deleted_pages} страниц'
            )
            
            # Обновляем статистику задачи
            import_job.imported_items = max(0, import_job.imported_items - deleted_posts - deleted_pages)
            import_job.save()
            
            return Response({
                'message': 'Данные успешно очищены',
                'deleted': {
                    'posts': deleted_posts,
                    'pages': deleted_pages,
                    'total': deleted_posts + deleted_pages
                }
            })
            
        except Site.DoesNotExist:
            return Response(
                {'error': 'Целевой сайт не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Ошибка очистки данных: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def wordpress_preview(self, request):
        """Предварительный просмотр данных WordPress файла"""
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'error': 'Файл не загружен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            import xml.etree.ElementTree as ET
            
            # Парсим XML
            tree = ET.parse(file)
            root = tree.getroot()
            
            # Подсчитываем элементы
            namespaces = {
                'wp': 'http://wordpress.org/export/1.2/',
                'content': 'http://purl.org/rss/1.0/modules/content/',
                'dc': 'http://purl.org/dc/elements/1.1/'
            }
            
            # Считаем категории, теги, посты, страницы
            categories = root.findall('.//wp:category', namespaces)
            tags = root.findall('.//wp:tag', namespaces)
            items = root.findall('.//item')
            
            posts_count = 0
            pages_count = 0
            
            for item in items:
                post_type = item.find('wp:post_type', namespaces)
                if post_type is not None:
                    if post_type.text == 'post':
                        posts_count += 1
                    elif post_type.text == 'page':
                        pages_count += 1
            
            # Получаем информацию о сайте
            site_title = root.find('.//title')
            site_description = root.find('.//description')
            
            preview_data = {
                'site_info': {
                    'title': site_title.text if site_title is not None else '',
                    'description': site_description.text if site_description is not None else '',
                },
                'content_counts': {
                    'categories': len(categories),
                    'tags': len(tags),
                    'posts': posts_count,
                    'pages': pages_count,
                    'total_items': len(items)
                },
                'sample_posts': []
            }
            
            # Добавляем примеры постов (первые 5)
            sample_count = 0
            for item in items:
                if sample_count >= 5:
                    break
                    
                post_type = item.find('wp:post_type', namespaces)
                if post_type is not None and post_type.text == 'post':
                    title = item.find('title')
                    creator = item.find('dc:creator', namespaces)
                    post_date = item.find('wp:post_date', namespaces)
                    
                    preview_data['sample_posts'].append({
                        'title': title.text if title is not None else 'Без названия',
                        'author': creator.text if creator is not None else 'Неизвестно',
                        'date': post_date.text if post_date is not None else 'Неизвестно'
                    })
                    sample_count += 1
            
            return Response(preview_data)
            
        except Exception as e:
            return Response(
                {'error': f'Ошибка анализа файла: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ImportMappingViewSet(viewsets.ModelViewSet):
    """ViewSet для маппинга полей"""
    queryset = ImportMapping.objects.all()
    serializer_class = ImportMappingSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Фильтрация по задаче импорта"""
        job_id = self.request.query_params.get('job_id')
        if job_id:
            return ImportMapping.objects.filter(job_id=job_id)
        return ImportMapping.objects.all()


class ImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для логов импорта (только чтение)"""
    queryset = ImportLog.objects.all()
    serializer_class = ImportLogSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        """Фильтрация по задаче импорта"""
        job_id = self.request.query_params.get('job_id')
        if job_id:
            return ImportLog.objects.filter(job_id=job_id)
        return ImportLog.objects.all()
