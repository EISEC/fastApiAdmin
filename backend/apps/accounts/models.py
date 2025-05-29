from django.contrib.auth.models import AbstractUser
from django.db import models
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.sites.models import Site


class Role(models.Model):
    """Модель ролей пользователей"""
    
    # Константы ролей
    SUPERUSER = 'superuser'
    ADMIN = 'admin'
    AUTHOR = 'author'
    USER = 'user'
    
    ROLE_CHOICES = [
        (SUPERUSER, 'Суперпользователь'),
        (ADMIN, 'Администратор'),
        (AUTHOR, 'Автор'),
        (USER, 'Пользователь'),
    ]
    
    name = models.CharField(
        max_length=50, 
        choices=ROLE_CHOICES, 
        unique=True,
        verbose_name='Название роли'
    )
    permissions = models.JSONField(
        default=dict,
        verbose_name='Разрешения',
        help_text='JSON с разрешениями для роли'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'
        ordering = ['name']
        
    def __str__(self) -> str:
        return self.get_name_display()


class CustomUser(AbstractUser):
    """Кастомная модель пользователя"""
    
    email = models.EmailField(
        unique=True,
        verbose_name='Email',
        help_text='Уникальный email адрес пользователя'
    )
    birth_date = models.DateField(
        null=True, 
        blank=True,
        verbose_name='Дата рождения'
    )
    about = models.TextField(
        blank=True,
        verbose_name='О себе',
        help_text='Краткое описание пользователя'
    )
    avatar = models.ImageField(
        upload_to='avatars/', 
        null=True, 
        blank=True,
        verbose_name='Аватар'
    )
    site = models.ForeignKey(
        'sites.Site',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Основной сайт',
        help_text='Сайт, к которому привязан пользователь'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        verbose_name='Роль',
        help_text='Роль пользователя в системе'
    )
    parent_user = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name='Родительский пользователь',
        help_text='Пользователь, который создал данного пользователя'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен',
        help_text='Определяет, активен ли аккаунт пользователя'
    )
    rating = models.IntegerField(
        default=0,
        verbose_name='Рейтинг',
        help_text='Рейтинг пользователя в системе'
    )
    assigned_sites = models.ManyToManyField(
        'sites.Site',
        related_name='assigned_users',
        blank=True,
        verbose_name='Назначенные сайты',
        help_text='Сайты, к которым у пользователя есть доступ'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Используем email как основное поле для входа
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-created_at']
        
    def __str__(self) -> str:
        return f"{self.username} ({self.email})"
    
    def get_full_name(self) -> str:
        """Возвращает полное имя пользователя"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def has_role(self, role_name: str) -> bool:
        """Проверяет, имеет ли пользователь определенную роль"""
        return self.role.name == role_name
    
    def can_manage_site(self, site: 'Site') -> bool:
        """Проверяет, может ли пользователь управлять сайтом"""
        if self.has_role(Role.SUPERUSER):
            return True
        elif self.has_role(Role.ADMIN):
            return site.owner == self
        elif self.has_role(Role.AUTHOR):
            return self in site.assigned_users.all()
        return False
    
    def get_accessible_sites(self):
        """Возвращает сайты, доступные для пользователя"""
        if self.has_role(Role.SUPERUSER):
            from apps.sites.models import Site
            return Site.objects.all()
        elif self.has_role(Role.ADMIN):
            return self.owned_sites.all()
        elif self.has_role(Role.AUTHOR):
            return self.assigned_sites.all()
        return self.site.objects.none() if self.site else []
