from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import serializers

from .models import Role, CustomUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserListSerializer,
    UserCreateSerializer,
    PasswordChangeSerializer,
    RoleSerializer
)
from apps.common.permissions import UserPermission, check_user_role

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Кастомный view для получения JWT токенов"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """View для регистрации новых пользователей"""
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View для просмотра и редактирования профиля пользователя"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class PasswordChangeView(generics.GenericAPIView):
    """View для смены пароля"""
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Пароль успешно изменен'
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    """View для выхода из системы (блокировка refresh токена)"""
    permission_classes = [permissions.IsAuthenticated]
    
    class LogoutSerializer(serializers.Serializer):
        refresh_token = serializers.CharField(required=False, help_text="Refresh токен для блокировки")
    
    serializer_class = LogoutSerializer
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Вы успешно вышли из системы'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': 'Ошибка при выходе из системы'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(ModelViewSet):
    """ViewSet для управления пользователями"""
    queryset = CustomUser.objects.all()
    permission_classes = [permissions.IsAuthenticated, UserPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия"""
        if self.action == 'list':
            return UserListSerializer
        elif self.action == 'create':
            return UserCreateSerializer
        return UserProfileSerializer
    
    def get_queryset(self):
        """Фильтрация пользователей в зависимости от роли"""
        user = self.request.user
        
        # Проверка для Swagger схемы и анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            return CustomUser.objects.none()
        
        user_role = user.role.name
        
        if user_role == Role.SUPERUSER:
            # Суперпользователь видит всех
            return CustomUser.objects.all()
        elif user_role == Role.ADMIN:
            # Админ видит только созданных им пользователей
            return CustomUser.objects.filter(parent_user=user)
        else:
            # Остальные видят только себя
            return CustomUser.objects.filter(id=user.id)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Активация/деактивация пользователя"""
        user = self.get_object()
        
        # Проверяем права
        if not self.request.user.role.name in [Role.SUPERUSER, Role.ADMIN]:
            return Response({
                'error': 'У вас нет прав для этого действия'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Нельзя деактивировать самого себя
        if user == request.user:
            return Response({
                'error': 'Нельзя деактивировать самого себя'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'Пользователь {"активирован" if user.is_active else "деактивирован"}',
            'is_active': user.is_active
        })
    
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Сброс пароля пользователя"""
        user = self.get_object()
        
        # Проверяем права
        if not check_user_role(request.user, [Role.SUPERUSER, Role.ADMIN]):
            return Response({
                'error': 'У вас нет прав для этого действия'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Генерируем новый пароль
        import secrets
        import string
        
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Пароль успешно сброшен',
            'new_password': new_password
        })


class RoleViewSet(ModelViewSet):
    """ViewSet для управления ролями"""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['name']
    
    def get_permissions(self):
        """Только суперпользователи могут изменять роли"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            # Добавляем проверку роли суперпользователя
            if hasattr(self.request, 'user') and self.request.user.is_authenticated:
                if self.request.user.role.name != Role.SUPERUSER:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('Только суперпользователи могут изменять роли')
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Статистика пользователей (только для админов и суперпользователей)"""
    user_role = request.user.role.name
    
    if user_role not in [Role.SUPERUSER, Role.ADMIN]:
        return Response({
            'error': 'У вас нет прав для просмотра статистики'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Базовая статистика
    if user_role == Role.SUPERUSER:
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(is_active=True).count()
        roles_stats = {}
        
        for role in Role.objects.all():
            roles_stats[role.get_name_display()] = CustomUser.objects.filter(role=role).count()
    else:
        # Админы видят только своих пользователей
        created_users = CustomUser.objects.filter(parent_user=request.user)
        total_users = created_users.count()
        active_users = created_users.filter(is_active=True).count()
        roles_stats = {}
        
        for role in Role.objects.filter(name__in=[Role.AUTHOR, Role.USER]):
            roles_stats[role.get_name_display()] = created_users.filter(role=role).count()
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': total_users - active_users,
        'roles_stats': roles_stats
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Получение информации о текущем пользователе"""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)
