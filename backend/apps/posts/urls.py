from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CategoryViewSet, TagViewSet

# Создаем роутер для ViewSet
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='post-category')
router.register(r'tags', TagViewSet, basename='post-tag')
router.register(r'', PostViewSet, basename='post')

app_name = 'posts'

urlpatterns = [
    path('', include(router.urls)),
] 