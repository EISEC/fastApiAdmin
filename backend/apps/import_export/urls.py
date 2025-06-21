from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ImportSourceViewSet, ImportJobViewSet, 
    ImportMappingViewSet, ImportLogViewSet
)

router = DefaultRouter()
router.register(r'sources', ImportSourceViewSet)
router.register(r'jobs', ImportJobViewSet)
router.register(r'mappings', ImportMappingViewSet)
router.register(r'logs', ImportLogViewSet)

app_name = 'import_export'

urlpatterns = [
    path('', include(router.urls)),
] 