from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet

# Создаем роутер для ViewSet
router = DefaultRouter()
router.register(r'', PostViewSet, basename='post')

app_name = 'posts'

urlpatterns = [
    path('', include(router.urls)),
] 