from rest_framework.permissions import BasePermission


class DynamicModelPermission(BasePermission):
    """Права доступа к динамическим моделям"""
    
    def has_permission(self, request, view):
        """Проверка общих прав доступа"""
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админы могут создавать и управлять моделями для своих сайтов
        if user_role == 'admin':
            return True
        
        # Авторы могут только просматривать модели и заполнять данные
        if user_role == 'author':
            return view.action in ['list', 'retrieve']
        
        # Пользователи не имеют доступа к управлению моделями
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа на уровне объекта"""
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админы могут работать только с моделями своих сайтов
        if user_role == 'admin':
            return obj.site.owner == request.user
        
        # Авторы могут работать с моделями сайтов, где они назначены
        if user_role == 'author':
            if view.action in ['list', 'retrieve']:
                return request.user in obj.site.assigned_users.all()
        
        return False


class DynamicModelDataPermission(BasePermission):
    """Права доступа к данным динамических моделей"""
    
    def has_permission(self, request, view):
        """Проверка общих прав доступа"""
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админы и авторы могут работать с данными
        if user_role in ['admin', 'author']:
            return True
        
        # Пользователи не имеют доступа
        return False
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа на уровне объекта"""
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админы могут работать с данными моделей своих сайтов
        if user_role == 'admin':
            return obj.dynamic_model.site.owner == request.user
        
        # Авторы могут работать с данными, если назначены на сайт
        if user_role == 'author':
            return request.user in obj.dynamic_model.site.assigned_users.all()
        
        return False


class DynamicModelManagementPermission(BasePermission):
    """Права доступа к управлению динамическими моделями (версии, расширения, разрешения)"""
    
    def has_permission(self, request, view):
        """Проверка общих прав доступа"""
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Только суперадмины и админы могут управлять моделями
        return user_role in ['superuser', 'admin']
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа на уровне объекта"""
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Суперадмин имеет все права
        if user_role == 'superuser':
            return True
        
        # Админы могут управлять только своими моделями
        if user_role == 'admin':
            # Определяем сайт в зависимости от типа объекта
            if hasattr(obj, 'site'):
                return obj.site.owner == request.user
            elif hasattr(obj, 'dynamic_model'):
                return obj.dynamic_model.site.owner == request.user
        
        return False


class DynamicFieldTypePermission(BasePermission):
    """Права доступа к типам полей (только для суперадминов)"""
    
    def has_permission(self, request, view):
        """Проверка общих прав доступа"""
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Только суперадмины могут управлять типами полей
        if user_role == 'superuser':
            return True
        
        # Остальные могут только просматривать
        return view.action in ['list', 'retrieve']
    
    def has_object_permission(self, request, view, obj):
        """Проверка прав доступа на уровне объекта"""
        user_role = request.user.role.name if hasattr(request.user, 'role') and request.user.role else None
        
        # Только суперадмины могут изменять типы полей
        if user_role == 'superuser':
            return True
        
        # Остальные могут только просматривать
        return view.action in ['retrieve'] 