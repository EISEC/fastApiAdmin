from rest_framework import permissions
from apps.accounts.models import Role


class SuperAdminOnlyPermission(permissions.BasePermission):
    """
    Разрешение только для суперадминистраторов
    Настройки системы должны быть доступны только суперадминистраторам
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Проверяем что у пользователя есть роль
        if not hasattr(request.user, 'role') or not request.user.role:
            return False
            
        return request.user.role.name == Role.SUPERUSER
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Проверяем что у пользователя есть роль
        if not hasattr(request.user, 'role') or not request.user.role:
            return False
            
        return request.user.role.name == Role.SUPERUSER


class SettingsPermission(permissions.BasePermission):
    """
    Кастомные разрешения для настроек:
    - Просмотр: суперадминистратор
    - Изменение: суперадминистратор
    - Создание: суперадминистратор
    - Удаление: суперадминистратор
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Проверяем что у пользователя есть роль
        if not hasattr(request.user, 'role') or not request.user.role:
            return False
        
        # Только суперадминистраторы могут работать с настройками
        return request.user.role.name == Role.SUPERUSER
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Проверяем что у пользователя есть роль
        if not hasattr(request.user, 'role') or not request.user.role:
            return False
        
        # Только суперадминистраторы могут работать с настройками
        return request.user.role.name == Role.SUPERUSER 