# Backend Style Guide

## 📋 Обзор

Данное руководство определяет стандарты кодирования, архитектурные принципы и лучшие практики для разработки Backend API системы FastAPI Admin.

---

## 🐍 Python Code Style

### 1. Основные принципы

#### PEP 8 Compliance
- **Обязательное** соблюдение PEP 8
- Длина строки: **88 символов** (Black formatter)
- Отступы: **4 пробела**
- Кодировка: **UTF-8**

#### Type Hints
```python
# ✅ Хорошо
from typing import List, Dict, Optional, Union
from django.http import HttpRequest, HttpResponse

def get_user_posts(user_id: int, limit: Optional[int] = None) -> List[Dict[str, str]]:
    """Получает посты пользователя"""
    return Post.objects.filter(author_id=user_id)[:limit]

# ❌ Плохо
def get_user_posts(user_id, limit=None):
    return Post.objects.filter(author_id=user_id)[:limit]
```

#### Docstrings
```python
# ✅ Хорошо - Google Style
def calculate_post_rating(post: Post, user_ratings: List[int]) -> float:
    """
    Вычисляет рейтинг поста на основе пользовательских оценок.
    
    Args:
        post: Объект поста для вычисления рейтинга
        user_ratings: Список пользовательских оценок от 1 до 5
        
    Returns:
        Средний рейтинг поста как float число
        
    Raises:
        ValueError: Если список оценок пустой
    """
    if not user_ratings:
        raise ValueError("Список оценок не может быть пустым")
    
    return sum(user_ratings) / len(user_ratings)
```

### 2. Naming Conventions

#### Variables & Functions
```python
# ✅ Хорошо - snake_case
user_profile = get_user_profile(user_id)
is_published = True
current_timestamp = timezone.now()

def get_posts_by_category(category_id: int) -> QuerySet:
    pass

# ❌ Плохо - camelCase в Python
userProfile = getUserProfile(userId)
isPublished = True
currentTimestamp = timezone.now()
```

#### Constants
```python
# ✅ Хорошо - UPPER_SNAKE_CASE
MAX_POST_TITLE_LENGTH = 500
DEFAULT_PAGINATION_SIZE = 20
API_VERSION = 'v1'

# В settings
CACHE_TIMEOUT = 300
DATABASE_CONNECTION_TIMEOUT = 30
```

#### Classes
```python
# ✅ Хорошо - PascalCase
class UserProfileSerializer(serializers.ModelSerializer):
    pass

class PostPermission(BasePermission):
    pass

class SiteManagementViewSet(viewsets.ModelViewSet):
    pass
```

---

## 🏗 Django Architecture

### 1. Models Design

#### Base Model Pattern
```python
# ✅ Хорошо - базовый класс с общими полями
class BaseModel(models.Model):
    """Базовая модель с общими полями"""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        abstract = True

class Post(BaseModel):
    title = models.CharField(max_length=500, verbose_name='Заголовок')
    content = models.TextField(verbose_name='Содержание')
    
    class Meta:
        verbose_name = 'Пост'
        verbose_name_plural = 'Посты'
        ordering = ['-created_at']
```

#### Model Methods
```python
class Post(BaseModel):
    # ... поля модели
    
    def __str__(self) -> str:
        """Строковое представление объекта"""
        return f"{self.title} ({self.status})"
    
    def get_absolute_url(self) -> str:
        """Получает абсолютный URL объекта"""
        return f"/posts/{self.slug}/"
    
    def is_published(self) -> bool:
        """Проверяет, опубликован ли пост"""
        return self.status == 'published'
    
    @property
    def excerpt_or_content(self) -> str:
        """Возвращает краткое описание или обрезанный контент"""
        return self.excerpt or self.content[:200] + '...'
    
    def save(self, *args, **kwargs) -> None:
        """Переопределенный метод сохранения"""
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
```

#### Field Conventions
```python
# ✅ Хорошо - явные параметры полей
class Site(BaseModel):
    name = models.CharField(
        max_length=255,
        verbose_name='Название сайта',
        help_text='Отображаемое название сайта'
    )
    domain = models.CharField(
        max_length=255,
        unique=True,
        verbose_name='Домен',
        help_text='Уникальный домен сайта'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен',
        help_text='Определяет, активен ли сайт'
    )
    
    # JSON поля с значениями по умолчанию
    settings = models.JSONField(
        default=dict,
        verbose_name='Настройки',
        help_text='JSON объект с настройками сайта'
    )
```

### 2. Serializers Patterns

#### Basic Serializer Structure
```python
class PostSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Post"""
    
    # Вычисляемые поля
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags_list = serializers.StringRelatedField(source='tags', many=True, read_only=True)
    
    # SerializerMethodField для сложной логики
    views_formatted = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt',
            'status', 'created_at', 'updated_at',
            'author_name', 'category_name', 'tags_list',
            'views_formatted', 'can_edit'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']
    
    def get_views_formatted(self, obj: Post) -> str:
        """Форматирует количество просмотров"""
        views = obj.views_count
        if views >= 1000:
            return f"{views // 1000}k"
        return str(views)
    
    def get_can_edit(self, obj: Post) -> bool:
        """Проверяет права на редактирование"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        
        return obj.author == request.user or request.user.role.name in ['admin', 'superuser']
    
    def validate_title(self, value: str) -> str:
        """Валидация заголовка"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Заголовок должен содержать минимум 3 символа")
        return value.strip()
    
    def validate(self, data: Dict) -> Dict:
        """Общая валидация данных"""
        # Проверка уникальности slug для сайта
        if 'title' in data:
            slug = slugify(data['title'])
            site = data.get('site', self.instance.site if self.instance else None)
            
            queryset = Post.objects.filter(slug=slug, site=site)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    'title': 'Пост с таким заголовком уже существует на данном сайте'
                })
        
        return data
```

#### Nested Serializers
```python
# ✅ Хорошо - правильная структура вложенных сериализаторов
class CategoryListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор категории для списков"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'color']

class PostDetailSerializer(PostSerializer):
    """Детальный сериализатор поста"""
    category = CategoryListSerializer(read_only=True)
    tags = TagListSerializer(many=True, read_only=True)
    
    # Дополнительные поля для детального просмотра
    meta_title = serializers.CharField()
    meta_description = serializers.CharField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + [
            'meta_title', 'meta_description', 'allow_comments'
        ]
```

### 3. ViewSets Structure

#### Standard ViewSet Pattern
```python
class PostViewSet(viewsets.ModelViewSet):
    """ViewSet для управления постами"""
    
    queryset = Post.objects.select_related('author', 'site', 'category').prefetch_related('tags')
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, PostPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'content', 'author__username']
    ordering_fields = ['created_at', 'title', 'views_count']
    ordering = ['-created_at']
    
    def get_queryset(self) -> QuerySet:
        """Фильтрация queryset на основе роли пользователя"""
        queryset = super().get_queryset()
        user_role = self.request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return queryset
        elif user_role == Role.ADMIN:
            # Админ видит только посты своих сайтов
            return queryset.filter(site__owner=self.request.user)
        elif user_role == Role.AUTHOR:
            # Автор видит только свои посты
            return queryset.filter(author=self.request.user)
        
        return queryset.none()
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostSerializer
    
    def perform_create(self, serializer) -> None:
        """Дополнительная логика при создании"""
        serializer.save(
            author=self.request.user,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None) -> Response:
        """Дублирование поста"""
        original_post = self.get_object()
        
        # Создаем копию поста
        new_post = Post.objects.create(
            title=f"{original_post.title} (копия)",
            content=original_post.content,
            excerpt=original_post.excerpt,
            site=original_post.site,
            author=request.user,
            category=original_post.category,
            status='draft'
        )
        
        # Копируем теги
        new_post.tags.set(original_post.tags.all())
        
        serializer = self.get_serializer(new_post)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None) -> Response:
        """Изменение статуса поста"""
        post = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Post.STATUS_CHOICES):
            return Response(
                {'error': 'Недопустимый статус'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        post.status = new_status
        post.save(update_fields=['status', 'updated_at'])
        
        return Response({'status': 'success', 'new_status': new_status})
```

### 4. Permissions System

#### Base Permission Classes
```python
class BaseModelPermission(BasePermission):
    """Базовый класс разрешений"""
    
    def has_permission(self, request: HttpRequest, view) -> bool:
        """Проверка базовых разрешений"""
        if not request.user.is_authenticated:
            return False
        
        if not hasattr(request.user, 'role') or request.user.role is None:
            return False
        
        return True
    
    def has_object_permission(self, request: HttpRequest, view, obj) -> bool:
        """Проверка разрешений на уровне объекта"""
        return self.check_object_level_permission(request.user, view.action, obj)
    
    def check_object_level_permission(self, user, action: str, obj) -> bool:
        """Проверка разрешений для конкретного объекта"""
        raise NotImplementedError("Метод должен быть переопределен в подклассах")

class PostPermission(BaseModelPermission):
    """Разрешения для постов"""
    
    def check_object_level_permission(self, user, action: str, obj: Post) -> bool:
        user_role = user.role.name
        
        # Суперпользователь может все
        if user_role == Role.SUPERUSER:
            return True
        
        # Администратор может управлять постами на своих сайтах
        if user_role == Role.ADMIN:
            return obj.site.owner == user
        
        # Автор может управлять только своими постами
        if user_role == Role.AUTHOR:
            if action in ['retrieve']:
                return user in obj.site.assigned_users.all()
            else:
                return obj.author == user
        
        return False
```

---

## 🗄 Database Patterns

### 1. Query Optimization

#### Efficient QuerySets
```python
# ✅ Хорошо - оптимизированные запросы
class PostViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Post.objects.select_related(
            'author',       # Один к одному/многим
            'site', 
            'category'
        ).prefetch_related(
            'tags',         # Многие ко многим
            'site__assigned_users'
        ).annotate(
            comments_count=Count('comments'),
            avg_rating=Avg('ratings__value')
        )

# ❌ Плохо - N+1 проблема
def get_posts_with_authors():
    posts = Post.objects.all()
    for post in posts:
        print(f"{post.title} by {post.author.username}")  # N+1 запросов!
```

#### Bulk Operations
```python
# ✅ Хорошо - массовые операции
def bulk_update_posts_status(post_ids: List[int], new_status: str) -> None:
    """Массовое обновление статуса постов"""
    Post.objects.filter(id__in=post_ids).update(
        status=new_status,
        updated_at=timezone.now()
    )

def bulk_create_tags(site: Site, tag_names: List[str]) -> List[Tag]:
    """Массовое создание тегов"""
    tags_to_create = [
        Tag(name=name, site=site, slug=slugify(name))
        for name in tag_names
        if not Tag.objects.filter(name=name, site=site).exists()
    ]
    
    return Tag.objects.bulk_create(tags_to_create)

# ❌ Плохо - множественные запросы
for post_id in post_ids:
    post = Post.objects.get(id=post_id)
    post.status = new_status
    post.save()
```

### 2. Model Relationships

#### Foreign Key Best Practices
```python
class Post(BaseModel):
    # ✅ Хорошо - правильные related_name
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE,
        related_name='posts',  # site.posts.all()
        verbose_name='Сайт'
    )
    
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='authored_posts',  # Избегаем конфликтов с auth.User
        verbose_name='Автор'
    )
    
    category = models.ForeignKey(
        'Category',  # Строковая ссылка для избежания циклических импортов
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
        verbose_name='Категория'
    )

class Category(BaseModel):
    # ✅ Хорошо - самоссылающаяся связь для иерархии
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Родительская категория'
    )
```

#### Many-to-Many Relationships
```python
class Post(BaseModel):
    # ✅ Хорошо - M2M с промежуточной моделью для дополнительных данных
    tags = models.ManyToManyField(
        'Tag',
        through='PostTag',
        related_name='posts',
        blank=True,
        verbose_name='Теги'
    )

class PostTag(models.Model):
    """Промежуточная модель для связи Post-Tag"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['post', 'tag']
        verbose_name = 'Тег поста'
        verbose_name_plural = 'Теги постов'
```

### 3. Migrations Best Practices

#### Data Migrations
```python
# ✅ Хорошо - data migration для заполнения данных
from django.db import migrations

def create_default_roles(apps, schema_editor):
    """Создание ролей по умолчанию"""
    Role = apps.get_model('accounts', 'Role')
    
    default_roles = [
        {'name': 'superuser', 'permissions': {}},
        {'name': 'admin', 'permissions': {}},
        {'name': 'author', 'permissions': {}},
        {'name': 'user', 'permissions': {}},
    ]
    
    for role_data in default_roles:
        Role.objects.get_or_create(name=role_data['name'], defaults=role_data)

def reverse_create_default_roles(apps, schema_editor):
    """Откат создания ролей"""
    Role = apps.get_model('accounts', 'Role')
    Role.objects.filter(name__in=['superuser', 'admin', 'author', 'user']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(
            create_default_roles,
            reverse_create_default_roles
        ),
    ]
```

---

## 🔧 API Design Patterns

### 1. Response Formatting

#### Standard Response Structure
```python
# ✅ Хорошо - стандартизированные ответы
class StandardResponse:
    """Стандартная структура ответов API"""
    
    @staticmethod
    def success(data=None, message="Success", status_code=200):
        return Response({
            'status': 'success',
            'message': message,
            'data': data
        }, status=status_code)
    
    @staticmethod
    def error(message="Error", errors=None, status_code=400):
        return Response({
            'status': 'error',
            'message': message,
            'errors': errors
        }, status=status_code)

# Использование в ViewSet
@action(detail=True, methods=['post'])
def publish_post(self, request, pk=None):
    post = self.get_object()
    
    if post.status == 'published':
        return StandardResponse.error(
            message="Пост уже опубликован",
            status_code=400
        )
    
    post.status = 'published'
    post.published_at = timezone.now()
    post.save()
    
    return StandardResponse.success(
        data={'id': post.id, 'status': post.status},
        message="Пост успешно опубликован"
    )
```

#### Pagination
```python
# ✅ Хорошо - кастомная пагинация
class CustomPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'results': data
        })
```

### 2. Error Handling

#### Global Exception Handler
```python
# ✅ Хорошо - централизованная обработка ошибок
from rest_framework.views import exception_handler
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Кастомный обработчик исключений"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Логирование ошибки
        logger.error(
            f"API Error: {exc.__class__.__name__}: {str(exc)}",
            extra={'context': context}
        )
        
        custom_response_data = {
            'status': 'error',
            'message': 'Произошла ошибка при обработке запроса',
            'errors': response.data,
            'timestamp': timezone.now().isoformat()
        }
        
        # Специальная обработка для разных типов ошибок
        if isinstance(exc, ValidationError):
            custom_response_data['message'] = 'Ошибка валидации данных'
        elif isinstance(exc, PermissionDenied):
            custom_response_data['message'] = 'Недостаточно прав доступа'
        elif isinstance(exc, NotFound):
            custom_response_data['message'] = 'Запрашиваемый ресурс не найден'
        
        response.data = custom_response_data
    
    return response
```

#### Model-Level Validation
```python
class Post(BaseModel):
    # ... поля модели
    
    def clean(self):
        """Валидация на уровне модели"""
        super().clean()
        
        errors = {}
        
        # Проверка длины заголовка
        if len(self.title.strip()) < 3:
            errors['title'] = 'Заголовок должен содержать минимум 3 символа'
        
        # Проверка уникальности slug в рамках сайта
        if self.slug:
            qs = Post.objects.filter(slug=self.slug, site=self.site)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                errors['slug'] = 'Пост с таким slug уже существует на данном сайте'
        
        # Проверка статуса публикации
        if self.status == 'published' and not self.content.strip():
            errors['content'] = 'Нельзя публиковать пост без содержания'
        
        if errors:
            raise ValidationError(errors)
```

---

## 🧪 Testing Patterns

### 1. API Testing Structure

#### Base Test Classes
```python
class BaseAPITestCase(APITestCase):
    """Базовый класс для API тестов"""
    
    def setUp(self):
        # Создание ролей
        self.superuser_role = Role.objects.create(name='superuser')
        self.admin_role = Role.objects.create(name='admin')
        self.author_role = Role.objects.create(name='author')
        
        # Создание пользователей
        self.superuser = CustomUser.objects.create_user(
            email='super@test.com',
            password='testpass',
            role=self.superuser_role
        )
        
        self.admin_user = CustomUser.objects.create_user(
            email='admin@test.com',
            password='testpass',
            role=self.admin_role
        )
        
        self.author_user = CustomUser.objects.create_user(
            email='author@test.com',
            password='testpass',
            role=self.author_role
        )
        
        # Создание тестового сайта
        self.test_site = Site.objects.create(
            name='Test Site',
            domain='test.com',
            owner=self.admin_user
        )
    
    def authenticate_user(self, user):
        """Аутентификация пользователя"""
        self.client.force_authenticate(user=user)
    
    def get_token_for_user(self, user):
        """Получение JWT токена для пользователя"""
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

class PostAPITestCase(BaseAPITestCase):
    """Тесты для API постов"""
    
    def setUp(self):
        super().setUp()
        
        # Создание тестовых данных
        self.category = Category.objects.create(
            name='Test Category',
            site=self.test_site
        )
        
        self.test_post = Post.objects.create(
            title='Test Post',
            content='Test content',
            site=self.test_site,
            author=self.author_user,
            category=self.category,
            status='published'
        )
    
    def test_list_posts_as_superuser(self):
        """Тест получения списка постов суперпользователем"""
        self.authenticate_user(self.superuser)
        
        response = self.client.get('/api/v1/posts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Post')
    
    def test_create_post_as_author(self):
        """Тест создания поста автором"""
        self.authenticate_user(self.author_user)
        
        # Назначаем автора к сайту
        self.test_site.assigned_users.add(self.author_user)
        
        data = {
            'title': 'New Post',
            'content': 'New post content',
            'site': self.test_site.id,
            'category': self.category.id,
            'status': 'draft'
        }
        
        response = self.client.post('/api/v1/posts/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Post')
        self.assertEqual(response.data['author'], self.author_user.id)
    
    def test_update_post_permission_denied(self):
        """Тест запрета на редактирование чужого поста"""
        # Создаем другого автора
        other_author = CustomUser.objects.create_user(
            email='other@test.com',
            password='testpass',
            role=self.author_role
        )
        self.authenticate_user(other_author)
        
        data = {'title': 'Updated Title'}
        response = self.client.patch(f'/api/v1/posts/{self.test_post.id}/', data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### 2. Model Testing

```python
class PostModelTestCase(TestCase):
    """Тесты для модели Post"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='test@test.com',
            password='testpass'
        )
        
        self.site = Site.objects.create(
            name='Test Site',
            domain='test.com',
            owner=self.user
        )
    
    def test_slug_auto_generation(self):
        """Тест автогенерации slug"""
        post = Post.objects.create(
            title='Test Post Title',
            content='Test content',
            site=self.site,
            author=self.user
        )
        
        self.assertEqual(post.slug, 'test-post-title')
    
    def test_unique_slug_generation(self):
        """Тест генерации уникального slug"""
        # Создаем первый пост
        Post.objects.create(
            title='Same Title',
            content='Content 1',
            site=self.site,
            author=self.user
        )
        
        # Создаем второй пост с тем же заголовком
        post2 = Post.objects.create(
            title='Same Title',
            content='Content 2',
            site=self.site,
            author=self.user
        )
        
        self.assertEqual(post2.slug, 'same-title-1')
    
    def test_post_str_representation(self):
        """Тест строкового представления поста"""
        post = Post(title='Test Title', status='draft')
        self.assertEqual(str(post), 'Test Title (draft)')
```

---

## 🔒 Security Patterns

### 1. Input Validation

```python
# ✅ Хорошо - строгая валидация входных данных
class PostCreateSerializer(serializers.ModelSerializer):
    def validate_title(self, value):
        # Очистка от HTML тегов
        cleaned_title = strip_tags(value).strip()
        
        if len(cleaned_title) < 3:
            raise serializers.ValidationError(
                "Заголовок должен содержать минимум 3 символа"
            )
        
        if len(cleaned_title) > 500:
            raise serializers.ValidationError(
                "Заголовок не может превышать 500 символов"
            )
        
        return cleaned_title
    
    def validate_content(self, value):
        # Валидация HTML контента
        allowed_tags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3']
        cleaned_content = bleach.clean(value, tags=allowed_tags, strip=True)
        
        return cleaned_content
```

### 2. Permission Granularity

```python
class SiteOwnerPermission(BasePermission):
    """Разрешение только для владельца сайта"""
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'site'):
            site = obj.site
        else:
            site = obj
        
        return site.owner == request.user

class SiteAssignedUserPermission(BasePermission):
    """Разрешение для назначенных пользователей сайта"""
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'site'):
            site = obj.site
        else:
            site = obj
        
        return (
            site.owner == request.user or 
            request.user in site.assigned_users.all()
        )
```

---

## 📊 Performance Patterns

### 1. Caching Strategies

```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class PostViewSet(viewsets.ModelViewSet):
    
    @method_decorator(cache_page(60 * 15))  # 15 минут
    def list(self, request, *args, **kwargs):
        """Кэширование списка постов"""
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        # Кэширование на уровне QuerySet
        cache_key = f"posts_queryset_{self.request.user.id}"
        queryset = cache.get(cache_key)
        
        if queryset is None:
            queryset = Post.objects.select_related(
                'author', 'site', 'category'
            ).prefetch_related('tags')
            cache.set(cache_key, queryset, 300)  # 5 минут
        
        return queryset

# Кэширование на уровне модели
class Post(BaseModel):
    @property
    def cached_comments_count(self):
        cache_key = f"post_{self.id}_comments_count"
        count = cache.get(cache_key)
        
        if count is None:
            count = self.comments.count()
            cache.set(cache_key, count, 600)  # 10 минут
        
        return count
```

### 2. Database Optimization

```python
# ✅ Хорошо - оптимизированные запросы с аннотациями
class PostViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Post.objects.select_related(
            'author',
            'site',
            'category'
        ).prefetch_related(
            'tags'
        ).annotate(
            comments_count=Count('comments'),
            likes_count=Count('likes'),
            avg_rating=Avg('ratings__value'),
            last_comment_date=Max('comments__created_at')
        ).filter(
            site__is_active=True
        )

# Использование F() для атомарных операций
@action(detail=True, methods=['post'])
def increment_views(self, request, pk=None):
    """Увеличение счетчика просмотров"""
    post = self.get_object()
    Post.objects.filter(pk=post.pk).update(
        views_count=F('views_count') + 1
    )
    return Response({'status': 'success'})
```

---

## 📚 Documentation Standards

### 1. API Documentation

```python
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class PostViewSet(viewsets.ModelViewSet):
    
    @swagger_auto_schema(
        operation_description="Получение списка постов с фильтрацией",
        manual_parameters=[
            openapi.Parameter(
                'search',
                openapi.IN_QUERY,
                description="Поиск по заголовку и содержанию",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'category',
                openapi.IN_QUERY,
                description="Фильтр по ID категории",
                type=openapi.TYPE_INTEGER
            ),
        ],
        responses={
            200: openapi.Response(
                description="Список постов",
                schema=PostSerializer(many=True)
            )
        }
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Дублирование поста",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'title': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Новый заголовок для копии (опционально)'
                )
            }
        ),
        responses={
            201: PostSerializer,
            400: "Ошибка валидации",
            403: "Недостаточно прав"
        }
    )
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Создание копии поста"""
        pass
```

---

*Данное руководство по стилю должно строго соблюдаться всеми разработчиками команды для обеспечения консистентности и качества кода.* 