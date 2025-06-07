from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SettingCategoryViewSet,
    SettingGroupViewSet,
    SettingViewSet,
    SettingTemplateViewSet,
    SocialNetworkSettingViewSet
)

router = DefaultRouter()
router.register(r'categories', SettingCategoryViewSet, basename='setting-category')
router.register(r'groups', SettingGroupViewSet, basename='setting-group')
router.register(r'templates', SettingTemplateViewSet, basename='setting-template')
router.register(r'social-networks', SocialNetworkSettingViewSet, basename='social-network')
router.register(r'', SettingViewSet, basename='setting')

app_name = 'settings'

urlpatterns = [
    # Кастомные endpoints должны быть ПЕРЕД основным роутером
    path('all/', SettingViewSet.as_view({'get': 'list_all'}), name='list-all'),
    path('bulk/', SettingViewSet.as_view({'put': 'bulk_update'}), name='bulk-update'),
    path('import/', SettingViewSet.as_view({'put': 'import_data'}), name='import'),
    
    # Основной роутер
    path('', include(router.urls)),
] 