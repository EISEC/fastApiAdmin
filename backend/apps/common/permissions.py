from rest_framework.permissions import BasePermission
from django.core.exceptions import PermissionDenied
from apps.accounts.models import Role


class RoleBasedPermission(BasePermission):
    """Базовый класс для проверки разрешений на основе ролей"""
    
    def has_permission(self, request, view):
        """Проверяет общие разрешения на уровне view"""
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name
        
        # Суперпользователь может все
        if user_role == Role.SUPERUSER:
            return True
            
        return self.check_role_permission(request, view, user_role)
    
    def check_role_permission(self, request, view, user_role):
        """Переопределяется в дочерних классах для специфических проверок"""
        return False


class SitePermission(RoleBasedPermission):
    """Разрешения для работы с сайтами"""
    
    def check_role_permission(self, request, view, user_role):
        """Проверка разрешений для сайтов"""
        if user_role == Role.ADMIN:
            # Админы могут создавать и управлять своими сайтами
            return True
        elif user_role == Role.AUTHOR:
            # Авторы могут только просматривать назначенные им сайты
            return view.action in ['list', 'retrieve']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешений на уровне объекта"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return True
        elif user_role == Role.ADMIN:
            # Админы могут управлять только своими сайтами
            return obj.owner == request.user
        elif user_role == Role.AUTHOR:
            # Авторы могут только просматривать назначенные им сайты
            if view.action in ['retrieve', 'list']:
                return request.user in obj.assigned_users.all()
            return False
        
        return False


class PostPermission(RoleBasedPermission):
    """Разрешения для работы с постами"""
    
    def check_role_permission(self, request, view, user_role):
        """Проверка разрешений для постов"""
        if user_role in [Role.ADMIN, Role.AUTHOR]:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешений на уровне объекта"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return True
        elif user_role == Role.ADMIN:
            # Админы могут управлять постами на своих сайтах
            return obj.site.owner == request.user
        elif user_role == Role.AUTHOR:
            # Авторы могут редактировать свои посты или посты на назначенных сайтах
            return (obj.author == request.user or 
                   request.user in obj.site.assigned_users.all())
        
        return False


class PagePermission(RoleBasedPermission):
    """Разрешения для работы со страницами"""
    
    def check_role_permission(self, request, view, user_role):
        """Проверка разрешений для страниц"""
        if user_role in [Role.ADMIN, Role.AUTHOR]:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешений на уровне объекта"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return True
        elif user_role == Role.ADMIN:
            # Админы могут управлять страницами на своих сайтах
            return obj.site.owner == request.user
        elif user_role == Role.AUTHOR:
            # Авторы могут редактировать свои страницы или страницы на назначенных сайтах
            return (obj.author == request.user or 
                   request.user in obj.site.assigned_users.all())
        
        return False


class DynamicModelPermission(RoleBasedPermission):
    """Разрешения для работы с динамическими моделями"""
    
    def check_role_permission(self, request, view, user_role):
        """Проверка разрешений для динамических моделей"""
        if user_role in [Role.ADMIN, Role.AUTHOR]:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешений на уровне объекта"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return True
        elif user_role == Role.ADMIN:
            # Админы могут управлять динамическими моделями на своих сайтах
            return obj.site.owner == request.user
        elif user_role == Role.AUTHOR:
            # Авторы могут только просматривать динамические модели на назначенных сайтах
            if view.action in ['retrieve', 'list']:
                return request.user in obj.site.assigned_users.all()
            return False
        
        return False


class UserPermission(RoleBasedPermission):
    """Разрешения для работы с пользователями"""
    
    def check_role_permission(self, request, view, user_role):
        """Проверка разрешений для пользователей"""
        if user_role == Role.ADMIN:
            # Админы могут создавать авторов
            return True
        elif user_role == Role.AUTHOR:
            # Авторы могут только просматривать свой профиль
            return view.action in ['retrieve', 'partial_update'] 
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка разрешений на уровне объекта"""
        user_role = request.user.role.name
        
        if user_role == Role.SUPERUSER:
            return True
        elif user_role == Role.ADMIN:
            # Админы могут управлять только созданными ими пользователями
            return obj.parent_user == request.user or obj == request.user
        elif user_role == Role.AUTHOR:
            # Авторы могут редактировать только свой профиль
            return obj == request.user
        
        return False


class IsOwnerOrReadOnly(BasePermission):
    """
    Разрешение, которое позволяет только владельцам объекта редактировать его.
    """
    
    def has_object_permission(self, request, view, obj):
        # Права на чтение разрешены для любого запроса,
        # поэтому мы всегда разрешаем GET, HEAD или OPTIONS запросы.
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True

        # Права на запись только для владельца объекта.
        return obj.owner == request.user


class IsSuperUserOrReadOnly(BasePermission):
    """
    Разрешение только для суперпользователей на запись, остальным только чтение.
    """
    
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        
        return (request.user.is_authenticated and 
                request.user.role.name == Role.SUPERUSER)


class CanManageSite(BasePermission):
    """
    Проверяет, может ли пользователь управлять сайтом
    """
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Если объект имеет атрибут site
        if hasattr(obj, 'site'):
            return obj.site.can_user_access(request.user)
        
        # Если объект сам является сайтом
        if hasattr(obj, 'can_user_access'):
            return obj.can_user_access(request.user)
        
        return False


def check_user_role(user, required_roles):
    """
    Утилитарная функция для проверки роли пользователя
    
    Args:
        user: Пользователь
        required_roles: Список или строка с требуемыми ролями
    
    Returns:
        bool: True если пользователь имеет одну из требуемых ролей
    """
    if not user.is_authenticated:
        return False
    
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    return user.role.name in required_roles


def require_role(roles):
    """
    Декоратор для проверки ролей пользователя
    
    Usage:
        @require_role(['admin', 'superuser'])
        def my_view(request):
            ...
    """
    def decorator(view_func):
        def wrapped_view(request, *args, **kwargs):
            if not check_user_role(request.user, roles):
                raise PermissionDenied("У вас нет прав для выполнения этого действия")
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator 