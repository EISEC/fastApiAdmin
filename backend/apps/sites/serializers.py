from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Site
from apps.accounts.models import Role

User = get_user_model()


class SiteListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка сайтов"""
    
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    posts_count = serializers.IntegerField(source='get_posts_count', read_only=True)
    pages_count = serializers.IntegerField(source='get_pages_count', read_only=True)
    authors_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Site
        fields = [
            'id', 'name', 'domain', 'owner', 'owner_name', 
            'is_active', 'posts_count', 'pages_count', 'authors_count',
            'created_at', 'updated_at'
        ]
    
    def get_authors_count(self, obj):
        """Возвращает количество назначенных авторов"""
        return obj.get_authors().count()


class SiteDetailSerializer(serializers.ModelSerializer):
    """Подробный сериализатор сайта"""
    
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    posts_count = serializers.IntegerField(source='get_posts_count', read_only=True)
    pages_count = serializers.IntegerField(source='get_pages_count', read_only=True)
    assigned_users_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Site
        fields = [
            'id', 'name', 'domain', 'header_scripts', 'footer_scripts',
            'main_screen_settings', 'seo_settings', 'icon', 'default_image',
            'main_screen_image', 'error_403_image', 'error_404_image',
            'error_4xx_image', 'error_5xx_image', 'owner', 'owner_name',
            'owner_email', 'is_active', 'posts_count', 'pages_count',
            'assigned_users', 'assigned_users_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def get_assigned_users_details(self, obj):
        """Возвращает детальную информацию о назначенных пользователях"""
        from apps.accounts.serializers import UserListSerializer
        assigned_users = obj.assigned_users.all()
        return UserListSerializer(assigned_users, many=True).data


class SiteCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления сайтов"""
    
    assigned_users = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(),  # Заполняется динамически
        many=True,
        required=False
    )
    
    class Meta:
        model = Site
        fields = [
            'name', 'domain', 'header_scripts', 'footer_scripts',
            'main_screen_settings', 'seo_settings', 'icon', 'default_image',
            'main_screen_image', 'error_403_image', 'error_404_image',
            'error_4xx_image', 'error_5xx_image', 'is_active', 'assigned_users'
        ]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Устанавливаем queryset для assigned_users в зависимости от роли
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user_role = request.user.role.name
            
            if user_role == Role.SUPERUSER:
                # Суперпользователь может назначить любых пользователей
                self.fields['assigned_users'].queryset = User.objects.filter(
                    role__name__in=[Role.AUTHOR, Role.USER]
                )
            elif user_role == Role.ADMIN:
                # Админ может назначить только созданных им пользователей
                self.fields['assigned_users'].queryset = User.objects.filter(
                    parent_user=request.user,
                    role__name__in=[Role.AUTHOR, Role.USER]
                )
    
    def validate_domain(self, value):
        """Валидация домена"""
        import re
        
        # Базовая проверка формата домена
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        if not re.match(domain_pattern, value):
            raise serializers.ValidationError('Неверный формат домена')
        
        # Проверяем уникальность домена
        instance = getattr(self, 'instance', None)
        if Site.objects.filter(domain=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError('Сайт с таким доменом уже существует')
        
        return value.lower()
    
    def validate_main_screen_settings(self, value):
        """Валидация настроек главного экрана"""
        if not isinstance(value, dict):
            raise serializers.ValidationError('Настройки должны быть в формате JSON')
        
        # Можно добавить дополнительную валидацию структуры
        return value
    
    def validate_seo_settings(self, value):
        """Валидация SEO настроек"""
        if not isinstance(value, dict):
            raise serializers.ValidationError('SEO настройки должны быть в формате JSON')
        
        # Можно добавить валидацию обязательных SEO полей
        return value
    
    def create(self, validated_data):
        """Создание сайта с установкой владельца"""
        assigned_users = validated_data.pop('assigned_users', [])
        
        # Устанавливаем владельца
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        
        site = Site.objects.create(**validated_data)
        
        # Назначаем пользователей
        if assigned_users:
            site.assigned_users.set(assigned_users)
        
        return site
    
    def update(self, instance, validated_data):
        """Обновление сайта"""
        assigned_users = validated_data.pop('assigned_users', None)
        
        # Обновляем поля
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Обновляем назначенных пользователей если указано
        if assigned_users is not None:
            instance.assigned_users.set(assigned_users)
        
        return instance


class SiteStatsSerializer(serializers.Serializer):
    """Сериализатор для статистики сайта"""
    
    posts_total = serializers.IntegerField()
    posts_published = serializers.IntegerField()
    posts_draft = serializers.IntegerField()
    pages_total = serializers.IntegerField()
    pages_published = serializers.IntegerField()
    pages_draft = serializers.IntegerField()
    authors_count = serializers.IntegerField()
    views_total = serializers.IntegerField()


class SiteAssignUsersSerializer(serializers.Serializer):
    """Сериализатор для назначения пользователей на сайт"""
    
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    
    def validate_user_ids(self, value):
        """Валидация пользователей"""
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Пользователь не аутентифицирован')
        
        user_role = request.user.role.name
        
        # Проверяем существование пользователей
        users = User.objects.filter(id__in=value)
        if len(users) != len(value):
            raise serializers.ValidationError('Некоторые пользователи не найдены')
        
        # Проверяем права назначения
        for user in users:
            if user_role == Role.ADMIN:
                # Админ может назначать только созданных им пользователей
                if user.parent_user != request.user:
                    raise serializers.ValidationError(
                        f'Вы не можете назначить пользователя {user.username}'
                    )
            
            # Проверяем роль назначаемого пользователя
            if user.role.name not in [Role.AUTHOR, Role.USER]:
                raise serializers.ValidationError(
                    f'Пользователя с ролью {user.role.get_name_display()} нельзя назначить на сайт'
                )
        
        return value 