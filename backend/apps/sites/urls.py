from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteViewSet, SiteRequestViewSet, SiteStorageSettingsViewSet

# Создаем роутер для ViewSet
router = DefaultRouter()
router.register(r'', SiteViewSet, basename='site')
router.register(r'requests', SiteRequestViewSet, basename='site-request')
router.register(r'storage-settings', SiteStorageSettingsViewSet)

app_name = 'sites'

urlpatterns = [
    path('', include(router.urls)),
] 