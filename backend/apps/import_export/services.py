import xml.etree.ElementTree as ET
import requests
from datetime import datetime
from django.utils import timezone
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.db import transaction
import logging
import json
import re
from typing import Dict, List, Optional, Any

from .models import ImportJob, ImportLog, ImportSource
from apps.posts.models import Post, Category, Tag
from apps.pages.models import Page
from apps.sites.models import Site

User = get_user_model()
logger = logging.getLogger(__name__)


class WordPressImportService:
    """Сервис для импорта данных из WordPress"""
    
    def __init__(self, import_job: ImportJob):
        self.import_job = import_job
        self.target_site = import_job.target_site
        self.settings = import_job.import_settings
        self.stats = {
            'posts': {'total': 0, 'imported': 0, 'failed': 0},
            'pages': {'total': 0, 'imported': 0, 'failed': 0},
            'categories': {'total': 0, 'imported': 0, 'failed': 0},
            'tags': {'total': 0, 'imported': 0, 'failed': 0},
            'media': {'total': 0, 'imported': 0, 'failed': 0},
        }
    
    def start_import(self) -> bool:
        """Запускает процесс импорта"""
        try:
            self.log_info("Начало импорта из WordPress")
            
            # Обновляем статус
            self.import_job.status = 'running'
            self.import_job.started_at = timezone.now()
            self.import_job.save()
            
            # Определяем тип источника и запускаем соответствующий импорт
            source_type = self.settings.get('source_type', 'file')
            
            if source_type == 'file':
                success = self._import_from_xml_file()
            elif source_type == 'api':
                success = self._import_from_api()
            else:
                raise ValueError(f"Неподдерживаемый тип источника: {source_type}")
            
            # Завершаем импорт
            self._finish_import(success)
            return success
            
        except Exception as e:
            self.log_error(f"Критическая ошибка импорта: {str(e)}")
            self._finish_import(False)
            return False
    
    def _import_from_xml_file(self) -> bool:
        """Импорт из XML файла WordPress"""
        try:
            xml_path = self.import_job.source_file.path
            self.log_info(f"Начинаем импорт из файла: {xml_path}")
            
            # Парсим XML файл
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            # Определяем namespace
            namespaces = {
                'wp': 'http://wordpress.org/export/1.2/',
                'dc': 'http://purl.org/dc/elements/1.1/',
                'content': 'http://purl.org/rss/1.0/modules/content/',
                'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
            }
            
            # Импортируем категории и теги сначала
            if self.settings.get('import_categories', True):
                self._import_categories_from_xml(root, namespaces)
            
            if self.settings.get('import_tags', True):
                self._import_tags_from_xml(root, namespaces)
            
            # Получаем все элементы
            items = root.findall('.//item')
            
            # Фильтруем элементы - считаем только те, которые будем импортировать
            importable_items = []
            item_types_count = {}
            
            for item in items:
                post_type = item.find('wp:post_type', namespaces)
                post_status = item.find('wp:status', namespaces)
                
                if post_type is None or post_status is None:
                    continue
                
                post_type_text = post_type.text
                post_status_text = post_status.text
                
                # Считаем типы элементов для диагностики
                key = f"{post_type_text} ({post_status_text})"
                item_types_count[key] = item_types_count.get(key, 0) + 1
                
                # Пропускаем черновики и удаленные посты (если не указано иное)
                if post_status_text in ['trash', 'auto-draft'] and not self.settings.get('import_drafts', False):
                    continue
                
                # Проверяем, что это тип контента который мы импортируем
                if (post_type_text == 'post' and self.settings.get('import_posts', True)) or \
                   (post_type_text == 'page' and self.settings.get('import_pages', True)):
                    importable_items.append(item)
            
            # Логируем статистику типов элементов
            self.log_info("Статистика типов элементов в XML файле:")
            for item_type, count in item_types_count.items():
                self.log_info(f"  {item_type}: {count}")
            
            # Обновляем общее количество элементов для импорта
            self.import_job.total_items = len(importable_items)
            self.import_job.save()
            
            self.log_info(f"Найдено {len(items)} всего элементов, {len(importable_items)} для импорта")
            
            for i, item in enumerate(importable_items):
                try:
                    # Проверяем, не была ли задача отменена
                    self.import_job.refresh_from_db()
                    if self.import_job.status == 'cancelled':
                        self.log_warning("Импорт был отменен пользователем")
                        return False
                    
                    self._process_xml_item(item, namespaces)
                    self.import_job.processed_items = i + 1
                    self.import_job.progress = int((i + 1) / len(importable_items) * 100)
                    
                    # Сохраняем прогресс каждые 10 элементов для производительности
                    if (i + 1) % 10 == 0 or (i + 1) == len(importable_items):
                        self.import_job.save()
                        self.log_info(f"Обработано {i + 1}/{len(importable_items)} элементов")
                    
                except Exception as e:
                    self.log_error(f"Ошибка обработки элемента {i+1}: {str(e)}")
                    self.import_job.failed_items += 1
                    
                    # Сохраняем и при ошибках
                    if (i + 1) % 10 == 0 or (i + 1) == len(importable_items):
                        self.import_job.save()
            
            # Финальное сохранение
            self.import_job.save()
            
            return True
            
        except Exception as e:
            self.log_error(f"Ошибка импорта из XML: {str(e)}")
            return False
    
    def _import_from_api(self) -> bool:
        """Импорт через WordPress REST API"""
        try:
            wp_url = self.settings.get('wordpress_url', '').rstrip('/')
            username = self.settings.get('api_username', '')
            password = self.settings.get('api_password', '')
            
            if not all([wp_url, username, password]):
                raise ValueError("Не указаны данные для подключения к API")
            
            self.log_info(f"Подключение к WordPress API: {wp_url}")
            
            # Создаем сессию для API запросов
            session = requests.Session()
            session.auth = (username, password)
            session.headers.update({
                'Content-Type': 'application/json',
                'User-Agent': 'FastAPI Admin WordPress Importer'
            })
            
            # Импортируем данные через API
            if self.settings.get('import_categories', True):
                self._import_categories_from_api(session, wp_url)
            
            if self.settings.get('import_tags', True):
                self._import_tags_from_api(session, wp_url)
            
            if self.settings.get('import_posts', True):
                self._import_posts_from_api(session, wp_url)
            
            if self.settings.get('import_pages', True):
                self._import_pages_from_api(session, wp_url)
            
            return True
            
        except Exception as e:
            self.log_error(f"Ошибка импорта через API: {str(e)}")
            return False
    
    def _import_categories_from_xml(self, root, namespaces):
        """Импорт категорий из XML"""
        categories = root.findall('.//wp:category', namespaces)
        self.stats['categories']['total'] = len(categories)
        
        for cat_elem in categories:
            try:
                cat_nicename = cat_elem.find('wp:category_nicename', namespaces)
                cat_name = cat_elem.find('wp:cat_name', namespaces)
                cat_parent = cat_elem.find('wp:category_parent', namespaces)
                
                if cat_name is not None and cat_nicename is not None:
                    category_data = {
                        'name': cat_name.text,
                        'slug': cat_nicename.text,
                        'site': self.target_site,
                        'description': '',
                    }
                    
                    # Создаем или обновляем категорию
                    category, created = Category.objects.get_or_create(
                        site=self.target_site,
                        slug=category_data['slug'],
                        defaults=category_data
                    )
                    
                    if created:
                        self.stats['categories']['imported'] += 1
                        self.log_success(f"Создана категория: {category.name}")
                    else:
                        self.log_info(f"Категория уже существует: {category.name}")
                        
            except Exception as e:
                self.stats['categories']['failed'] += 1
                self.log_error(f"Ошибка импорта категории: {str(e)}")
    
    def _import_tags_from_xml(self, root, namespaces):
        """Импорт тегов из XML"""
        tags = root.findall('.//wp:tag', namespaces)
        self.stats['tags']['total'] = len(tags)
        
        for tag_elem in tags:
            try:
                tag_slug = tag_elem.find('wp:tag_slug', namespaces)
                tag_name = tag_elem.find('wp:tag_name', namespaces)
                
                if tag_name is not None and tag_slug is not None:
                    tag_data = {
                        'name': tag_name.text,
                        'slug': tag_slug.text,
                        'site': self.target_site,
                    }
                    
                    # Создаем или обновляем тег
                    tag, created = Tag.objects.get_or_create(
                        site=self.target_site,
                        slug=tag_data['slug'],
                        defaults=tag_data
                    )
                    
                    if created:
                        self.stats['tags']['imported'] += 1
                        self.log_success(f"Создан тег: {tag.name}")
                    else:
                        self.log_info(f"Тег уже существует: {tag.name}")
                        
            except Exception as e:
                self.stats['tags']['failed'] += 1
                self.log_error(f"Ошибка импорта тега: {str(e)}")
    
    def _process_xml_item(self, item, namespaces):
        """Обработка отдельного элемента из XML"""
        post_type = item.find('wp:post_type', namespaces)
        post_status = item.find('wp:status', namespaces)
        
        if post_type is None or post_status is None:
            return
        
        post_type_text = post_type.text
        post_status_text = post_status.text
        
        # Пропускаем черновики и удаленные посты (если не указано иное)
        if post_status_text in ['trash', 'auto-draft'] and not self.settings.get('import_drafts', False):
            return
        
        # Импортируем посты
        if post_type_text == 'post' and self.settings.get('import_posts', True):
            self._import_post_from_xml(item, namespaces)
            
        # Импортируем страницы
        elif post_type_text == 'page' and self.settings.get('import_pages', True):
            self._import_page_from_xml(item, namespaces)
    
    def _import_post_from_xml(self, item, namespaces):
        """Импорт поста из XML"""
        try:
            title = item.find('title').text or 'Без названия'
            content_elem = item.find('content:encoded', namespaces)
            content = content_elem.text if content_elem is not None else ''
            excerpt_elem = item.find('excerpt:encoded', namespaces)
            excerpt = excerpt_elem.text if excerpt_elem is not None else ''
            
            # Если excerpt пустой, генерируем из контента
            if not excerpt and content:
                # Убираем HTML теги и берем первые 150 символов
                clean_content = re.sub(r'<[^>]+>', '', content)
                excerpt = clean_content[:150].strip()
                if len(clean_content) > 150:
                    excerpt += '...'
            
            # Если все еще пустой, используем заголовок
            if not excerpt:
                excerpt = title
            
            post_name = item.find('wp:post_name', namespaces)
            slug = post_name.text if post_name is not None else slugify(title)
            
            post_date = item.find('wp:post_date', namespaces)
            created_at = None
            if post_date is not None and post_date.text:
                try:
                    created_at = datetime.strptime(post_date.text, '%Y-%m-%d %H:%M:%S')
                    created_at = timezone.make_aware(created_at)
                except ValueError:
                    pass
            
            # Получаем автора
            creator = item.find('dc:creator', namespaces)
            author = self._get_or_create_author(creator.text if creator is not None else None)
            
            # Создаем пост
            post_data = {
                'title': title,
                'slug': slug,
                'content': self._clean_wordpress_content(content),
                'excerpt': excerpt,
                'site': self.target_site,
                'author': author,
                'status': self._convert_wp_status(item.find('wp:status', namespaces).text),
                'created_at': created_at or timezone.now(),
            }
            
            # Проверяем, существует ли пост
            existing_post = Post.objects.filter(
                site=self.target_site,
                slug=slug
            ).first()
            
            if existing_post and not self.settings.get('update_existing', False):
                self.log_info(f"Пост уже существует: {title}")
                return
            
            with transaction.atomic():
                if existing_post and self.settings.get('update_existing', False):
                    # Обновляем существующий пост
                    for key, value in post_data.items():
                        setattr(existing_post, key, value)
                    existing_post.save()
                    post = existing_post
                    self.log_success(f"Обновлен пост: {title}")
                else:
                    # Создаем новый пост
                    post = Post.objects.create(**post_data)
                    self.log_success(f"Создан пост: {title}")
                
                # Добавляем категории и теги
                self._assign_categories_and_tags(post, item, namespaces)
                
                self.stats['posts']['imported'] += 1
                self.import_job.imported_items += 1
                
        except Exception as e:
            self.stats['posts']['failed'] += 1
            self.log_error(f"Ошибка импорта поста '{title}': {str(e)}")
    
    def _import_page_from_xml(self, item, namespaces):
        """Импорт страницы из XML"""
        try:
            title = item.find('title').text or 'Без названия'
            content_elem = item.find('content:encoded', namespaces)
            content = content_elem.text if content_elem is not None else ''
            
            post_name = item.find('wp:post_name', namespaces)
            slug = post_name.text if post_name is not None else slugify(title)
            
            # Получаем автора
            creator = item.find('dc:creator', namespaces)
            author = self._get_or_create_author(creator.text if creator is not None else None)
            
            # Создаем страницу
            page_data = {
                'title': title,
                'slug': slug,
                'content': self._clean_wordpress_content(content),
                'site': self.target_site,
                'author': author,
                'status': self._convert_wp_status(item.find('wp:status', namespaces).text),
            }
            
            # Проверяем, существует ли страница
            existing_page = Page.objects.filter(
                site=self.target_site,
                slug=slug
            ).first()
            
            if existing_page and not self.settings.get('update_existing', False):
                self.log_info(f"Страница уже существует: {title}")
                return
            
            if existing_page and self.settings.get('update_existing', False):
                # Обновляем существующую страницу
                for key, value in page_data.items():
                    setattr(existing_page, key, value)
                existing_page.save()
                self.log_success(f"Обновлена страница: {title}")
            else:
                # Создаем новую страницу
                Page.objects.create(**page_data)
                self.log_success(f"Создана страница: {title}")
            
            self.stats['pages']['imported'] += 1
            self.import_job.imported_items += 1
            
        except Exception as e:
            self.stats['pages']['failed'] += 1
            self.log_error(f"Ошибка импорта страницы '{title}': {str(e)}")
    
    def _assign_categories_and_tags(self, post, item, namespaces):
        """Назначение категорий и тегов посту"""
        try:
            # Категории
            categories = item.findall('category[@domain="category"]')
            for cat in categories:
                if cat.text and cat.get('nicename'):
                    try:
                        category = Category.objects.get(
                            site=self.target_site,
                            slug=cat.get('nicename')
                        )
                        post.category = category
                        post.save()
                        break  # Берем только первую категорию
                    except Category.DoesNotExist:
                        pass
            
            # Теги
            tags = item.findall('category[@domain="post_tag"]')
            for tag in tags:
                if tag.text and tag.get('nicename'):
                    try:
                        tag_obj = Tag.objects.get(
                            site=self.target_site,
                            slug=tag.get('nicename')
                        )
                        post.tags.add(tag_obj)
                    except Tag.DoesNotExist:
                        pass
                        
        except Exception as e:
            self.log_warning(f"Ошибка назначения категорий/тегов: {str(e)}")
    
    def _get_or_create_author(self, username: Optional[str]) -> User:
        """Получение или создание автора"""
        if not username:
            # Используем автора по умолчанию
            default_author_id = self.settings.get('default_author')
            if default_author_id:
                try:
                    return User.objects.get(id=default_author_id)
                except User.DoesNotExist:
                    pass
            
            # Используем создателя задачи импорта
            return self.import_job.created_by
        
        # Ищем пользователя по username
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            # Создаем нового пользователя (неактивного)
            user = User.objects.create_user(
                username=username,
                email=f"{username}@imported.local",
                is_active=False,
                first_name=username.title()
            )
            self.log_info(f"Создан пользователь: {username}")
            return user
    
    def _convert_wp_status(self, wp_status: str) -> str:
        """Конвертация статуса WordPress в наш формат"""
        status_map = {
            'publish': 'published',
            'draft': 'draft',
            'private': 'draft',
            'pending': 'draft',
            'future': 'scheduled',
            'trash': 'archived',
        }
        return status_map.get(wp_status, 'draft')
    
    def _clean_wordpress_content(self, content: str) -> str:
        """Очистка контента WordPress"""
        if not content:
            return ''
        
        # Удаляем WordPress шорткоды
        content = re.sub(r'\[.*?\]', '', content)
        
        # Заменяем WordPress теги изображений
        content = re.sub(
            r'<img([^>]*?)src=["\']([^"\']*?)["\']([^>]*?)>',
            r'<img\1src="\2"\3>',
            content
        )
        
        return content.strip()
    
    def _finish_import(self, success: bool):
        """Завершение импорта"""
        self.import_job.completed_at = timezone.now()
        self.import_job.status = 'completed' if success else 'failed'
        self.import_job.results = self.stats
        self.import_job.save()
        
        if success:
            self.log_success("Импорт успешно завершен")
        else:
            self.log_error("Импорт завершен с ошибками")
        
        # Логируем статистику
        for content_type, stats in self.stats.items():
            if stats['total'] > 0:
                self.log_info(
                    f"{content_type.title()}: {stats['imported']}/{stats['total']} "
                    f"импортировано, {stats['failed']} ошибок"
                )
    
    def log_info(self, message: str, details: Dict = None):
        """Логирование информации"""
        ImportLog.objects.create(
            job=self.import_job,
            level='info',
            message=message,
            details=details or {}
        )
        logger.info(f"Import {self.import_job.id}: {message}")
    
    def log_success(self, message: str, details: Dict = None):
        """Логирование успеха"""
        ImportLog.objects.create(
            job=self.import_job,
            level='success',
            message=message,
            details=details or {}
        )
        logger.info(f"Import {self.import_job.id}: {message}")
    
    def log_warning(self, message: str, details: Dict = None):
        """Логирование предупреждения"""
        ImportLog.objects.create(
            job=self.import_job,
            level='warning',
            message=message,
            details=details or {}
        )
        logger.warning(f"Import {self.import_job.id}: {message}")
    
    def log_error(self, message: str, details: Dict = None):
        """Логирование ошибки"""
        ImportLog.objects.create(
            job=self.import_job,
            level='error',
            message=message,
            details=details or {}
        )
        logger.error(f"Import {self.import_job.id}: {message}")


def create_wordpress_import_job(data: Dict, user: User) -> ImportJob:
    """Создание задачи импорта WordPress"""
    
    # Создаем или получаем источник WordPress
    try:
        source = ImportSource.objects.get(
            platform='wordpress',
            name='WordPress Import'
        )
    except ImportSource.DoesNotExist:
        source = ImportSource.objects.create(
            platform='wordpress',
            name='WordPress Import',
            description='Импорт данных из WordPress',
            is_active=True
        )
    except ImportSource.MultipleObjectsReturned:
        # Если есть несколько источников, берем первый активный
        source = ImportSource.objects.filter(
            platform='wordpress',
            name='WordPress Import',
            is_active=True
        ).first()
        if not source:
            # Если активных нет, берем любой
            source = ImportSource.objects.filter(
                platform='wordpress',
                name='WordPress Import'
            ).first()
    
    # Получаем целевой сайт
    target_site = Site.objects.get(id=data['target_site'])
    
    # Определяем типы контента для импорта
    content_types = []
    if data.get('import_posts', True):
        content_types.append('posts')
    if data.get('import_pages', True):
        content_types.append('pages')
    if data.get('import_categories', True):
        content_types.append('categories')
    if data.get('import_tags', True):
        content_types.append('tags')
    if data.get('import_media', False):
        content_types.append('media')
    
    # Подготавливаем настройки импорта (без файла)
    import_settings = {
        'source_type': data.get('source_type', 'file'),
        'import_posts': data.get('import_posts', True),
        'import_pages': data.get('import_pages', True),
        'import_categories': data.get('import_categories', True),
        'import_tags': data.get('import_tags', True),
        'import_media': data.get('import_media', False),
        'update_existing': data.get('update_existing', False),
        'preserve_ids': data.get('preserve_ids', False),
        'wordpress_url': data.get('wordpress_url'),
        'api_username': data.get('api_username'),
        'api_password': data.get('api_password'),
        'default_author': data.get('default_author'),
    }
    
    # Создаем задачу импорта
    import_job = ImportJob.objects.create(
        name=data['name'],
        source=source,
        target_site=target_site,
        created_by=user,
        content_types=content_types,
        import_settings=import_settings,  # Только JSON-сериализуемые данные
        source_file=data.get('source_file')  # Файл отдельно
    )
    
    return import_job 