from rest_framework import serializers
from django.contrib.auth import get_user_model
from taggit.serializers import TagListSerializerField, TaggitSerializer
from .models import Post
from apps.sites.models import Site

User = get_user_model()


class PostListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка постов"""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    excerpt = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'image',
            'author', 'author_name', 'site', 'site_name',
            'is_published', 'views_count', 'reading_time', 
            'published_at', 'created_at'
        ]
        read_only_fields = ['author', 'slug', 'views_count', 'reading_time']
    
    def get_excerpt(self, obj):
        """Получаем краткое описание поста"""
        return obj.get_excerpt()


class PostDetailSerializer(serializers.ModelSerializer):
    """Подробный сериализатор для поста"""
    
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True)
    excerpt = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = '__all__'
        read_only_fields = ['author', 'slug', 'views_count', 'reading_time', 'created_at', 'updated_at']
    
    def get_excerpt(self, obj):
        """Получаем краткое описание поста"""
        return obj.get_excerpt()
    
    def validate_site(self, value):
        """Проверяем, что пользователь имеет доступ к сайту"""
        user = self.context['request'].user
        
        # Проверка для анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            raise serializers.ValidationError("Необходима авторизация")
        
        if user.role.name == 'superuser':
            return value
        elif user.role.name == 'admin' and value.owner != user:
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        elif user.role.name == 'author' and user not in value.assigned_users.all():
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        
        return value


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания и обновления постов"""
    
    class Meta:
        model = Post
        fields = [
            'title', 'content', 'image', 'site', 'is_published',
            'meta_title', 'meta_description', 'meta_keywords',
            'published_at'
        ]
    
    def validate_site(self, value):
        """Проверяем права доступа к сайту"""
        user = self.context['request'].user
        
        # Проверка для анонимных пользователей
        if not user.is_authenticated or not hasattr(user, 'role') or user.role is None:
            raise serializers.ValidationError("Необходима авторизация")
        
        if user.role.name == 'superuser':
            return value
        elif user.role.name == 'admin' and value.owner != user:
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        elif user.role.name == 'author' and user not in value.assigned_users.all():
            raise serializers.ValidationError("У вас нет прав на этот сайт")
        
        return value
    
    def create(self, validated_data):
        """Создание поста с автоматическим назначением автора"""
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для статистики поста"""
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'views_count', 'reading_time', 'created_at', 'updated_at']
        read_only_fields = fields 