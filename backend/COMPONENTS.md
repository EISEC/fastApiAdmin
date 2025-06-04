# Backend Components Guide

## 📋 Обзор

Этот документ содержит подробное описание всех компонентов backend системы FastAPI Admin, включая модели, сериализаторы, ViewSets, permissions и другие ключевые компоненты.

---

## 🏗 Структура приложений

### 1. 👥 accounts - Система пользователей и авторизации

#### Модели

##### CustomUser
**Назначение:** Кастомная модель пользователя с расширенными возможностями

```python
class CustomUser(AbstractUser):
    username = None  # Убираем стандартное поле username
    email = models.EmailField(unique=True, verbose_name='Email')
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    parent_user = models.ForeignKey('self', null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    about = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    rating = models.PositiveIntegerField(default=0)
    
    USERNAME_FIELD = 'email'  # Используем email для авторизации
    REQUIRED_FIELDS = []
```

**Ключевые особенности:**
- Email как основной идентификатор
- Иерархическая структура (parent_user)
- Связь с ролями
- Дополнительные профильные поля

##### Role
**Назначение:** Система ролей пользователей

```python
class Role(models.Model):
    SUPERUSER = 'superuser'
    ADMIN = 'admin'
    AUTHOR = 'author'
    USER = 'user'
    
    ROLE_CHOICES = [
        (SUPERUSER, 'Суперпользователь'),
        (ADMIN, 'Администратор'),
        (AUTHOR, 'Автор'),
        (USER, 'Пользователь'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    permissions = models.JSONField(default=dict)
```

#### Сериализаторы

##### CustomTokenObtainPairSerializer
**Назначение:** Кастомный JWT сериализатор с дополнительными данными

```python
@classmethod
def get_token(cls, user):
    token = super().get_token(user)
    
    # Добавляем пользовательские данные в токен
    token['username'] = user.username
    token['email'] = user.email
    token['role'] = user.role.name
    token['role_display'] = user.role.get_name_display()
    
    return token
```

##### UserProfileSerializer
**Назначение:** Полный профиль пользователя

```python
class UserProfileSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    accessible_sites_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'full_name', 'birth_date', 'about',
            'avatar', 'rating', 'is_active',
            'accessible_sites_count', 'created_at'
        ]
```

#### ViewSets

##### UserViewSet
**Назначение:** CRUD операции для пользователей

**Ключевые действия:**
- `toggle_active()` - Активация/деактивация пользователя
- `reset_password()` - Сброс пароля
- Фильтрация по ролям в `get_queryset()`

#### Permissions

##### UserPermission
**Назначение:** Проверка прав доступа к пользователям

```python
def has_permission(self, request, view):
    user_role = request.user.role.name
    
    if view.action in ['list', 'retrieve']:
        return user_role in [Role.SUPERUSER, Role.ADMIN]
    elif view.action in ['create', 'update', 'destroy']:
        return user_role in [Role.SUPERUSER, Role.ADMIN]
    
    return False
```

---

### 2. 🌐 sites - Управление сайтами

#### Модели

##### Site
**Назначение:** Модель сайта с настройками и метаданными

```python
class Site(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название сайта')
    domain = models.CharField(max_length=255, unique=True)
    header_scripts = models.TextField(blank=True)
    footer_scripts = models.TextField(blank=True)
    main_screen_settings = models.JSONField(default=dict)
    seo_settings = models.JSONField(default=dict)
    
    # Изображения
    icon = models.ImageField(upload_to='sites/icons/', null=True, blank=True)
    default_image = models.ImageField(upload_to='sites/defaults/', null=True, blank=True)
    
    # Связи
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_sites')
    assigned_users = models.ManyToManyField(User, blank=True, related_name='assigned_sites')
```

**Ключевые методы:**
- `get_posts_count()` - Количество опубликованных постов
- `get_pages_count()` - Количество страниц
- `can_user_access(user)` - Проверка доступа пользователя

#### Сериализаторы

##### SiteDetailSerializer
**Назначение:** Подробная информация о сайте

```python
class SiteDetailSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    posts_count = serializers.SerializerMethodField()
    pages_count = serializers.SerializerMethodField()
    assigned_users = UserListSerializer(many=True, read_only=True)
    
    def get_posts_count(self, obj):
        return obj.get_posts_count()
```

#### ViewSets

##### SiteViewSet
**Назначение:** Управление сайтами

**Кастомные действия:**
- `stats(id)` - Статистика сайта
- `assign_users(id)` - Назначение пользователей
- `remove_user(id)` - Удаление пользователя
- `toggle_active(id)` - Активация/деактивация
- `my_sites()` - Сайты текущего пользователя

---

### 3. 📝 posts - Система постов

#### Модели

##### Post
**Назначение:** Модель поста с категориями и тегами

```python
class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликован'),
        ('scheduled', 'Запланирован'),
        ('archived', 'Архивирован'),
    ]
    
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True)
    content = models.TextField()
    excerpt = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Связи
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey('Category', null=True, blank=True, on_delete=models.SET_NULL)
    tags = models.ManyToManyField('Tag', blank=True, related_name='posts')
    
    # Метаданные
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    views_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    allow_comments = models.BooleanField(default=True)
```

##### Category
**Назначение:** Категории постов

```python
class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='categories')
    order = models.PositiveIntegerField(default=0)
```

##### Tag
**Назначение:** Теги постов

```python
class Tag(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    color = models.CharField(max_length=7, default='#6B7280')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='tags')
```

#### ViewSets

##### PostViewSet
**Назначение:** Управление постами

**Кастомные действия:**
- `duplicate(id)` - Дублирование поста
- `change_status(id)` - Изменение статуса
- `increment_views(id)` - Увеличение просмотров
- `by_category()` - Посты по категории
- `by_tag()` - Посты по тегу
- `my_posts()` - Посты пользователя
- `published()` - Опубликованные посты

---

### 4. 📄 pages - Система страниц

#### Модели

##### Page
**Назначение:** Модель страницы с Page Builder

```python
class Page(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликована'),
        ('archived', 'Архивирована'),
    ]
    
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Page Builder данные
    components = models.JSONField(default=list, verbose_name='Компоненты страницы')
    compiled_css = models.TextField(blank=True, verbose_name='Скомпилированный CSS')
    
    # Связи
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='pages')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pages')
    
    # Метаданные
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    meta_keywords = models.CharField(max_length=500, blank=True)
    is_homepage = models.BooleanField(default=False)
```

**Ключевые методы:**
- `compile_components_to_html()` - Компиляция компонентов в HTML
- `compile_components_to_css()` - Компиляция CSS

#### ViewSets

##### PageViewSet
**Назначение:** Управление страницами

**Кастомные действия:**
- `compile(id)` - Компиляция страницы
- `preview(id)` - Предварительный просмотр
- `render(id)` - Рендер HTML
- `publish(id)` - Публикация
- `unpublish(id)` - Снятие с публикации
- `set_home(id)` - Установка как главная

---

### 5. ⚙️ settings - Система настроек

#### Модели

##### SettingCategory
**Назначение:** Категории настроек

```python
class SettingCategory(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='⚙️')
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
```

##### SettingGroup
**Назначение:** Группы настроек внутри категорий

```python
class SettingGroup(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(SettingCategory, on_delete=models.CASCADE, related_name='groups')
    icon = models.CharField(max_length=10, blank=True)
    order = models.PositiveIntegerField(default=0)
```

##### Setting
**Назначение:** Индивидуальные настройки

```python
class Setting(models.Model):
    SETTING_TYPES = [
        ('text', 'Текст'),
        ('email', 'Email'),
        ('url', 'URL'),
        ('password', 'Пароль'),
        ('number', 'Число'),
        ('boolean', 'Переключатель'),
        ('select', 'Выпадающий список'),
        ('textarea', 'Многострочный текст'),
        ('color', 'Цвет'),
        ('file', 'Файл'),
        ('image', 'Изображение'),
        ('json', 'JSON'),
        ('rich_text', 'Форматированный текст'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=SETTING_TYPES)
    value = models.JSONField(null=True, blank=True)
    default_value = models.JSONField(null=True, blank=True)
    
    group = models.ForeignKey(SettingGroup, on_delete=models.CASCADE, related_name='settings')
    site = models.ForeignKey(Site, null=True, blank=True, on_delete=models.CASCADE)
    
    # Валидация
    is_required = models.BooleanField(default=False)
    is_readonly = models.BooleanField(default=False)
    validation_rules = models.JSONField(null=True, blank=True)
    options = models.JSONField(null=True, blank=True)
```

**Ключевые методы:**
- `get_value()` - Безопасное получение значения
- `set_value(value, user)` - Безопасная установка значения

#### ViewSets

##### SettingViewSet
**Назначение:** Управление настройками

**Кастомные действия:**
- `list_all()` - Все настройки структурированно
- `bulk_update()` - Массовое обновление
- `export()` - Экспорт в JSON
- `import_data()` - Импорт из JSON

---

### 6. 🔧 dynamic_models - Динамические модели

#### Модели

##### DynamicModel
**Назначение:** Конфигурация динамических моделей

```python
class DynamicModel(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    fields_config = models.JSONField(default=list)
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='dynamic_models')
    is_active = models.BooleanField(default=True)
```

##### DynamicModelData
**Назначение:** Данные динамических моделей

```python
class DynamicModelData(models.Model):
    model = models.ForeignKey(DynamicModel, on_delete=models.CASCADE, related_name='data')
    data = models.JSONField(default=dict)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
```

---

### 7. 🛠 common - Общие компоненты

#### Permissions

##### BaseModelPermission
**Назначение:** Базовый класс разрешений

```python
class BaseModelPermission(BasePermission):
    def has_permission(self, request, view):
        # Проверка аутентификации
        if not request.user.is_authenticated:
            return False
        
        # Проверка роли
        user_role = request.user.role.name
        
        if view.action in ['list', 'retrieve']:
            return user_role in [Role.SUPERUSER, Role.ADMIN, Role.AUTHOR]
        elif view.action in ['create', 'update', 'partial_update', 'destroy']:
            return user_role in [Role.SUPERUSER, Role.ADMIN]
        
        return False
```

##### SitePermission
**Назначение:** Разрешения для сайтов

```python
def has_object_permission(self, request, view, obj):
    user_role = request.user.role.name
    
    if user_role == Role.SUPERUSER:
        return True
    elif user_role == Role.ADMIN:
        return obj.owner == request.user
    elif user_role == Role.AUTHOR:
        return request.user in obj.assigned_users.all()
    
    return False
```

#### Mixins

##### TimestampMixin
**Назначение:** Добавление временных меток

```python
class TimestampMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    
    class Meta:
        abstract = True
```

##### UserTrackingMixin
**Назначение:** Отслеживание пользователей

```python
class UserTrackingMixin(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='%(class)s_created')
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='%(class)s_updated')
    
    class Meta:
        abstract = True
```

#### Utilities

##### Slug Generator
```python
def generate_unique_slug(model_class, title, slug_field='slug'):
    """
    Генерация уникального slug
    """
    base_slug = slugify(title)
    slug = base_slug
    counter = 1
    
    while model_class.objects.filter(**{slug_field: slug}).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug
```

##### Permission Checker
```python
def check_user_role(user, allowed_roles):
    """
    Проверка роли пользователя
    """
    if not user.is_authenticated:
        return False
    
    if not hasattr(user, 'role') or user.role is None:
        return False
    
    return user.role.name in allowed_roles
```

---

### 8. 🔗 api - API роутинг

#### URL Configuration

##### Main Router
```python
# apps/api/urls.py
app_name = 'api'

urlpatterns = [
    # Swagger документация
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API endpoints
    path('auth/', include('apps.accounts.urls')),
    path('sites/', include('apps.sites.urls')),
    path('posts/', include('apps.posts.urls')),
    path('pages/', include('apps.pages.urls')),
    path('settings/', include('apps.settings.urls')),
]
```

#### Swagger Configuration

```python
schema_view = get_schema_view(
    openapi.Info(
        title="FastAPI Admin Backend API",
        default_version='v1',
        description="API для системы управления сайтами",
        contact=openapi.Contact(email="admin@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)
```

---

## 🔧 Management Commands

### create_demo_settings
**Назначение:** Создание демонстрационных настроек

```python
class Command(BaseCommand):
    help = 'Создание демонстрационных настроек'
    
    def handle(self, *args, **options):
        # Создание категорий
        categories = self.create_categories()
        
        # Создание групп
        groups = self.create_groups(categories)
        
        # Создание настроек
        settings = self.create_settings(groups)
```

### check_api_urls
**Назначение:** Проверка всех API URL

```python
def handle(self, *args, **options):
    resolver = get_resolver()
    
    for url_pattern in resolver.url_patterns:
        if hasattr(url_pattern, 'pattern'):
            self.check_pattern(url_pattern)
```

### check_potential_issues
**Назначение:** Проверка потенциальных проблем в коде

```python
def handle(self, *args, **options):
    issues = []
    
    # Проверяем использование полей
    self.check_field_usage(issues)
    
    # Проверяем импорты
    self.check_filter_backend_usage(issues)
    
    # Проверяем модели
    self.check_model_fields(issues)
```

---

## 📊 Примеры использования

### Создание пользователя

```python
from apps.accounts.models import CustomUser, Role

# Получение роли
author_role = Role.objects.get(name='author')

# Создание пользователя
user = CustomUser.objects.create_user(
    email='author@example.com',
    password='securepassword',
    first_name='John',
    last_name='Doe',
    role=author_role
)
```

### Создание сайта

```python
from apps.sites.models import Site

site = Site.objects.create(
    name='My Blog',
    domain='myblog.com',
    owner=user,
    main_screen_settings={
        'title': 'Welcome to My Blog',
        'subtitle': 'Sharing thoughts and ideas'
    }
)
```

### Создание поста

```python
from apps.posts.models import Post, Category

# Создание категории
category = Category.objects.create(
    name='Technology',
    site=site,
    color='#3B82F6'
)

# Создание поста
post = Post.objects.create(
    title='My First Post',
    content='This is the content of my first post.',
    status='published',
    site=site,
    author=user,
    category=category
)
```

### Работа с настройками

```python
from apps.settings.models import Setting

# Получение настройки
site_name = Setting.objects.get(key='site_name')
current_value = site_name.get_value()

# Установка значения
site_name.set_value('New Site Name', user)
```

---

## 🧪 Тестирование компонентов

### API Test Example

```python
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import CustomUser, Role

class PostAPITestCase(APITestCase):
    def setUp(self):
        self.role = Role.objects.create(name='author')
        self.user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpass',
            role=self.role
        )
        self.client.force_authenticate(user=self.user)
        
    def test_create_post(self):
        data = {
            'title': 'Test Post',
            'content': 'Test content',
            'site': self.site.id
        }
        response = self.client.post('/api/v1/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

---

## 🔍 Debugging и профилирование

### SQL Query Analysis

```python
# В Django shell
from django.db import connection
from apps.posts.models import Post

# Очистка запросов
connection.queries.clear()

# Выполнение операции
posts = Post.objects.select_related('site', 'author').prefetch_related('tags')
list(posts)

# Просмотр запросов
for query in connection.queries:
    print(query['sql'])
```

### Performance Monitoring

```python
import time
from django.db import connection

def monitor_queries(func):
    def wrapper(*args, **kwargs):
        start_queries = len(connection.queries)
        start_time = time.time()
        
        result = func(*args, **kwargs)
        
        end_time = time.time()
        end_queries = len(connection.queries)
        
        print(f"Queries: {end_queries - start_queries}")
        print(f"Time: {end_time - start_time:.2f}s")
        
        return result
    return wrapper
```

---

*Эта документация покрывает все основные компоненты backend системы и будет регулярно обновляться по мере развития проекта.* 