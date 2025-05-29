from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Role, CustomUser


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """Админка для ролей"""
    
    list_display = ['name', 'get_name_display', 'users_count', 'created_at']
    list_filter = ['name', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name',)
        }),
        ('Временные метки', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def users_count(self, obj):
        """Количество пользователей с данной ролью"""
        count = obj.customuser_set.count()
        if count > 0:
            url = reverse('admin:accounts_customuser_changelist') + f'?role__id__exact={obj.id}'
            return format_html('<a href="{}">{} пользователей</a>', url, count)
        return '0 пользователей'
    
    users_count.short_description = 'Количество пользователей'


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Кастомная админка для пользователей"""
    
    list_display = [
        'email', 'username', 'get_full_name', 'role', 
        'is_active', 'is_staff', 'avatar_preview', 'last_login'
    ]
    list_filter = ['role', 'is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    readonly_fields = ['date_joined', 'last_login', 'avatar_preview']
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Персональная информация', {
            'fields': ('first_name', 'last_name', 'email', 'birth_date', 'about', 'avatar', 'avatar_preview')
        }),
        ('Права доступа', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Важные даты', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
    
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)
    
    def avatar_preview(self, obj):
        """Превью аватара"""
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;" />',
                obj.avatar.url
            )
        return format_html(
            '<div style="width: 50px; height: 50px; border-radius: 50%; background-color: #f0f0f0; '
            'display: flex; align-items: center; justify-content: center; color: #666;">'
            '<i class="fas fa-user"></i></div>'
        )
    
    avatar_preview.short_description = 'Аватар'
    
    def get_full_name(self, obj):
        """Полное имя пользователя"""
        full_name = obj.get_full_name()
        if full_name:
            return full_name
        return obj.username
    
    get_full_name.short_description = 'Полное имя'
    
    def get_queryset(self, request):
        """Оптимизация запросов"""
        return super().get_queryset(request).select_related('role')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Фильтрация ролей в зависимости от прав пользователя"""
        if db_field.name == "role":
            if not request.user.is_superuser:
                # Обычные админы могут назначать только роли author и user
                kwargs["queryset"] = Role.objects.filter(name__in=['author', 'user'])
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def has_change_permission(self, request, obj=None):
        """Проверка прав на изменение"""
        if obj is None:
            return True
        
        # Суперюзер может изменять всех
        if request.user.is_superuser:
            return True
        
        # Обычные админы не могут изменять суперюзеров и других админов
        if obj.is_superuser or (obj.role and obj.role.name in ['superuser', 'admin']):
            return False
        
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Проверка прав на удаление"""
        if obj is None:
            return True
        
        # Суперюзер может удалять всех, кроме себя
        if request.user.is_superuser:
            return obj != request.user
        
        # Обычные админы не могут удалять суперюзеров и админов
        if obj.is_superuser or (obj.role and obj.role.name in ['superuser', 'admin']):
            return False
        
        return True


# Настройка заголовков админки
admin.site.site_header = "FastAPI Admin - Панель управления"
admin.site.site_title = "FastAPI Admin"
admin.site.index_title = "Добро пожаловать в панель управления"
