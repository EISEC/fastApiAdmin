from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DynamicModelViewSet,
    DynamicModelDataViewSet,
    DynamicModelVersionViewSet,
    DynamicFieldTypeViewSet,
    DynamicModelExtensionViewSet,
    DynamicModelPermissionViewSet
)

app_name = 'dynamic_models'

# Создаем роутер для автоматической генерации URL
router = DefaultRouter()

# Регистрируем ViewSets
router.register(r'models', DynamicModelViewSet, basename='dynamicmodel')
router.register(r'data', DynamicModelDataViewSet, basename='dynamicmodeldata')
router.register(r'versions', DynamicModelVersionViewSet, basename='dynamicmodelversion')
router.register(r'field-types', DynamicFieldTypeViewSet, basename='dynamicfieldtype')
router.register(r'extensions', DynamicModelExtensionViewSet, basename='dynamicmodelextension')
router.register(r'permissions', DynamicModelPermissionViewSet, basename='dynamicmodelpermission')

urlpatterns = [
    path('', include(router.urls)),
] 