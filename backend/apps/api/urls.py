from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from . import views
from apps.common.views import upload_file_to_cloud, list_media_files, delete_media_file, media_stats

# Настройка Swagger документации
schema_view = get_schema_view(
    openapi.Info(
        title="FastAPI Admin Backend API",
        default_version='v1',
        description="API для системы управления сайтами",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="admin@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

app_name = 'api'

urlpatterns = [
    # Swagger документация
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # Cache management
    path('cache/stats/', views.cache_stats, name='cache-stats'),
    path('cache/clear/', views.clear_cache, name='cache-clear'),
    
    # File upload and media library
    path('files/upload-to-cloud/', upload_file_to_cloud, name='upload-file-to-cloud'),
    path('media/', list_media_files, name='list-media-files'),
    path('media/stats/', media_stats, name='media-stats'),
    path('media/delete/', delete_media_file, name='delete-media-file'),
    
    # API endpoints
    path('auth/', include('apps.accounts.urls')),
    path('sites/', include('apps.sites.urls')),
    path('posts/', include('apps.posts.urls')),
    path('pages/', include('apps.pages.urls')),
    path('settings/', include('apps.settings.urls')),
    path('dynamic-models/', include('apps.dynamic_models.urls')),
    path('analytics/', include('apps.analytics.urls')),
    path('import-export/', include('apps.import_export.urls')),
] 