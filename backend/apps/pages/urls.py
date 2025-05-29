from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PageViewSet

# Создаем роутер для ViewSet
router = DefaultRouter()
router.register(r'', PageViewSet, basename='page')

app_name = 'pages'

urlpatterns = [
    path('', include(router.urls)),
] 