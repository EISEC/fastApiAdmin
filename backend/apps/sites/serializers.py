from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Site, SiteRequest
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


class SiteRequestListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка запросов на доступ к сайтам"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    site_domain = serializers.CharField(source='site.domain', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    class Meta:
        model = SiteRequest
        fields = [
            'id', 'user', 'user_name', 'user_email', 'site', 'site_name', 'site_domain',
            'requested_role', 'status', 'message', 'admin_response', 'reviewed_by', 
            'reviewed_by_name', 'created_at', 'updated_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'user', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
        ]


class SiteRequestDetailSerializer(serializers.ModelSerializer):
    """Подробный сериализатор запроса на доступ к сайту"""
    
    user_details = serializers.SerializerMethodField()
    site_details = serializers.SerializerMethodField()
    reviewed_by_details = serializers.SerializerMethodField()
    can_review = serializers.SerializerMethodField()
    
    class Meta:
        model = SiteRequest
        fields = [
            'id', 'user', 'user_details', 'site', 'site_details', 'requested_role',
            'message', 'status', 'admin_response', 'reviewed_by', 'reviewed_by_details',
            'can_review', 'created_at', 'updated_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'user', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
        ]
    
    def get_user_details(self, obj):
        """Детальная информация о пользователе"""
        from apps.accounts.serializers import UserListSerializer
        return UserListSerializer(obj.user).data
    
    def get_site_details(self, obj):
        """Детальная информация о сайте"""
        return {
            'id': obj.site.id,
            'name': obj.site.name,
            'domain': obj.site.domain,
            'owner_name': obj.site.owner.get_full_name(),
            'owner_email': obj.site.owner.email,
            'is_active': obj.site.is_active,
        }
    
    def get_reviewed_by_details(self, obj):
        """Детальная информация о том, кто рассмотрел запрос"""
        if obj.reviewed_by:
            from apps.accounts.serializers import UserListSerializer
            return UserListSerializer(obj.reviewed_by).data
        return None
    
    def get_can_review(self, obj):
        """Может ли текущий пользователь рассматривать этот запрос"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_be_reviewed_by(request.user)
        return False


class SiteRequestCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания запроса на доступ к сайту"""
    
    class Meta:
        model = SiteRequest
        fields = ['site', 'requested_role', 'message']
    
    def validate_site(self, value):
        """Валидация сайта"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Пользователь не аутентифицирован')
        
        user = request.user
        
        # Проверяем, что сайт активен
        if not value.is_active:
            raise serializers.ValidationError('Нельзя запросить доступ к неактивному сайту')
        
        # Проверяем, что пользователь еще не имеет доступа к сайту
        if user in value.assigned_users.all():
            raise serializers.ValidationError('У вас уже есть доступ к этому сайту')
        
        # Проверяем, что у пользователя нет активного запроса к этому сайту
        if SiteRequest.objects.filter(user=user, site=value, status='pending').exists():
            raise serializers.ValidationError('У вас уже есть активный запрос к этому сайту')
        
        # Проверяем, что пользователь не является владельцем сайта
        if value.owner == user:
            raise serializers.ValidationError('Вы являетесь владельцем этого сайта')
        
        return value
    
    def validate_requested_role(self, value):
        """Валидация запрашиваемой роли"""
        valid_roles = [choice[0] for choice in SiteRequest.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f'Недопустимая роль. Доступные роли: {valid_roles}')
        
        return value
    
    def create(self, validated_data):
        """Создание запроса с установкой пользователя"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return super().create(validated_data)


class SiteRequestReviewSerializer(serializers.ModelSerializer):
    """Сериализатор для рассмотрения запроса на доступ к сайту"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'], write_only=True)
    
    class Meta:
        model = SiteRequest
        fields = ['action', 'admin_response']
    
    def validate(self, attrs):
        """Валидация данных для рассмотрения"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Пользователь не аутентифицирован')
        
        # Проверяем права на рассмотрение
        if not self.instance.can_be_reviewed_by(request.user):
            raise serializers.ValidationError('У вас нет прав для рассмотрения этого запроса')
        
        # Проверяем, что запрос ожидает рассмотрения
        if self.instance.status != 'pending':
            raise serializers.ValidationError('Можно рассматривать только ожидающие запросы')
        
        return attrs
    
    def update(self, instance, validated_data):
        """Обновление статуса запроса"""
        action = validated_data.pop('action')
        admin_response = validated_data.get('admin_response', '')
        
        request = self.context.get('request')
        admin_user = request.user
        
        if action == 'approve':
            instance.approve(admin_user, admin_response)
        elif action == 'reject':
            instance.reject(admin_user, admin_response)
        
        return instance 