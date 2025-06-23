from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.conf import settings
from django.core.paginator import Paginator
import os
import uuid
import logging
import mimetypes
from datetime import datetime

logger = logging.getLogger(__name__)

# Create your views here.

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file_to_cloud(request):
    """
    Загружает файл напрямую в облачное хранилище и возвращает URL
    """
    try:
        if 'file' not in request.FILES:
            return Response(
                {'detail': 'Файл не найден в запросе'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        site_id = request.POST.get('site_id')
        
        logger.info(f"📤 Uploading file to cloud: {uploaded_file.name} (size: {uploaded_file.size})")
        
        # Генерируем уникальное имя файла
        file_extension = os.path.splitext(uploaded_file.name)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Определяем путь в зависимости от наличия site_id
        if site_id:
            file_path = f"sites/{site_id}/uploads/{unique_filename}"
        else:
            file_path = f"uploads/{unique_filename}"
        
        # Сохраняем файл в облачное хранилище
        saved_path = default_storage.save(file_path, uploaded_file)
        file_url = default_storage.url(saved_path)
        
        # Определяем тип файла
        content_type, _ = mimetypes.guess_type(uploaded_file.name)
        
        logger.info(f"✅ File uploaded successfully: {file_url}")
        
        response_data = {
            'url': file_url,
            'path': saved_path,
            'name': uploaded_file.name,
            'size': uploaded_file.size,
            'type': content_type or 'application/octet-stream',
            'site_id': int(site_id) if site_id else None,
            'created_at': datetime.now().isoformat(),
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"❌ File upload failed: {str(e)}")
        return Response(
            {'detail': f'Ошибка загрузки файла: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_media_files(request):
    """
    Возвращает список файлов в медиа-библиотеке с фильтрацией по сайту
    """
    try:
        site_id = request.GET.get('site_id')
        file_type = request.GET.get('type', 'all')  # all, image, video, document
        search = request.GET.get('search', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        # В реальном приложении здесь была бы работа с моделью MediaFile
        # Пока возвращаем пример данных
        mock_files = []
        
        # Пример файлов для демонстрации
        if site_id == '1' or not site_id:
            mock_files.extend([
                {
                    'id': '1',
                    'name': 'example-image.jpg',
                    'url': 'https://adminifuw.storage.yandexcloud.net/sites/1/uploads/example-image.jpg',
                    'type': 'image/jpeg',
                    'size': 245760,
                    'site_id': 1,
                    'site_name': 'Главный сайт',
                    'created_at': '2024-06-22T10:30:00Z',
                    'thumbnail_url': 'https://adminifuw.storage.yandexcloud.net/sites/1/uploads/example-image.jpg'
                },
                {
                    'id': '2',
                    'name': 'document.pdf',
                    'url': 'https://adminifuw.storage.yandexcloud.net/sites/1/uploads/document.pdf',
                    'type': 'application/pdf',
                    'size': 1048576,
                    'site_id': 1,
                    'site_name': 'Главный сайт',
                    'created_at': '2024-06-22T09:15:00Z',
                    'thumbnail_url': None
                }
            ])
        
        # Фильтрация по типу файла
        if file_type != 'all':
            mock_files = [f for f in mock_files if f['type'].startswith(file_type)]
        
        # Фильтрация по поиску
        if search:
            mock_files = [f for f in mock_files if search.lower() in f['name'].lower()]
        
        # Пагинация
        paginator = Paginator(mock_files, page_size)
        page_obj = paginator.get_page(page)
        
        return Response({
            'results': list(page_obj),
            'count': paginator.count,
            'num_pages': paginator.num_pages,
            'current_page': page,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        })
        
    except Exception as e:
        logger.error(f"❌ Failed to list media files: {str(e)}")
        return Response(
            {'detail': f'Ошибка получения списка файлов: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_media_file(request):
    """
    Удаляет файл из облачного хранилища по URL
    """
    try:
        # Получаем URL файла из параметров запроса
        file_url = request.GET.get('url')
        
        if not file_url:
            return Response(
                {'detail': 'URL файла не указан'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"🗑️ Attempting to delete file: {file_url}")
        
        # Извлекаем путь к файлу из URL
        # URL имеет вид: https://adminifuw.storage.yandexcloud.net/sites/1/uploads/filename.jpg
        # Нужно получить: sites/1/uploads/filename.jpg
        
        try:
            # Парсим URL для получения пути к файлу
            from urllib.parse import urlparse
            parsed_url = urlparse(file_url)
            file_path = parsed_url.path.lstrip('/')  # Убираем ведущий слэш
            
            logger.info(f"🔍 Extracted file path: {file_path}")
            
            # Проверяем существование файла и удаляем
            if default_storage.exists(file_path):
                default_storage.delete(file_path)
                logger.info(f"✅ File successfully deleted from cloud: {file_path}")
                
                return Response({
                    'detail': 'Файл успешно удален из облачного хранилища',
                    'deleted_path': file_path
                }, status=status.HTTP_200_OK)
            else:
                logger.warning(f"⚠️ File not found in cloud storage: {file_path}")
                return Response({
                    'detail': 'Файл не найден в облачном хранилище',
                    'path': file_path
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as parse_error:
            logger.error(f"❌ Failed to parse file URL: {str(parse_error)}")
            return Response(
                {'detail': f'Некорректный URL файла: {str(parse_error)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
    except Exception as e:
        logger.error(f"❌ Failed to delete file: {str(e)}")
        return Response(
            {'detail': f'Ошибка удаления файла: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def media_stats(request):
    """
    Возвращает статистику медиа-библиотеки по сайтам
    """
    try:
        site_id = request.GET.get('site_id')
        
        # В реальном приложении здесь был бы запрос к базе данных
        # Пока возвращаем пример статистики
        
        if site_id:
            stats = {
                'total_files': 2,
                'total_size': 1294336,  # байты
                'images_count': 1,
                'videos_count': 0,
                'documents_count': 1,
                'by_type': {
                    'image': {'count': 1, 'size': 245760},
                    'video': {'count': 0, 'size': 0},
                    'application': {'count': 1, 'size': 1048576},
                }
            }
        else:
            stats = {
                'total_files': 2,
                'total_size': 1294336,
                'images_count': 1,
                'videos_count': 0,
                'documents_count': 1,
                'by_site': {
                    '1': {'name': 'Главный сайт', 'files': 2, 'size': 1294336},
                },
                'by_type': {
                    'image': {'count': 1, 'size': 245760},
                    'video': {'count': 0, 'size': 0},
                    'application': {'count': 1, 'size': 1048576},
                }
            }
        
        return Response(stats)
        
    except Exception as e:
        logger.error(f"❌ Failed to get media stats: {str(e)}")
        return Response(
            {'detail': f'Ошибка получения статистики: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
