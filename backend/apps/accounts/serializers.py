from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Role, CustomUser

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    """Сериализатор для ролей"""
    
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'name', 'name_display', 'permissions', 'users_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_users_count(self, obj):
        """Возвращает количество пользователей с данной ролью"""
        return obj.customuser_set.count()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Кастомный сериализатор для получения JWT токенов с дополнительными данными"""
    
    username_field = 'email'  # Используем email вместо username
    
    default_error_messages = {
        'no_active_account': 'Неверный email или пароль',
        'invalid_credentials': 'Неверный email или пароль',
    }
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Добавляем дополнительные данные в токен
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role.name
        token['role_display'] = user.role.get_name_display()
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        return token
    
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            
            # Добавляем информацию о пользователе в ответ
            data.update({
                'user_id': self.user.id,
                'username': self.user.username,
                'email': self.user.email,
                'role': self.user.role.name,
                'role_display': self.user.role.get_name_display(),
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'avatar': self.user.avatar.url if self.user.avatar else None,
            })
            
            return data
        except Exception as e:
            raise serializers.ValidationError({
                'detail': str(e),
                'code': 'invalid_credentials'
            })


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации новых пользователей"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        required=False
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'birth_date', 'about'
        ]
        
    def validate(self, attrs):
        """Валидация пароля и роли"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Пароли не совпадают'
            })
        
        # Проверяем email на уникальность
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                'email': 'Пользователь с таким email уже существует'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Создание нового пользователя"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Если роль не указана, устанавливаем USER по умолчанию
        if 'role' not in validated_data:
            validated_data['role'] = Role.objects.get(name=Role.USER)
        
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для профиля пользователя"""
    
    role = RoleSerializer(read_only=True)
    role_display = serializers.CharField(source='role.get_name_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    accessible_sites_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'full_name', 'birth_date', 'about',
            'avatar', 'rating', 'is_active', 'accessible_sites_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'rating', 'created_at', 'updated_at']
    
    def get_accessible_sites_count(self, obj):
        """Возвращает количество доступных сайтов"""
        return obj.get_accessible_sites().count()


class UserListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка пользователей"""
    
    role = RoleSerializer(read_only=True)
    role_display = serializers.CharField(source='role.get_name_display', read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 
            'role_display', 'is_active', 'created_at'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания пользователей администраторами"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'birth_date', 'about', 'is_active'
        ]
    
    def validate_role(self, value):
        """Валидация роли при создании пользователя"""
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError('Пользователь не аутентифицирован')
        
        user_role = request.user.role.name
        
        # Суперпользователь может создавать любые роли
        if user_role == Role.SUPERUSER:
            return value
        
        # Админы могут создавать только авторов и пользователей
        if user_role == Role.ADMIN:
            if value.name not in [Role.AUTHOR, Role.USER]:
                raise serializers.ValidationError(
                    'Вы можете создавать только авторов и пользователей'
                )
            return value
        
        raise serializers.ValidationError('У вас нет прав для создания пользователей')
    
    def create(self, validated_data):
        """Создание пользователя с установкой родительского пользователя"""
        password = validated_data.pop('password')
        
        # Устанавливаем родительского пользователя
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['parent_user'] = request.user
        
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Сериализатор для смены пароля"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate_old_password(self, value):
        """Проверка старого пароля"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Неверный текущий пароль')
        return value
    
    def validate(self, attrs):
        """Проверка совпадения новых паролей"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Пароли не совпадают'
            })
        return attrs
    
    def save(self):
        """Сохранение нового пароля"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user 