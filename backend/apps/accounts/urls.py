from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    PasswordChangeView,
    LogoutView,
    UserViewSet,
    RoleViewSet,
    user_stats,
    current_user
)

# Создаем роутер для ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'roles', RoleViewSet)

app_name = 'accounts'

urlpatterns = [
    # JWT токены
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Аутентификация
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # Профиль пользователя
    path('me/', current_user, name='me'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('current-user/', current_user, name='current_user'),
    path('change-password/', PasswordChangeView.as_view(), name='change_password'),
    
    # Статистика
    path('stats/', user_stats, name='user_stats'),
    
    # ViewSets маршруты
    path('', include(router.urls)),
] 